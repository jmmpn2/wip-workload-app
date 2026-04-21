import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertRoleAccessOrThrow, errorResponseFromAuthError } from "@/lib/auth";

async function listShops() {
  return prisma.shop.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, isActive: true } });
}

export async function POST(request: NextRequest) {
  try {
    await assertRoleAccessOrThrow({ shops: true });
    const body = await request.json();
    const name = String(body.name || "").trim();
    if (!name) return NextResponse.json({ error: "Shop name is required." }, { status: 400 });
    const created = await prisma.shop.create({ data: { name, isActive: true, needsWorkThreshold: 125, overloadedThreshold: 250 } });
    return NextResponse.json({ ok: true, created, shops: await listShops() });
  } catch (error) {
    const auth = errorResponseFromAuthError(error);
    return NextResponse.json(auth.body, { status: auth.status });
  }
}
