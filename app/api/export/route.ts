import { NextResponse } from "next/server";
import { getDashboardData } from "@/lib/dashboard";
import { buildWorkbook } from "@/lib/exportWorkbook";
import { assertRoleAccessOrThrow, errorResponseFromAuthError, getCurrentShopIdFromSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await assertRoleAccessOrThrow({ dashboard: true });
    const shopId = await getCurrentShopIdFromSession(session);
    if (!shopId) return NextResponse.json({ error: "No shop selected." }, { status: 400 });
    const data = await getDashboardData(shopId);
    const buffer = buildWorkbook(data.shop.name, data.techRank, data.rows.map((row) => ({ roNumber: row.roNumber, owner: row.owner, vehicle: row.vehicle, estimator: row.estimator, technician: row.technician, stage: row.stage, insurance: row.insurance, daysInShop: row.daysInShop, roHours: row.roHours, remainingHours: row.remainingHours })));
    return new NextResponse(buffer, { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="${data.shop.name.replace(/\s+/g, "_")}_WIP_Workload.xlsx"` } });
  } catch (error) {
    const auth = errorResponseFromAuthError(error);
    return NextResponse.json(auth.body, { status: auth.status });
  }
}
