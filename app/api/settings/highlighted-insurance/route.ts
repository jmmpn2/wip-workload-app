import { NextRequest, NextResponse } from "next/server";
import { requireShopId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cleanText } from "@/lib/stages";

export async function POST(request: NextRequest) {
  const shopId = await requireShopId();
  const body = await request.json();
  const highlightedInsurers = Array.isArray(body.highlightedInsurers)
    ? body.highlightedInsurers
    .map((value: unknown) => cleanText(typeof value === "string" ? value : ""))
    .filter(Boolean)
    : [];

  await prisma.$transaction(async (tx) => {
    await tx.highlightedInsuranceCompany.deleteMany({ where: { shopId } });
    if (highlightedInsurers.length) {
      await tx.highlightedInsuranceCompany.createMany({
        data: highlightedInsurers.map((insuranceName) => ({ shopId, insuranceName })),
      });
    }
  });

  return NextResponse.json({ ok: true });
}
