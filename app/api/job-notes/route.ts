import { NextRequest, NextResponse } from "next/server";
import { requireShopId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const shopId = await requireShopId();
  const body = await request.json();
  const roNumber = String(body.roNumber || "").trim();
  const note = String(body.note || "").trim();

  if (!roNumber) {
    return NextResponse.json({ error: "RO number is required." }, { status: 400 });
  }

  const currentRow = await prisma.currentWipRow.findFirst({ where: { shopId, roNumber } });
  if (!currentRow) {
    return NextResponse.json({ error: "Job not found in current WIP." }, { status: 404 });
  }

  await prisma.jobBucketNote.upsert({
    where: { shopId_roNumber: { shopId, roNumber } },
    update: { note },
    create: { shopId, roNumber, note },
  });

  await prisma.currentWipRow.updateMany({
    where: { shopId, roNumber },
    data: { handoutNote: note },
  });

  return NextResponse.json({ ok: true, note });
}
