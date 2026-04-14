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
export function normalizeStage(value: unknown) {
  const cleaned = cleanText(value);
  return STANDARD_STAGES.find((stage) => stage.toLowerCase() === cleaned.toLowerCase()) ?? cleaned;
}
export function normalizeTechnicianName(value: unknown) { return cleanText(value); }
export function roundHours(value: number) { return Math.round(value || 0); }
