import { prisma } from "@/lib/prisma";
import { STAGE_COLORS, UNASSIGNED_TECH_NAME, roundHours } from "@/lib/stages";
import { isHighlightedInsurance } from "@/lib/insuranceHighlights";

export async function getDashboardData(shopId: string) {
  const [shop, rows, technicians, stageRules, lastImport, highlightedInsuranceCompanies] = await Promise.all([
    prisma.shop.findUnique({ where: { id: shopId } }),
    prisma.currentWipRow.findMany({ where: { shopId }, orderBy: [{ technician: "asc" }, { roNumber: "asc" }] }),
    prisma.technician.findMany({ where: { shopId }, orderBy: { name: "asc" } }),
    prisma.stageRule.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.importRun.findFirst({ where: { shopId }, orderBy: { createdAt: "desc" } }),
    prisma.highlightedInsuranceCompany.findMany({ where: { shopId }, orderBy: { insuranceName: "asc" } }),
  ]);

  if (!shop) {
    return {
      shop: { id: shopId, name: "Unknown Shop", needsWorkThreshold: 125, overloadedThreshold: 250 },
      rows: [], technicians: [], stageRules, lastImport: null, techRank: [],
      totals: { totalJobs: 0, totalHoursWip: 0, totalRemainingHours: 0 }, stages: [],
      unassigned: { totalJobs: 0, totalHours: 0, remainingHours: 0 }, assignableRows: [], towInEstimateRows: [], handoutHoldRows: [], highlightedInsurers: [],
    };
  }

  const notes = await prisma.jobBucketNote.findMany({ where: { shopId } });
  const noteMap = new Map(notes.map((note) => [note.roNumber, note]));

  const highlightedInsurers = highlightedInsuranceCompanies.map((row) => row.insuranceName);
  const highlightedSet = new Set(highlightedInsurers);
  const decoratedRows = rows.map((row) => {
    const noteMeta = noteMap.get(row.roNumber);
    return {
      ...row,
      handoutNote: noteMeta?.note ?? row.handoutNote,
      noteLastEditedByName: noteMeta?.lastEditedByName ?? null,
      noteLastEditedAt: noteMeta?.lastEditedAt ? noteMeta.lastEditedAt.toISOString() : null,
      isHighlightedInsurance: isHighlightedInsurance(row.insurance, highlightedSet),
    };
  });

  const techRank = technicians
    .map((tech) => {
      const techRows = decoratedRows.filter((row) => row.technician === tech.name);
      const rawRemainingHours = techRows.reduce((sum, row) => sum + row.remainingHours, 0);
      const remainingHours = roundHours(rawRemainingHours);
      const roHours = roundHours(techRows.reduce((sum, row) => sum + row.roHours, 0));
      const activeJobs = techRows.filter((row) => row.remainingHours > 0).length;
      const loadPct = tech.capacity > 0 ? Math.round((rawRemainingHours / tech.capacity) * 100) : 0;

      let status = "normal";
      if (tech.isOnPto) status = "pto";
      else if (loadPct < shop.needsWorkThreshold) status = "needs_work";
      else if (loadPct > shop.overloadedThreshold) status = "overloaded";

      return {
        technicianId: tech.id,
        technician: tech.name,
        capacity: roundHours(tech.capacity),
        remainingHours,
        roHours,
        activeJobs,
        loadPct,
        status,
        isOnPto: tech.isOnPto,
      };
    })
    .sort((a, b) => {
      if (a.isOnPto !== b.isOnPto) return a.isOnPto ? 1 : -1;
      return a.loadPct - b.loadPct || a.remainingHours - b.remainingHours || a.technician.localeCompare(b.technician);
    })
    .map((row, index) => ({ ...row, rank: index + 1 }));

  const totalJobs = decoratedRows.length;
  const totalHoursWip = roundHours(decoratedRows.reduce((sum, row) => sum + row.roHours, 0));
  const totalRemainingHours = roundHours(decoratedRows.reduce((sum, row) => sum + row.remainingHours, 0));

  const unassignedRows = decoratedRows.filter((row) => row.technician === UNASSIGNED_TECH_NAME);
  const activeAssignableRows = unassignedRows.filter((row) => !row.isHandoutHeld && !row.isTowInEstimate);
  const towInEstimateRows = unassignedRows.filter((row) => row.isTowInEstimate && !row.isHandoutHeld);
  const handoutHoldRows = unassignedRows.filter((row) => row.isHandoutHeld);

  const unassigned = {
    totalJobs: activeAssignableRows.length,
    totalHours: roundHours(activeAssignableRows.reduce((sum, row) => sum + row.roHours, 0)),
    remainingHours: roundHours(activeAssignableRows.reduce((sum, row) => sum + row.remainingHours, 0)),
  };

  const stageCounts = new Map<string, number>();
  for (const row of decoratedRows) stageCounts.set(row.stage, (stageCounts.get(row.stage) || 0) + 1);

  const orderedStages = stageRules.map((rule, idx) => ({ stage: rule.stageName, count: stageCounts.get(rule.stageName) || 0, color: STAGE_COLORS[idx % STAGE_COLORS.length] }));
  const extraStages = [...stageCounts.keys()]
    .filter((stage) => !stageRules.some((rule) => rule.stageName === stage))
    .map((stage, idx) => ({ stage, count: stageCounts.get(stage) || 0, color: STAGE_COLORS[(stageRules.length + idx) % STAGE_COLORS.length] }));

  const stages = [...orderedStages, ...extraStages];
  const sortRows = (dataRows: any[]) => dataRows.sort((a, b) => b.remainingHours - a.remainingHours || b.roHours - a.roHours || a.roNumber.localeCompare(b.roNumber));

  return { shop, rows: decoratedRows, technicians, stageRules, lastImport, techRank, totals: { totalJobs, totalHoursWip, totalRemainingHours }, stages, unassigned, assignableRows: sortRows(activeAssignableRows), towInEstimateRows: sortRows(towInEstimateRows), handoutHoldRows: sortRows(handoutHoldRows), highlightedInsurers };
}

export async function getTechDetail(shopId: string, technicianName: string) {
  const dashboard = await getDashboardData(shopId);
  const stageOrder = new Map(dashboard.stageRules.map((rule, index) => [rule.stageName, index]));
  const rows = dashboard.rows
    .filter((row) => row.technician === technicianName)
    .sort((a, b) => {
      const aOrder = stageOrder.get(a.stage) ?? 9999;
      const bOrder = stageOrder.get(b.stage) ?? 9999;
      return aOrder - bOrder || a.roNumber.localeCompare(b.roNumber);
    });
  const summary = dashboard.techRank.find((row) => row.technician === technicianName) || null;
  return { shop: dashboard.shop, rows, summary, techRank: dashboard.techRank };
}
