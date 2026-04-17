import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user || !user.isActive) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const valid = await verifyPassword(String(password), user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  let currentShopId = user.shopId;
  if (!currentShopId && (user.role === "SUPER_ADMIN" || user.role === "EXECUTIVE")) {
    const firstShop = await prisma.shop.findFirst({ where: { isActive: true }, orderBy: { name: "asc" } });
    currentShopId = firstShop?.id ?? null;
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  await createSession({
    userId: user.id,
    email: user.email,
    role: user.role,
    shopId: user.shopId,
    currentShopId,
    mustChangePassword: user.mustChangePassword,
  });

  return NextResponse.json({ ok: true, mustChangePassword: user.mustChangePassword });
}
