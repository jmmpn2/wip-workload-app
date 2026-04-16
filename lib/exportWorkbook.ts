import * as XLSX from "xlsx";

export function buildWorkbook(shopName: string, techRank: any[], rows: any[]) {
  const workbook = XLSX.utils.book_new();

  const summarySheet = XLSX.utils.json_to_sheet(
    techRank.map((row) => ({
      Rank: row.rank,
      Technician: row.technician,
      Capacity: row.capacity,
      "Remaining Hours": row.remainingHours,
      "Load %": row.loadPct,
      "RO Hours": row.roHours,
      "Active Jobs": row.activeJobs,
      Status: row.status,
    }))
  );

  XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

  const groupedTechs = [...new Set(rows.map((row: any) => row.technician))];

  for (const tech of groupedTechs) {
    const techRows = rows
      .filter((row: any) => row.technician === tech)
      .map((row: any) => ({
        "RO Number": row.roNumber,
        Owner: row.owner,
        Vehicle: row.vehicle,
        Estimator: row.estimator,
        Stage: row.stage,
        Insurance: row.insurance || "",
        Days: Math.round(row.daysInShop || 0),
        "RO Hours": Math.round(row.roHours),
        "Remaining Hours": Math.round(row.remainingHours),
        "On Hold": row.isHeld ? "YES" : "",
        "Hold Reason": row.holdReason || "",
      }));

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(techRows),
      String(tech).slice(0, 31) || "Tech"
    );
  }

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}
