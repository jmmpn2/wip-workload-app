import { ExportButtons } from "@/components/ExportButtons";
import { MetricsCards } from "@/components/MetricsCards";
import { StageBars } from "@/components/StageBars";
import { TechRankingTable } from "@/components/TechRankingTable";
import { UploadCard } from "@/components/UploadCard";
import { AssignableJobsTable } from "@/components/AssignableJobsTable";
import { requireShopId } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard";

export default async function DashboardPage() {
  const shopId = await requireShopId();
  const data = await getDashboardData(shopId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">{data.shop.name}</h1>
          <p className="mt-1 text-sm text-slate-600">
            {data.lastImport ? `Last import: ${new Date(data.lastImport.createdAt).toLocaleString()}` : "No WIP file uploaded yet."}
          </p>
        </div>
        <ExportButtons />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
        <MetricsCards totals={data.totals} unassigned={data.unassigned} />
        <UploadCard />
      </div>

      <StageBars stages={data.stages} />
      <TechRankingTable techRank={data.techRank} />
      <AssignableJobsTable rows={data.assignableRows} towInRows={data.towInEstimateRows} holdRows={data.handoutHoldRows} />
    </div>
  );
}
