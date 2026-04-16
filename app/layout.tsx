import "./globals.css";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "WIP Feeder",
  description: "Collision center workload tracker",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen">
          <header className="border-b border-slate-200 bg-white print-hidden">
            <div className="mx-auto flex max-w-[1800px] items-center justify-between gap-4 px-6 py-4">
              <Link href="/" className="flex items-center gap-3 text-slate-900">
                <Image src="/logo.png" alt="WIP Feeder" width={210} height={104} priority className="h-12 w-auto" />
                <span className="sr-only">WIP Feeder</span>
              </Link>
              <nav className="flex items-center gap-4 text-sm text-slate-600">
                <Link href="/dashboard" className="hover:text-slate-900">Dashboard</Link>
                <Link href="/settings" className="hover:text-slate-900">Settings</Link>
                <form action="/api/logout" method="post">
                  <button className="text-slate-600 hover:text-slate-900">Logout</button>
                </form>
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-[1800px] px-6 py-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
