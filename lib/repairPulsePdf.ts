import { cleanText, normalizeStage, normalizeTechnicianName, UNASSIGNED_TECH_NAME } from "@/lib/stages";
import type { ParsedRow } from "@/lib/workload";

type PdfTextItem = {
  text: string;
  x: number;
  y: number;
  width: number;
  pageNumber: number;
};

type ColumnKey = "days" | "roNumber" | "customer" | "vehicle" | "tech" | "estimator" | "insurance" | "phase" | "hours";

type ColumnSpec = {
  key: ColumnKey;
  minX: number;
  maxX: number;
};

// These boundaries match the direct Repair Pulse Production List PDF export.
// They are intentionally based on the PDF table coordinates instead of OCR so the import is deterministic.
const COLUMNS: ColumnSpec[] = [
  { key: "days", minX: 73, maxX: 95 },
  { key: "roNumber", minX: 94, maxX: 128 },
  { key: "customer", minX: 126, maxX: 205 },
  { key: "vehicle", minX: 264, maxX: 346 },
  { key: "tech", minX: 391, maxX: 434 },
  { key: "estimator", minX: 434, maxX: 469 },
  { key: "insurance", minX: 484, maxX: 575 },
  { key: "phase", minX: 575, maxX: 628 },
  { key: "hours", minX: 654, maxX: 680 },
];

function parseNumber(value: string): number {
  const parsed = Number(cleanText(value).replace(/[$,]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function lineAwareJoin(items: PdfTextItem[]): string {
  if (!items.length) return "";
  const sorted = [...items].sort((a, b) => a.y - b.y || a.x - b.x);
  const lines: PdfTextItem[][] = [];

  for (const item of sorted) {
    const existing = lines.find((line) => Math.abs(line[0].y - item.y) <= 3);
    if (existing) existing.push(item);
    else lines.push([item]);
  }

  return lines
    .map((line) => line.sort((a, b) => a.x - b.x).map((item) => item.text).join(" "))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

async function extractTextItems(buffer: Buffer): Promise<PdfTextItem[]> {
  const pdfjs: any = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    disableFontFace: true,
    isEvalSupported: false,
    useWorkerFetch: false,
    disableWorker: true,
  });
  const pdf = await loadingTask.promise;
  const items: PdfTextItem[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent({ disableCombineTextItems: false });

    for (const rawItem of content.items as any[]) {
      const text = cleanText(rawItem.str);
      if (!text) continue;
      const transform = rawItem.transform || [1, 0, 0, 1, 0, 0];
      const x = Number(transform[4] || 0);
      const y = Number(viewport.height - (transform[5] || 0));
      items.push({ text, x, y: y + (pageNumber - 1) * 1000, width: Number(rawItem.width || 0), pageNumber });
    }
  }

  return items;
}

function getColumnItems(rowItems: PdfTextItem[], column: ColumnSpec): PdfTextItem[] {
  return rowItems.filter((item) => item.x >= column.minX && item.x < column.maxX);
}

function getColumnText(rowItems: PdfTextItem[], key: ColumnKey): string {
  const column = COLUMNS.find((col) => col.key === key);
  if (!column) return "";
  return lineAwareJoin(getColumnItems(rowItems, column));
}

function cleanRepairPulseTechnicianName(value: string): string {
  return normalizeTechnicianName(value)
    // Repair Pulse repeats the table header on each page. If the PDF text extraction
    // bleeds the next page header into the previous row, the Tech column can become
    // "Chris Baldwin Tech" and create a fake technician. Strip that header artifact.
    .replace(/^Tech\s+/i, "")
    .replace(/\s+Tech\s*$/i, "")
    .replace(/\b(Est|BP|Insurance|Phase|Hours|Sublet|Total|Ver)\b.*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isBadTechnicianName(value: string): boolean {
  const normalized = normalizeTechnicianName(value);
  if (!normalized) return true;
  if (/^(tech|est|bp|insurance|phase|hours|sublet|total|ver)$/i.test(normalized)) return true;
  if (/\s+Tech$/i.test(normalized)) return true;
  if (/\b(Est|BP|Insurance|Phase|Hours|Sublet|Total|Ver)\b/i.test(normalized)) return true;
  return false;
}

function isValidImportedRow(row: ParsedRow): boolean {
  if (!/^39\d{5}$/.test(row.roNumber)) return false;
  if (!row.stage || /^(phase|parts|hours|total|ver)$/i.test(row.stage)) return false;
  if (!Number.isFinite(row.roHours) || row.roHours < 0) return false;
  if (normalizeTechnicianName(row.technician) !== UNASSIGNED_TECH_NAME && isBadTechnicianName(row.technician)) return false;
  return true;
}

export async function parseRepairPulsePdf(buffer: Buffer): Promise<ParsedRow[]> {
  const items = await extractTextItems(buffer);

  const roAnchors = items
    .filter((item) => /^39\d{5}$/.test(item.text) && item.x >= 90 && item.x <= 130)
    .sort((a, b) => a.y - b.y || a.x - b.x);

  const rows: ParsedRow[] = [];

  for (let index = 0; index < roAnchors.length; index++) {
    const anchor = roAnchors[index];
    const nextAnchor = roAnchors[index + 1];
    const rowTop = anchor.y - 2;
    const samePageNextAnchor = nextAnchor && nextAnchor.pageNumber === anchor.pageNumber ? nextAnchor : undefined;
    const pageBottom = anchor.pageNumber * 1000;
    const rowBottom = samePageNextAnchor ? samePageNextAnchor.y - 2 : Math.min(pageBottom, anchor.y + 55);
    const rowItems = items.filter((item) => item.pageNumber === anchor.pageNumber && item.y >= rowTop && item.y < rowBottom);

    const roNumber = cleanText(anchor.text);
    const owner = cleanText(getColumnText(rowItems, "customer"));
    const vehicle = cleanText(getColumnText(rowItems, "vehicle"));
    const estimator = cleanText(getColumnText(rowItems, "estimator"));
    const technician = cleanRepairPulseTechnicianName(getColumnText(rowItems, "tech")) || UNASSIGNED_TECH_NAME;
    const stage = normalizeStage(getColumnText(rowItems, "phase"));
    const insurance = cleanText(getColumnText(rowItems, "insurance"));
    const daysInShop = Math.round(parseNumber(getColumnText(rowItems, "days")));
    const roHours = parseNumber(getColumnText(rowItems, "hours"));

    const row = { roNumber, owner, vehicle, estimator, technician, stage, insurance, daysInShop, roHours };
    if (!isValidImportedRow(row)) continue;
    rows.push(row);
  }

  return rows;
}
