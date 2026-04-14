import { NextRequest, NextResponse } from "next/server";
import { requireShopId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  await requireShopId();
  const body = await request.json();
  const phases = Array.isArray(body.phases) ? body.phases : [];

  await prisma.$transaction(
    phases.map((phase: {
      id: string;
      phaseName: string;
      remainingPct: number;
      sortOrder: number;
      countsInLoad: boolean;
      fixedHours: number | null;
      stageGroup: string | null;
    }) =>
      prisma.phaseRule.update({
        where: { id: phase.id },
        data: {
          phaseName: phase.phaseName.trim(),
          remainingPct: Number(phase.remainingPct || 0),
          sortOrder: Number(phase.sortOrder || 999),
          countsInLoad: !!phase.countsInLoad,
          fixedHours: phase.fixedHours == null ? null : Number(phase.fixedHours),
          stageGroup: phase.stageGroup?.trim() || null,
        },
      }),
    ),
  );

  return NextResponse.json({ ok: true });
}
