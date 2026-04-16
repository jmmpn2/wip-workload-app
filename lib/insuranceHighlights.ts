import { cleanText } from "@/lib/stages";

export function normalizeInsuranceName(value: unknown) {
  return cleanText(value).toLowerCase();
}

export function isHighlightedInsurance(insurance: unknown, highlighted: Iterable<string>) {
  const key = normalizeInsuranceName(insurance);
  if (!key) return false;
  for (const item of highlighted) {
    if (normalizeInsuranceName(item) === key) return true;
  }
  return false;
}

export function highlightedInsuranceLabel(insurance: string) {
  return insurance ? `★ Focus insurer: ${insurance}` : "★ Focus insurer";
}
