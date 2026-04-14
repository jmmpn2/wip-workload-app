import { NextRequest, NextResponse } from "next/server";
import { requireShopId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export async function POST(request: NextRequest) {
  await requireShopId();
  const body = await request.json();
  const stages = Array.isArray(body.stages) ? body.stages : [];
  await prisma.$transaction(stages.map((stage: { id: string; logicType: string; remainingPct: number; fixedHours: number | null; includeInLoad: boolean; sortOrder: number }) =>
    prisma.stageRule.update({ where: { id: stage.id }, data: { logicType: stage.logicType, remainingPct: Number(stage.remainingPct || 0), fixedHours: stage.fixedHours == null ? null : Number(stage.fixedHours), includeInLoad: stage.logicType === "EXCLUDE" ? false : !!stage.includeInLoad, sortOrder: Number(stage.sortOrder || 999) } })
  ));
  return NextResponse.json({ ok: true });
}
