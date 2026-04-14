import { cookies } from "next/headers";
import crypto from "crypto";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
const COOKIE_NAME = "wip_workload_session";
function sign(value: string) {
  const secret = process.env.SESSION_SECRET || "dev-secret";
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}
export async function createSession(shopId: string) {
  const payload = `${shopId}.${sign(shopId)}`;
  (await cookies()).set(COOKIE_NAME, payload, { httpOnly: true, sameSite: "lax", secure: false, path: "/" });
}
export async function clearSession() { (await cookies()).delete(COOKIE_NAME); }
export async function getSessionShopId() {
  const raw = (await cookies()).get(COOKIE_NAME)?.value;
  if (!raw) return null;
  const [shopId, signature] = raw.split(".");
  if (!shopId || !signature || sign(shopId) !== signature) return null;
  return shopId;
}
export async function requireShopId() {
  const shopId = await getSessionShopId();
  if (!shopId) redirect("/");

  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  if (!shop) {
    redirect("/");
  }

  return shopId;
}
