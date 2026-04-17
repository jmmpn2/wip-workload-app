import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logShopAudit } from "@/lib/audit";
import { assertRoleAccessOrThrow, errorResponseFromAuthError, getCurrentShopIdFromSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await assertRoleAccessOrThrow({ settings: true });
    const shopId = await getCurrentShopIdFromSession(session);
    if (!shopId) return NextResponse.json({ error: "No shop selected." }, { status: 400 });
    const body = await request.json();
    const stages = Array.isArray(body.stages) ? body.stages : [];
    await prisma.$transaction(stages.map((stage: { id: string; logicType: string; remainingPct: number; fixedHours: number | null; includeInLoad: boolean; sortOrder: number }) => prisma.stageRule.update({ where: { id: stage.id }, data: { logicType: stage.logicType, remainingPct: Number(stage.remainingPct || 0), fixedHours: stage.fixedHours == null ? null : Number(stage.fixedHours), includeInLoad: stage.logicType === "EXCLUDE" ? false : !!stage.includeInLoad, sortOrder: Number(stage.sortOrder || 999) } })));
    await logShopAudit({ shopId, action: "UPDATE_STAGE_RULES", entityType: "SETTINGS", summary: `Updated stage rules for ${stages.length} stage${stages.length === 1 ? "" : "s"}.`, metadata: { stageCount: stages.length } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const auth = errorResponseFromAuthError(error);
    return NextResponse.json(auth.body, { status: auth.status });
  }
}
