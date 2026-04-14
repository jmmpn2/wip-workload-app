import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
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

function detectHeaderRow(rows: any[][]): number {
  for (let i = 0; i < Math.min(rows.length, 12); i++) {
    const vals = rows[i].map((v) => cleanText(v).toLowerCase());
    if (vals.includes("ro #") && vals.includes("customer") && vals.includes("tech") && vals.includes("phase") && vals.includes("hours")) return i;
  }
  return 0;
}

export function parseWorkbook(buffer: Buffer): ParsedRow[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const matrix = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: "", raw: false }) as any[][];
  const headerRowIndex = detectHeaderRow(matrix);
  const headers = matrix[headerRowIndex].map((v) => cleanText(v));
  const body = matrix.slice(headerRowIndex + 1);

  const idx = (name: string) => headers.findIndex((h) => h.toLowerCase() === name.toLowerCase());
  const roIdx = idx("RO #");
  const customerIdx = idx("Customer");
  const vehicleIdx = idx("Vehicle");
  const estimatorIdx = idx("Estimator");
  const techIdx = idx("Tech");
  const phaseIdx = idx("Phase");
  const hoursIdx = idx("Hours");

  return body.map((row) => {
    const roNumber = cleanText(row[roIdx]);
    const owner = cleanText(row[customerIdx]);
    const vehicle = cleanText(row[vehicleIdx]);
    const estimatorFallbackJ = row[9];
    const estimator = cleanText(estimatorIdx >= 0 ? row[estimatorIdx] : estimatorFallbackJ);
    const technicianRaw = normalizeTechnicianName(row[techIdx]);
    const technician = technicianRaw || UNASSIGNED_TECH_NAME;
    const stage = normalizeStage(row[phaseIdx]);
    const roHours = Number(cleanText(row[hoursIdx]));
    return { roNumber, owner, vehicle, estimator, technician, stage, roHours };
  }).filter((row) => row.roNumber && row.stage && !Number.isNaN(row.roHours));
}

export async function recalcAndReplaceShopSnapshot(shopId: string, rows: ParsedRow[], sourceFileName: string) {
  const [rules, techs, holds, handoutHolds] = await Promise.all([
    prisma.stageRule.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.technician.findMany({ where: { shopId, isActive: true } }),
    prisma.jobHold.findMany({ where: { shopId, isHeld: true } }),
    prisma.handoutHold.findMany({ where: { shopId, isHeld: true } }),
  ]);
  const ruleMap = new Map(rules.map((rule) => [rule.stageName, rule]));
  const holdMap = new Map(holds.map((hold) => [hold.roNumber, hold]));
  const handoutHoldMap = new Map(handoutHolds.map((hold) => [hold.roNumber, hold]));
  const techNames = new Set(techs.map((tech) => normalizeTechnicianName(tech.name)));

  const prepared = rows.map((row) => {
    const rule = ruleMap.get(row.stage);
    const hold = holdMap.get(row.roNumber);
    const handoutHold = row.technician === UNASSIGNED_TECH_NAME ? handoutHoldMap.get(row.roNumber) : undefined;

    let remainingHours = 0;
    if (rule && rule.includeInLoad && !hold) {
      remainingHours = rule.logicType === "FIXED" ? Number(rule.fixedHours ?? 0) : row.roHours * rule.remainingPct;
    }

    return {
      shopId,
      roNumber: row.roNumber,
      owner: row.owner,
      vehicle: row.vehicle,
      estimator: row.estimator,
      technician: row.technician,
      stage: row.stage,
      roHours: row.roHours,
      remainingHours,
      isHeld: !!hold,
      holdReason: hold?.reason || "",
      isHandoutHeld: !!handoutHold,
      handoutHoldReason: handoutHold?.reason || "",
    };
  });

  const incomingRoNumbers = new Set(prepared.map((row) => row.roNumber));
  const assignedRoNumbers = new Set(
    prepared
      .filter((row) => normalizeTechnicianName(row.technician) !== UNASSIGNED_TECH_NAME)
      .map((row) => row.roNumber)
  );

  await prisma.$transaction(async (tx) => {
    await tx.currentWipRow.deleteMany({ where: { shopId } });
    if (prepared.length > 0) await tx.currentWipRow.createMany({ data: prepared });
    await tx.importRun.create({ data: { shopId, sourceFileName, rowCount: prepared.length } });

    for (const row of prepared) {
      const normalized = normalizeTechnicianName(row.technician);
      if (!techNames.has(normalized) && normalized !== UNASSIGNED_TECH_NAME) {
        await tx.technician.upsert({
          where: { shopId_name: { shopId, name: row.technician } },
          update: { isActive: true },
          create: { shopId, name: row.technician, capacity: 0, isActive: true },
        });
      }
    }

    const staleHandoutHolds = handoutHolds
      .filter((hold) => !incomingRoNumbers.has(hold.roNumber) || assignedRoNumbers.has(hold.roNumber))
      .map((hold) => hold.roNumber);

    if (staleHandoutHolds.length) {
      await tx.handoutHold.updateMany({
        where: { shopId, roNumber: { in: staleHandoutHolds } },
        data: { isHeld: false, reason: "" },
      });
    }
  });
}
