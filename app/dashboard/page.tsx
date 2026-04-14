import { ExportButtons } from "@/components/ExportButtons";
import { MetricsCards } from "@/components/MetricsCards";
import { StageBars } from "@/components/StageBars";
import { TechRankingTable } from "@/components/TechRankingTable";
import { UploadCard } from "@/components/UploadCard";
import { AssignableJobsTable } from "@/components/AssignableJobsTable";
import { requireShopId } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard";
export default async function DashboardPage(){ const shopId = await requireShopId(); const data = await getDashboardData(shopId); return <div className="space-y-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-semibold text-slate-900">{data.shop.name}</h1><p className="mt-1 text-slate-600">{data.lastImport ? `Last import: ${new Date(data.lastImport.createdAt).toLocaleString()}` : "No WIP file uploaded yet."}</p></div><ExportButtons /></div><UploadCard /><MetricsCards totals={data.totals} unassigned={data.unassigned} /><StageBars stages={data.stages} /><TechRankingTable techRank={data.techRank} /><AssignableJobsTable rows={data.assignableRows} holdRows={data.handoutHoldRows} /></div>; }
