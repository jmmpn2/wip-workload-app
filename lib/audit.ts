import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

type LogAuditArgs = {
  shopId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
  metadata?: unknown;
};

function sanitizeMetadata(value: unknown) {
  if (value === undefined) return undefined;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return undefined;
  }
}

export async function logShopAudit(args: LogAuditArgs) {
  try {
    const session = await getSession();
    await prisma.shopAuditLog.create({
      data: {
        shopId: args.shopId,
        action: args.action,
        entityType: args.entityType,
        entityId: args.entityId ?? null,
        summary: args.summary,
        metadata: sanitizeMetadata(args.metadata),
        actorUserId: session?.userId,
        actorEmail: session?.email,
        actorName: session?.name || null,
      },
    });
  } catch (error) {
    console.error("[audit] failed to write audit log", error);
  }
}
