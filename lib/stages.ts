export const STANDARD_STAGES = [
  "Check in","Disassembly","A+","Waiting on Authorization","Waiting on Parts",
  "Body","Paint","Reassembly","Mechanical","PDR/Sublet","Detail","Ready for QC",
];
export const UNASSIGNED_TECH_NAME = "Unassigned";
export const STAGE_COLORS: string[] = [
  "#64748b","#3b82f6","#06b6d4","#f59e0b","#eab308","#8b5cf6",
  "#ef4444","#10b981","#14b8a6","#a855f7","#f97316","#22c55e"
];
export function cleanText(value: unknown) {
  return String(value ?? "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeStageKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

const STAGE_ALIAS_MAP = new Map<string, string>([
  [normalizeStageKey("Check in"), "Check in"],
  [normalizeStageKey("Check-in"), "Check in"],
  [normalizeStageKey("Disassembly"), "Disassembly"],
  [normalizeStageKey("A+"), "A+"],
  [normalizeStageKey("Waiting on Authorization"), "Waiting on Authorization"],
  [normalizeStageKey("Waiting on Parts"), "Waiting on Parts"],
  [normalizeStageKey("Body"), "Body"],
  [normalizeStageKey("Paint"), "Paint"],
  [normalizeStageKey("Reassembly"), "Reassembly"],
  [normalizeStageKey("Mechanical"), "Mechanical"],
  [normalizeStageKey("PDR/Sublet"), "PDR/Sublet"],
  [normalizeStageKey("PDR / Sublet"), "PDR/Sublet"],
  [normalizeStageKey("PDR Sublet"), "PDR/Sublet"],
  [normalizeStageKey("Detail"), "Detail"],
  [normalizeStageKey("Ready for QC"), "Ready for QC"],
]);

export function normalizeStage(value: unknown) {
  const cleaned = cleanText(value);
  return STAGE_ALIAS_MAP.get(normalizeStageKey(cleaned)) ?? cleaned;
}
export function normalizeTechnicianName(value: unknown) { return cleanText(value); }
export function roundHours(value: number) { return Math.round(value || 0); }
##
