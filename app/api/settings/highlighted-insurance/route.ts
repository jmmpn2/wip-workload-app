import { NextRequest, NextResponse } from "next/server";
import { requireShopId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cleanText } from "@/lib/stages";
import { logShopAudit } from "@/lib/audit";

type HighlightedInsuranceBody = {
  highlightedInsurers?: unknown;
};

export async function POST(request: NextRequest) {
  const shopId = await requireShopId();
  const body = (await request.json()) as HighlightedInsuranceBody;

  const highlightedInsurers: string[] = Array.isArray(body.highlightedInsurers)
    ? body.highlightedInsurers
        .map((value: unknown) => (typeof value === "string" ? cleanText(value) : ""))
        .filter((value: string) => Boolean(value))
    : [];

  await prisma.$transaction(async (tx) => {
    await tx.highlightedInsuranceCompany.deleteMany({ where: { shopId } });
    if (highlightedInsurers.length) {
      await tx.highlightedInsuranceCompany.createMany({
        data: highlightedInsurers.map((insuranceName: string) => ({ shopId, insuranceName })),
      });
    }
  });

  await logShopAudit({
    shopId,
    action: "UPDATE_HIGHLIGHTED_INSURANCE",
    entityType: "SETTINGS",
    summary: `Updated highlighted insurance companies (${highlightedInsurers.length} selected).`,
    metadata: { highlightedInsurers },
  });

  return NextResponse.json({ ok: true });
}
