import { NextRequest, NextResponse } from "next/server";
import { allowedRoleOptions, canAccessAllShops } from "@/lib/permissions";
import { assertRoleAccessOrThrow, errorResponseFromAuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { logShopAudit } from "@/lib/audit";

async function listUsers(actorRole: string, actorShopId: string | null) {
  const canAll = actorRole === "SUPER_ADMIN" || actorRole === "EXECUTIVE";
  const rows = await prisma.user.findMany({ where: canAll ? {} : { shopId: actorShopId || undefined }, include: { shop: true }, orderBy: [{ role: "asc" }, { email: "asc" }] });
  return rows.map((user) => ({
    id: user.id,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    mustChangePassword: user.mustChangePassword,
    shopName: user.shop?.name || null,
    lastLoginAt: user.lastLoginAt ? new Intl.DateTimeFormat("en-US", { year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "2-digit" }).format(user.lastLoginAt) : null,
  }));
}

export async function POST(request: NextRequest) {
  try {
    const session = await assertRoleAccessOrThrow({ users: true });
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const role = String(body.role || "") as any;
    const shopId = body.shopId ? String(body.shopId) : null;
    const tempPassword = String(body.tempPassword || "");
    if (!email || !tempPassword || tempPassword.length < 4) return NextResponse.json({ error: "Email and temporary password are required." }, { status: 400 });
    if (!allowedRoleOptions(session.role).includes(role)) return NextResponse.json({ error: "You cannot create that role." }, { status: 403 });
    if (!["SUPER_ADMIN", "EXECUTIVE"].includes(role) && !shopId) return NextResponse.json({ error: "A shop is required for that role." }, { status: 400 });
    if (!canAccessAllShops(session.role) && shopId !== session.shopId) return NextResponse.json({ error: "You can only create users for your own shop." }, { status: 403 });

    const passwordHash = await hashPassword(tempPassword);
    const created = await prisma.user.create({ data: { email, role, shopId: role === "SUPER_ADMIN" || role === "EXECUTIVE" ? null : shopId, passwordHash, mustChangePassword: true, isActive: true } });
    const effectiveShopId = role === "SUPER_ADMIN" || role === "EXECUTIVE" ? session.shopId || shopId : shopId;
    if (effectiveShopId) {
      await logShopAudit({ shopId: effectiveShopId, action: "CREATE_USER", entityType: "USER", entityId: created.id, summary: `Created ${role} account for ${email}.`, metadata: { email, role } });
    }
    return NextResponse.json({ ok: true, created: { id: created.id, email: created.email }, users: await listUsers(session.role, session.shopId) });
  } catch (error) {
    const auth = errorResponseFromAuthError(error);
    return NextResponse.json(auth.body, { status: auth.status });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await assertRoleAccessOrThrow({ users: true });
    const body = await request.json();
    const userId = String(body.userId || "");
    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });
    if (!canAccessAllShops(session.role) && target.shopId !== session.shopId) return NextResponse.json({ error: "You can only manage users for your own shop." }, { status: 403 });

    if (body.action === "reset_password") {
      const tempPassword = String(body.tempPassword || "");
      if (!tempPassword) return NextResponse.json({ error: "Temporary password is required." }, { status: 400 });
      const passwordHash = await hashPassword(tempPassword);
      await prisma.user.update({ where: { id: userId }, data: { passwordHash, mustChangePassword: true } });
      if (target.shopId || session.shopId) await logShopAudit({ shopId: target.shopId || session.shopId!, action: "RESET_USER_PASSWORD", entityType: "USER", entityId: target.id, summary: `Reset password for ${target.email}.`, metadata: { email: target.email } });
    } else if (body.action === "toggle_active") {
      await prisma.user.update({ where: { id: userId }, data: { isActive: Boolean(body.isActive) } });
      if (target.shopId || session.shopId) await logShopAudit({ shopId: target.shopId || session.shopId!, action: Boolean(body.isActive) ? "ACTIVATE_USER" : "DEACTIVATE_USER", entityType: "USER", entityId: target.id, summary: `${Boolean(body.isActive) ? "Activated" : "Deactivated"} ${target.email}.`, metadata: { email: target.email } });
    } else {
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }

    return NextResponse.json({ ok: true, users: await listUsers(session.role, session.shopId) });
  } catch (error) {
    const auth = errorResponseFromAuthError(error);
    return NextResponse.json(auth.body, { status: auth.status });
  }
}
