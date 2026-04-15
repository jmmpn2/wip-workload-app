import { cleanText, normalizeStage, normalizeTechnicianName, UNASSIGNED_TECH_NAME } from "@/lib/stages";
import type { ParsedRow } from "@/lib/workload";

type TextItem = { str?: string; transform?: number[] };

type PositionedText = {
  x: number;
  y: number;
  text: string;
};

type TextLine = {
  y: number;
  items: PositionedText[];
};

const COL = {
  roMin: 90,
  roMax: 128,
  customerMin: 124,
  customerMax: 197,
  vehicleMin: 214,
  vehicleMax: 349,
  techMin: 390,
  techMax: 438,
  estimatorMin: 438,
  estimatorMax: 486,
  phaseMin: 576,
  phaseMax: 628,
  hoursMin: 651,
  hoursMax: 681,
};

const ROW_START_RE = /^390\d{4}$/;

function sortAndJoin(items: PositionedText[]) {
  return items
    .slice()
    .sort((a, b) => a.x - b.x)
    .map((item) => item.text)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function isInRange(x: number, min: number, max: number) {
  return x >= min && x < max;
}

function groupLines(items: PositionedText[]) {
  const sorted = items
    .filter((item) => item.text)
    .sort((a, b) => (b.y - a.y) || (a.x - b.x));

  const lines: TextLine[] = [];
  for (const item of sorted) {
    const existing = lines.find((line) => Math.abs(line.y - item.y) <= 2.5);
    if (existing) {
      existing.items.push(item);
      existing.y = (existing.y + item.y) / 2;
    } else {
      lines.push({ y: item.y, items: [item] });
    }
  }

  return lines
    .map((line) => ({ y: line.y, items: line.items.sort((a, b) => a.x - b.x) }))
    .sort((a, b) => b.y - a.y);
}

function lineStartsRow(line: TextLine) {
  return line.items.some((item) => isInRange(item.x, COL.roMin, COL.roMax) && ROW_START_RE.test(item.text));
}

function collectColumn(block: TextLine[], min: number, max: number) {
  const values = block.flatMap((line) => line.items.filter((item) => isInRange(item.x, min, max)));
  return cleanText(sortAndJoin(values));
}

function collectRo(block: TextLine[]) {
  for (const line of block) {
    for (const item of line.items) {
      if (isInRange(item.x, COL.roMin, COL.roMax) && ROW_START_RE.test(item.text)) {
        return item.text;
      }
    }
  }
  return "";
}

function toParsedRow(block: TextLine[]): ParsedRow | null {
  const roNumber = collectRo(block);
  if (!roNumber) return null;

  const owner = collectColumn(block, COL.customerMin, COL.customerMax);
  const vehicle = collectColumn(block, COL.vehicleMin, COL.vehicleMax);
  const estimator = collectColumn(block, COL.estimatorMin, COL.estimatorMax);
  const technicianRaw = collectColumn(block, COL.techMin, COL.techMax);
  const technician = normalizeTechnicianName(technicianRaw) || UNASSIGNED_TECH_NAME;
  const stage = normalizeStage(collectColumn(block, COL.phaseMin, COL.phaseMax));
  const hoursText = collectColumn(block, COL.hoursMin, COL.hoursMax).replace(/,/g, "");
  const roHours = Number(hoursText);

  if (!stage || Number.isNaN(roHours)) return null;

  return {
    roNumber,
    owner,
    vehicle,
    estimator,
    technician,
    stage,
    roHours,
  };
}

export async function parseProductionPdf(buffer: Buffer): Promise<ParsedRow[]> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
    disableFontFace: true,
    isEvalSupported: false,
    disableWorker: true,
  } as any);

  const pdf = await loadingTask.promise;
  const rows: ParsedRow[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const items = (textContent.items as TextItem[])
      .map((item) => ({
        text: cleanText(item.str ?? ""),
        x: Number(item.transform?.[4] ?? 0),
        y: Number(item.transform?.[5] ?? 0),
      }))
      .filter((item) => item.text);

    const lines = groupLines(items).filter((line) => {
      const joined = sortAndJoin(line.items).toLowerCase();
      return !joined.includes("production list")
        && !joined.includes("vehicles")
        && !joined.includes("in out days ro # customer")
        && !joined.includes("page ");
    });

    let current: TextLine[] = [];
    for (const line of lines) {
      if (lineStartsRow(line)) {
        if (current.length) {
          const parsed = toParsedRow(current);
          if (parsed) rows.push(parsed);
        }
        current = [line];
      } else if (current.length) {
        current.push(line);
      }
    }

    if (current.length) {
      const parsed = toParsedRow(current);
      if (parsed) rows.push(parsed);
    }
  }

  const deduped = new Map<string, ParsedRow>();
  for (const row of rows) {
    deduped.set(row.roNumber, row);
  }
  return Array.from(deduped.values());
}
