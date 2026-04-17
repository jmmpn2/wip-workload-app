import { NextRequest, NextResponse } from "next/server";
import { requireShopId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logShopAudit } from "@/lib/audit";

export async function POST(request: NextRequest) {
  const shopId = await requireShopId();
  const body = await request.json();
  const roNumber = String(body.roNumber || "").trim();
  const reason = String(body.reason || "").trim();

  if (!roNumber) {
    return NextResponse.json({ error: "RO number is required." }, { status: 400 });
  }

  const existing = await prisma.jobHold.findUnique({
    where: { shopId_roNumber: { shopId, roNumber } },
  });

  if (existing?.isHeld) {
    await prisma.jobHold.update({
      where: { shopId_roNumber: { shopId, roNumber } },
      data: { isHeld: false, reason: "" },
    });

    await prisma.currentWipRow.updateMany({
      where: { shopId, roNumber },
      data: { isHeld: false, holdReason: "" },
    });

    await logShopAudit({
      shopId,
      action: "RELEASE_JOB_HOLD",
      entityType: "JOB_HOLD",
      entityId: roNumber,
      summary: `Released technician hold for RO ${roNumber}.`,
      metadata: { roNumber },
    });

    return NextResponse.json({ ok: true, isHeld: false });
  }

  await prisma.jobHold.upsert({
    where: { shopId_roNumber: { shopId, roNumber } },
    update: { isHeld: true, reason },
    create: { shopId, roNumber, isHeld: true, reason },
  });

  await prisma.currentWipRow.updateMany({
    where: { shopId, roNumber },
    data: { isHeld: true, holdReason: reason, remainingHours: 0 },
  });

  await logShopAudit({
    shopId,
    action: "APPLY_JOB_HOLD",
    entityType: "JOB_HOLD",
    entityId: roNumber,
    summary: reason ? `Placed RO ${roNumber} on technician hold: ${reason}.` : `Placed RO ${roNumber} on technician hold.`,
    metadata: { roNumber, reason },
  });

  return NextResponse.json({ ok: true, isHeld: true });
}
