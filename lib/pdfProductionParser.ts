import { cleanText, normalizeStage, normalizeTechnicianName, UNASSIGNED_TECH_NAME } from "@/lib/stages";

type ParsedRow = {
  roNumber: string;
  owner: string;
  vehicle: string;
  estimator: string;
  technician: string;
  stage: string;
  roHours: number;
};

type PdfWord = {
  text: string;
  x: number;
  y: number;
};

type PdfLine = PdfWord[];

type RawPdfRow = {
  ro: string[];
  customer: string[];
  vehicle: string[];
  tech: string[];
  estimator: string[];
  insurance: string[];
  phase: string[];
  hours: string[];
};

const COLUMN_RANGES = {
  ro: [90, 125],
  customer: [125, 255],
  vehicle: [255, 349],
  tech: [395, 438],
  estimator: [438, 487],
  insurance: [487, 576],
  phase: [576, 657],
  hours: [657, 681],
} as const;

function makeEmptyRawRow(): RawPdfRow {
  return {
    ro: [],
    customer: [],
    vehicle: [],
    tech: [],
    estimator: [],
    insurance: [],
    phase: [],
    hours: [],
  };
}

function classifyColumn(x: number): keyof RawPdfRow | null {
  for (const [name, range] of Object.entries(COLUMN_RANGES) as Array<[keyof typeof COLUMN_RANGES, readonly number[]]>) {
    if (x >= range[0] && x < range[1]) return name;
  }
  return null;
}

function normalizeWord(text: string) {
  return cleanText(text)
    .replace(/\u0000/g, "")
    .replace(/[\u2010\u2011\u2012\u2013\u2014]/g, "-");
}

function lineKey(y: number) {
  return Math.round(y / 2) * 2;
}

function sortWordsIntoLines(words: PdfWord[]): PdfLine[] {
  const buckets = new Map<number, PdfWord[]>();
  for (const word of words) {
    const key = lineKey(word.y);
    const line = buckets.get(key) ?? [];
    line.push(word);
    buckets.set(key, line);
  }

  return [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, line]) => line.sort((a, b) => a.x - b.x));
}

function collectPageWords(items: any[]): PdfWord[] {
  const words: PdfWord[] = [];
  for (const item of items) {
    const text = normalizeWord(typeof item?.str === "string" ? item.str : "");
    if (!text) continue;
    const transform = Array.isArray(item?.transform) ? item.transform : [];
    const x = Number(transform[4] ?? 0);
    const y = Number(transform[5] ?? 0);
    if (Number.isNaN(x) || Number.isNaN(y)) continue;
    words.push({ text, x, y });
  }
  return words;
}

function finalizeRawRow(raw: RawPdfRow): ParsedRow | null {
  const roNumber = cleanText(raw.ro.join(" "));
  const owner = cleanText(raw.customer.join(" "));
  const vehicle = cleanText(raw.vehicle.join(" "));
  const estimator = cleanText(raw.estimator.join(" "));
  const technicianRaw = cleanText(raw.tech.join(" "));
  const technician = normalizeTechnicianName(technicianRaw) || UNASSIGNED_TECH_NAME;
  const stage = normalizeStage(raw.phase.join(" "));
  const roHours = Number(cleanText(raw.hours.join(" ")).replace(/,/g, ""));

  if (!/^390\d{4}$/.test(roNumber)) return null;
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

export async function parsePdfProductionList(buffer: Buffer): Promise<ParsedRow[]> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const pdfWorker = 

  // In the Next/Railway server bundle, letting PDF.js discover its own worker
  // can fail because the generated chunk path is not available at runtime.
  // Preloading the worker module here gives the fake-worker path a handler to use
  // without trying to dynamically import /.next/server/chunks/pdf.worker.mjs.
  (globalThis as any).pdfjsWorker = pdfWorker;

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
    disableFontFace: true,
    isEvalSupported: false,
    disableWorker: true,
  } as any);

  const pdf = await loadingTask.promise;
  const rows: ParsedRow[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const words = collectPageWords(textContent.items as any[]);
    const lines = sortWordsIntoLines(words);
    let current = makeEmptyRawRow();
    let inDataSection = false;

    for (const line of lines) {
      if (line.some((word) => word.text === "RO") && line.some((word) => word.text === "Customer")) {
        inDataSection = true;
        continue;
      }

      const roToken = line.find((word) => word.x >= COLUMN_RANGES.ro[0] && word.x < COLUMN_RANGES.ro[1] && /^390\d{4}$/.test(word.text))?.text;
      if (!roToken && !inDataSection) continue;

      if (roToken) {
        const parsed = finalizeRawRow(current);
        if (parsed) rows.push(parsed);
        current = makeEmptyRawRow();
      }

      if (!inDataSection) continue;

      for (const word of line) {
        const column = classifyColumn(word.x);
        if (!column) continue;
        current[column].push(word.text);
      }
    }

    const parsed = finalizeRawRow(current);
    if (parsed) rows.push(parsed);
  }

  return rows;
}
