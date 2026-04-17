import { cookies } from "next/headers";
import crypto from "crypto";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SessionUser, canAccessAllShops, canEditNotes, canEditSettings, canImportWip, canManageUsers, canMoveJobs, canViewAuditLog, canViewDashboard } from "@/lib/permissions";

const COOKIE_NAME = "wip_feeder_session";

function sign(value: string) {
  const secret = process.env.SESSION_SECRET || "dev-secret";
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

function encodeSession(session: SessionUser) {
  const json = JSON.stringify(session);
  const payload = Buffer.from(json, "utf8").toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decodeSession(raw: string | undefined | null): SessionUser | null {
  if (!raw) return null;
  const [payload, signature] = raw.split(".");
  if (!payload || !signature || sign(payload) !== signature) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SessionUser;
  } catch {
    return null;
  }
}

export async function createSession(session: SessionUser) {
  (await cookies()).set(COOKIE_NAME, encodeSession(session), { httpOnly: true, sameSite: "lax", secure: false, path: "/" });
}

export async function clearSession() {
  (await cookies()).delete(COOKIE_NAME);
}

export async function getSession() {
  return decodeSession((await cookies()).get(COOKIE_NAME)?.value);
}

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/");
  return session;
}

export async function getCurrentShopIdFromSession(session: SessionUser) {
  return (canAccessAllShops(session.role) ? session.currentShopId : session.shopId) || session.shopId || null;
}

export async function requireActiveShopId() {
  const session = await requireSession();
  if (session.mustChangePassword) redirect("/change-password");
  const shopId = await getCurrentShopIdFromSession(session);
  if (!shopId) redirect("/");
  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  if (!shop) redirect("/");
  if (!canAccessAllShops(session.role) && session.shopId !== shopId) redirect("/dashboard");
  return shopId;
}

export async function requireRoleAccess(opts: { dashboard?: boolean; importWip?: boolean; moveJobs?: boolean; notes?: boolean; settings?: boolean; audit?: boolean; users?: boolean; }) {
  const session = await requireSession();
  if (session.mustChangePassword) redirect("/change-password");
  const role = session.role;
  const allowed =
    (!opts.dashboard || canViewDashboard(role)) &&
    (!opts.importWip || canImportWip(role)) &&
    (!opts.moveJobs || canMoveJobs(role)) &&
    (!opts.notes || canEditNotes(role)) &&
    (!opts.settings || canEditSettings(role)) &&
    (!opts.audit || canViewAuditLog(role)) &&
    (!opts.users || canManageUsers(role));
  if (!allowed) redirect("/dashboard");
  return session;
}

export async function assertRoleAccessOrThrow(opts: { dashboard?: boolean; importWip?: boolean; moveJobs?: boolean; notes?: boolean; settings?: boolean; audit?: boolean; users?: boolean; }) {
  const session = await requireSession();
  if (session.mustChangePassword) throw new Error("PASSWORD_CHANGE_REQUIRED");
  const role = session.role;
  const allowed =
    (!opts.dashboard || canViewDashboard(role)) &&
    (!opts.importWip || canImportWip(role)) &&
    (!opts.moveJobs || canMoveJobs(role)) &&
    (!opts.notes || canEditNotes(role)) &&
    (!opts.settings || canEditSettings(role)) &&
    (!opts.audit || canViewAuditLog(role)) &&
    (!opts.users || canManageUsers(role));
  if (!allowed) throw new Error("FORBIDDEN");
  return session;
}

export async function setCurrentShopForSession(shopId: string) {
  const session = await requireSession();
  if (!canAccessAllShops(session.role)) throw new Error("FORBIDDEN");
  const shop = await prisma.shop.findFirst({ where: { id: shopId, isActive: true } });
  if (!shop) throw new Error("INVALID_SHOP");
  await createSession({ ...session, currentShopId: shop.id });
  return shop.id;
}

export function errorResponseFromAuthError(error: unknown) {
  const message = error instanceof Error ? error.message : "FORBIDDEN";
  if (message === "PASSWORD_CHANGE_REQUIRED") return { status: 403, body: { error: "You must change your password before continuing." } };
  if (message === "FORBIDDEN") return { status: 403, body: { error: "You do not have permission for that action." } };
  return { status: 401, body: { error: "Authentication failed." } };
}
