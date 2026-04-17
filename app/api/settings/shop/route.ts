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
    const data: { needsWorkThreshold?: number; overloadedThreshold?: number; reportRecipients?: string; smtpProvider?: string; smtpHost?: string; smtpPort?: number | null; smtpSecure?: boolean; smtpUser?: string; smtpFrom?: string; reportSubjectPrefix?: string; } = {};
    if (body.needsWorkThreshold !== undefined) data.needsWorkThreshold = Number(body.needsWorkThreshold || 125);
    if (body.overloadedThreshold !== undefined) data.overloadedThreshold = Number(body.overloadedThreshold || 250);
    if (typeof body.reportRecipients === "string") data.reportRecipients = body.reportRecipients.split(",").map((value: string) => value.trim()).filter(Boolean).join(", ");
    if (typeof body.smtpProvider === "string") data.smtpProvider = body.smtpProvider.trim() || "gmail";
    if (typeof body.smtpHost === "string") data.smtpHost = body.smtpHost.trim();
    if (body.smtpPort !== undefined) { const port = Number(body.smtpPort); data.smtpPort = Number.isFinite(port) && port > 0 ? port : null; }
    if (body.smtpSecure !== undefined) data.smtpSecure = Boolean(body.smtpSecure);
    if (typeof body.smtpUser === "string") data.smtpUser = body.smtpUser.trim();
    if (typeof body.smtpFrom === "string") data.smtpFrom = body.smtpFrom.trim();
    if (typeof body.reportSubjectPrefix === "string") data.reportSubjectPrefix = body.reportSubjectPrefix.trim();
    await prisma.shop.update({ where: { id: shopId }, data });
    const changedKeys = Object.keys(data);
    await logShopAudit({ shopId, action: "UPDATE_SHOP_SETTINGS", entityType: "SETTINGS", summary: changedKeys.length ? `Updated shop settings: ${changedKeys.join(", ")}.` : "Saved shop settings.", metadata: { changedKeys, values: data } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const auth = errorResponseFromAuthError(error);
    return NextResponse.json(auth.body, { status: auth.status });
  }
}
