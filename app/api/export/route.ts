import { NextResponse } from "next/server";
import { requireShopId } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard";
import { buildWorkbook } from "@/lib/exportWorkbook";
export async function GET() {
  const shopId = await requireShopId();
  const data = await getDashboardData(shopId);
  const buffer = buildWorkbook(data.shop.name, data.techRank, data.rows.map((row) => ({
    roNumber: row.roNumber, owner: row.owner, vehicle: row.vehicle, estimator: row.estimator, technician: row.technician, stage: row.stage, roHours: row.roHours, remainingHours: row.remainingHours,
  })));
  return new NextResponse(buffer, { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="${data.shop.name.replace(/\s+/g, "_")}_WIP_Workload.xlsx"` } });
}
