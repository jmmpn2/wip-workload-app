import Link from "next/link";
import { headers } from "next/headers";
import { AutoPrintOnLoad } from "@/components/AutoPrintOnLoad";
import { PrintButton } from "@/components/PrintButton";
import { requireShopId } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard";
import { buildDashboardEmailBodyHtml } from "@/lib/emailReport";

async function resolveBaseUrlFromHeaders() {
  const headerStore = await headers();
  const explicit = process.env.APP_BASE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const host = headerStore.get("host")?.trim();
  if (host) {
    const proto = host.includes("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
    return `${proto}://${host}`;
  }

  return "http://localhost:3000";
}

export default async function PrintEmailReportPage() {
  const shopId = await requireShopId();
  const data = await getDashboardData(shopId);
  const baseUrl = await resolveBaseUrlFromHeaders();

  const emailBodyHtml = buildDashboardEmailBodyHtml({
    shopName: data.shop.name,
    baseUrl,
    totals: data.totals,
    unassigned: data.unassigned,
    techRank: data.techRank,
    stages: data.stages,
    assignableRows: data.assignableRows,
    towInEstimateRows: data.towInEstimateRows,
  });

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">
      <AutoPrintOnLoad />
      <style>{`@media print { @page { size: portrait; margin: 0.35in; } }`}</style>
      <div className="print-hidden mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/dashboard" className="text-sm text-blue-700 hover:underline">
          ← Back to dashboard
        </Link>
        <PrintButton />
      </div>
      <div
        className="mx-auto max-w-6xl px-4 pb-6 print:max-w-none print:px-0 print:pb-0"
        dangerouslySetInnerHTML={{ __html: emailBodyHtml }}
      />
    </div>
  );
}
