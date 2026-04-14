import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export async function POST(request: NextRequest) {
  const { password, shopId } = await request.json();
  if (!password || password !== process.env.APP_PASSWORD) return NextResponse.json({ error: "Invalid password." }, { status: 401 });
  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  if (!shop) return NextResponse.json({ error: "Invalid shop." }, { status: 400 });
  await createSession(shop.id);
  return NextResponse.json({ ok: true });
}
