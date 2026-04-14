import { NextRequest, NextResponse } from "next/server";
import { requireShopId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export async function POST(request: NextRequest) {
  await requireShopId();
  const body = await request.json();
  const technicians = Array.isArray(body.technicians) ? body.technicians : [];
  await prisma.$transaction(technicians.map((tech: { id: string; name: string; capacity: number; isActive: boolean }) =>
    prisma.technician.update({ where: { id: tech.id }, data: { name: tech.name.trim(), capacity: Number(tech.capacity || 0), isActive: !!tech.isActive } })
  ));
  return NextResponse.json({ ok: true });
}
