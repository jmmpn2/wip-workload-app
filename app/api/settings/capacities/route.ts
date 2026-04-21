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
    const technicians = Array.isArray(body.technicians) ? body.technicians : [];
    await prisma.$transaction(technicians.map((tech: { id: string; name: string; capacity: number; isActive: boolean; isOnPto: boolean }) => prisma.technician.update({ where: { id: tech.id }, data: { name: tech.name.trim(), capacity: Number(tech.capacity || 0), isActive: !!tech.isActive, isOnPto: !!tech.isOnPto } })));
    await logShopAudit({ shopId, action: "UPDATE_CAPACITIES", entityType: "SETTINGS", summary: `Updated technician settings for ${technicians.length} technician${technicians.length === 1 ? "" : "s"}.`, metadata: { technicianCount: technicians.length, ptoCount: technicians.filter((tech: { isOnPto: boolean }) => tech.isOnPto).length } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const auth = errorResponseFromAuthError(error);
    return NextResponse.json(auth.body, { status: auth.status });
  }
}
