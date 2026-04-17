import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UNASSIGNED_TECH_NAME } from "@/lib/stages";
import { logShopAudit } from "@/lib/audit";
import { assertRoleAccessOrThrow, errorResponseFromAuthError, getCurrentShopIdFromSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await assertRoleAccessOrThrow({ moveJobs: true });
    const shopId = await getCurrentShopIdFromSession(session);
    if (!shopId) return NextResponse.json({ error: "No shop selected." }, { status: 400 });
    const body = await request.json();
    const roNumber = String(body.roNumber || "").trim();
    if (!roNumber) return NextResponse.json({ error: "RO number is required." }, { status: 400 });
    const currentRow = await prisma.currentWipRow.findFirst({ where: { shopId, roNumber } });
    if (!currentRow) return NextResponse.json({ error: "Job not found in current WIP." }, { status: 404 });
    if (currentRow.technician !== UNASSIGNED_TECH_NAME) return NextResponse.json({ error: "Only unassigned jobs can be marked as tow-ins needing estimate." }, { status: 400 });
    if (currentRow.isHandoutHeld) return NextResponse.json({ error: "Release the car from Cars On Hold before tagging it as a tow-in needing estimate." }, { status: 400 });
    const existing = await prisma.towInEstimateTag.findUnique({ where: { shopId_roNumber: { shopId, roNumber } } });
    if (existing?.isTagged) {
      await prisma.towInEstimateTag.update({ where: { shopId_roNumber: { shopId, roNumber } }, data: { isTagged: false } });
      await prisma.currentWipRow.updateMany({ where: { shopId, roNumber, technician: UNASSIGNED_TECH_NAME }, data: { isTowInEstimate: false } });
      await logShopAudit({ shopId, action: "CLEAR_TOW_IN_ESTIMATE", entityType: "TOW_IN_ESTIMATE", entityId: roNumber, summary: `Removed Tow In - Needs Estimate tag from RO ${roNumber}.`, metadata: { roNumber } });
      return NextResponse.json({ ok: true, isTowInEstimate: false });
    }
    await prisma.towInEstimateTag.upsert({ where: { shopId_roNumber: { shopId, roNumber } }, update: { isTagged: true }, create: { shopId, roNumber, isTagged: true } });
    await prisma.currentWipRow.updateMany({ where: { shopId, roNumber, technician: UNASSIGNED_TECH_NAME }, data: { isTowInEstimate: true } });
    await logShopAudit({ shopId, action: "MARK_TOW_IN_ESTIMATE", entityType: "TOW_IN_ESTIMATE", entityId: roNumber, summary: `Marked RO ${roNumber} as Tow In - Needs Estimate.`, metadata: { roNumber } });
    return NextResponse.json({ ok: true, isTowInEstimate: true });
  } catch (error) {
    const auth = errorResponseFromAuthError(error);
    return NextResponse.json(auth.body, { status: auth.status });
  }
}
