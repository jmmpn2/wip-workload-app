import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logShopAudit } from "@/lib/audit";
import { assertRoleAccessOrThrow, errorResponseFromAuthError, getCurrentShopIdFromSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await assertRoleAccessOrThrow({ notes: true });
    const shopId = await getCurrentShopIdFromSession(session);
    if (!shopId) return NextResponse.json({ error: "No shop selected." }, { status: 400 });
    const body = await request.json();
    const roNumber = String(body.roNumber || "").trim();
    const note = String(body.note || "").trim();
    if (!roNumber) return NextResponse.json({ error: "RO number is required." }, { status: 400 });
    const currentRow = await prisma.currentWipRow.findFirst({ where: { shopId, roNumber } });
    if (!currentRow) return NextResponse.json({ error: "Job not found in current WIP." }, { status: 404 });
    await prisma.jobBucketNote.upsert({ where: { shopId_roNumber: { shopId, roNumber } }, update: { note }, create: { shopId, roNumber, note } });
    await prisma.currentWipRow.updateMany({ where: { shopId, roNumber }, data: { handoutNote: note } });
    await logShopAudit({ shopId, action: note ? "SAVE_JOB_NOTE" : "CLEAR_JOB_NOTE", entityType: "JOB_NOTE", entityId: roNumber, summary: note ? `Updated handout note for RO ${roNumber}.` : `Cleared handout note for RO ${roNumber}.`, metadata: { roNumber, note } });
    return NextResponse.json({ ok: true, note });
  } catch (error) {
    const auth = errorResponseFromAuthError(error);
    return NextResponse.json(auth.body, { status: auth.status });
  }
}
