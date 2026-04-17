import "./globals.css";
import Image from "next/image";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { canAccessAllShops, canEditSettings, canManageUsers, canViewAuditLog } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { ShopSwitcher } from "@/components/ShopSwitcher";

export const metadata = {
  title: "WIP Feeder",
  description: "Collision center workload tracker",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const shops = session && canAccessAllShops(session.role)
    ? await prisma.shop.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } })
    : [];

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen">
          {session && !session.mustChangePassword ? (
            <header className="border-b border-slate-200 bg-white print-hidden">
              <div className="mx-auto flex max-w-[1800px] flex-wrap items-center justify-between gap-4 px-6 py-3">
                <Link href="/dashboard" className="flex items-center gap-3">
                  <Image src="/logo.png" alt="WIP Feeder" width={180} height={89} className="h-auto w-[150px] md:w-[180px]" priority />
                </Link>
                <div className="flex flex-wrap items-center gap-4">
                  {canAccessAllShops(session.role) ? <ShopSwitcher shops={shops} currentShopId={session.currentShopId} /> : null}
                  <nav className="flex flex-wrap gap-4 text-sm text-slate-600">
                    <Link href="/dashboard">Dashboard</Link>
                    {canEditSettings(session.role) ? <Link href="/settings">Settings</Link> : null}
                    {canViewAuditLog(session.role) ? <Link href="/audit-log">Audit Log</Link> : null}
                    {canManageUsers(session.role) ? <Link href="/users">Users</Link> : null}
                    <form action="/api/logout" method="post">
                      <button className="text-slate-600">Logout</button>
                    </form>
                  </nav>
                </div>
              </div>
            </header>
          ) : null}
          <main className="mx-auto max-w-[1800px] px-6 py-5">{children}</main>
        </div>
      </body>
    </html>
  );
}
