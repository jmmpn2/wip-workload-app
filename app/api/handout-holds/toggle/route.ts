import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logShopAudit } from "@/lib/audit";
import { UNASSIGNED_TECH_NAME } from "@/lib/stages";
import { assertRoleAccessOrThrow, errorResponseFromAuthError, getCurrentShopIdFromSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await assertRoleAccessOrThrow({ moveJobs: true });
    const shopId = await getCurrentShopIdFromSession(session);
    if (!shopId) return NextResponse.json({ error: "No shop selected." }, { status: 400 });
    const body = await request.json();
    const roNumber = String(body.roNumber || "").trim();
    const reason = String(body.reason || "").trim();
    if (!roNumber) return NextResponse.json({ error: "RO number is required." }, { status: 400 });
    const currentRow = await prisma.currentWipRow.findFirst({ where: { shopId, roNumber } });
    if (!currentRow) return NextResponse.json({ error: "Job not found in current WIP." }, { status: 404 });
    if (currentRow.technician !== UNASSIGNED_TECH_NAME) return NextResponse.json({ error: "Only unassigned jobs can be marked not ready to hand out." }, { status: 400 });
    const existing = await prisma.handoutHold.findUnique({ where: { shopId_roNumber: { shopId, roNumber } } });
    if (existing?.isHeld) {
      await prisma.handoutHold.update({ where: { shopId_roNumber: { shopId, roNumber } }, data: { isHeld: false, reason: "" } });
      await prisma.currentWipRow.updateMany({ where: { shopId, roNumber }, data: { isHandoutHeld: false, handoutHoldReason: "" } });
      await logShopAudit({ shopId, action: "RELEASE_HANDOUT_HOLD", entityType: "HANDOUT_HOLD", entityId: roNumber, summary: `Released Cars on Hold status for RO ${roNumber}.`, metadata: { roNumber } });
      return NextResponse.json({ ok: true, isHeld: false });
    }
    await prisma.handoutHold.upsert({ where: { shopId_roNumber: { shopId, roNumber } }, update: { isHeld: true, reason }, create: { shopId, roNumber, isHeld: true, reason } });
    await prisma.currentWipRow.updateMany({ where: { shopId, roNumber, technician: UNASSIGNED_TECH_NAME }, data: { isHandoutHeld: true, handoutHoldReason: reason } });
    await logShopAudit({ shopId, action: "APPLY_HANDOUT_HOLD", entityType: "HANDOUT_HOLD", entityId: roNumber, summary: reason ? `Moved RO ${roNumber} to Cars on Hold: ${reason}.` : `Moved RO ${roNumber} to Cars on Hold.`, metadata: { roNumber, reason } });
    return NextResponse.json({ ok: true, isHeld: true });
  } catch (error) {
    const auth = errorResponseFromAuthError(error);
    return NextResponse.json(auth.body, { status: auth.status });
  }
}
