import Link from "next/link";
import { requireActiveShopId, requireRoleAccess, getSession } from "@/lib/auth";
import { getTechDetail } from "@/lib/dashboard";
import { PrintButton } from "@/components/PrintButton";
import { HoldToggleButton } from "@/components/HoldToggleButton";
import { canMoveJobs } from "@/lib/permissions";

export default async function TechPage({ params }: { params: Promise<{ name: string }> }) {
  await requireRoleAccess({ dashboard: true });
  const shopId = await requireActiveShopId();
  const session = await getSession();
  const { name } = await params;
  const technicianName = decodeURIComponent(name);
  const data = await getTechDetail(shopId, technicianName);
  const canManageHolds = canMoveJobs(session?.role || "FDR");

  return (
    <div className="space-y-4 tech-report-page print:space-y-3">
      <div className="print-hidden flex items-center justify-between">
        <Link href="/dashboard" className="text-sm text-blue-700 hover:underline">← Back to dashboard</Link>
        <PrintButton />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm print:rounded-none print:border-none print:px-0 print:py-0 print:shadow-none">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 print:text-xl">{technicianName}</h1>
            <p className="mt-1 text-sm text-slate-600">{data.shop.name}</p>
            {data.summary?.isOnPto ? <p className="mt-2 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-900">On PTO - do not assign new work</p> : null}
          </div>
          {data.summary ? <div className="text-right text-sm text-slate-600 print:text-xs"><div>Rank <span className="font-semibold text-slate-900">#{data.summary.rank}</span></div><div>Capacity <span className="font-semibold text-slate-900">{data.summary.capacity}</span></div></div> : null}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm print:rounded-none print:border-none print:p-0 print:shadow-none">
        <h2 className="text-base font-semibold text-slate-900 print:text-sm">Who Needs Work - by Load %</h2>
        <p className="mt-1 text-sm text-slate-600 print:text-[11px]">Load % is calculated as Remaining Hours ÷ Capacity. Lower load percentages need work sooner.</p>
        <div className="mt-3 overflow-x-auto"><table className="min-w-full border-collapse text-sm print:text-xs"><thead><tr className="border-b border-slate-200 text-left text-slate-600"><th className="px-3 py-2 print:px-2 print:py-1.5">Rank</th><th className="px-3 py-2 print:px-2 print:py-1.5">Technician</th><th className="px-3 py-2 print:px-2 print:py-1.5">Status</th><th className="px-3 py-2 print:px-2 print:py-1.5">Remaining Hours</th><th className="px-3 py-2 print:px-2 print:py-1.5">Load %</th></tr></thead><tbody>{data.techRank.map((row) => { const isCurrentTech = row.technician === technicianName; return <tr key={row.technician} className={`border-b border-slate-100 ${isCurrentTech ? "bg-slate-100 text-base font-semibold text-slate-900 print:bg-slate-100 print:text-sm" : row.isOnPto ? "bg-amber-50 text-slate-700" : "text-slate-700"}`}><td className={`px-3 ${isCurrentTech ? "py-3 print:py-2" : "py-2 print:py-1.5"}`}>{row.rank}</td><td className={`px-3 ${isCurrentTech ? "py-3 print:py-2" : "py-2 print:py-1.5"}`}>{row.technician}</td><td className={`px-3 ${isCurrentTech ? "py-3 print:py-2" : "py-2 print:py-1.5"}`}>{row.isOnPto ? <span className="font-semibold text-amber-800">On PTO</span> : row.status === "needs_work" ? "Needs Work" : row.status === "overloaded" ? "Overloaded" : "Balanced"}</td><td className={`px-3 ${isCurrentTech ? "py-3 print:py-2" : "py-2 print:py-1.5"}`}>{row.remainingHours}</td><td className={`px-3 ${isCurrentTech ? "py-3 print:py-2" : "py-2 print:py-1.5"}`}>{row.loadPct}%</td></tr>; })}</tbody></table></div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm print:rounded-none print:border-none print:p-0 print:shadow-none">
        <h2 className="text-base font-semibold text-slate-900 print:text-sm">Jobs in Process</h2>
        {canManageHolds ? <p className="mt-1 text-sm text-slate-600 print-hidden">Use Hold to temporarily exclude a job from this technician&apos;s workload until you release it.</p> : null}
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full border-collapse text-sm print:text-[11px]">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-600">
                <th className="px-3 py-2 print:px-2 print:py-1.5">RO Number</th><th className="px-3 py-2 print:px-2 print:py-1.5">Owner</th><th className="px-3 py-2 print:px-2 print:py-1.5">Vehicle</th><th className="px-3 py-2 print:px-2 print:py-1.5">Estimator</th><th className="px-3 py-2 print:px-2 print:py-1.5">Insurance</th><th className="px-3 py-2 print:px-2 print:py-1.5">Days</th><th className="px-3 py-2 print:px-2 print:py-1.5">Stage</th><th className="px-3 py-2 print:px-2 print:py-1.5">RO Hours</th><th className="px-3 py-2 print:px-2 print:py-1.5">Remaining Hours</th><th className="px-3 py-2 print:px-2 print:py-1.5">Hold Status</th>{canManageHolds ? <th className="px-3 py-2 print-hidden">Hold</th> : null}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr key={row.id} className={`border-b border-slate-100 ${row.isHeld ? "bg-amber-50" : row.isHighlightedInsurance ? "bg-sky-50/80" : ""}`}>
                  <td className={`px-3 py-2 print:px-2 print:py-1.5 ${row.isHighlightedInsurance ? "border-l-4 border-sky-500 font-semibold" : ""}`}>{row.roNumber}{row.isHighlightedInsurance ? <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-sky-700">★ Focus insurer</div> : null}</td><td className="px-3 py-2 print:px-2 print:py-1.5">{row.owner}</td><td className="px-3 py-2 print:px-2 print:py-1.5">{row.vehicle}</td><td className="px-3 py-2 print:px-2 print:py-1.5">{row.estimator || "—"}</td><td className="px-3 py-2 print:px-2 print:py-1.5">{row.isHighlightedInsurance ? <div><div className="font-semibold text-slate-900">{row.insurance || "—"}</div><div className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-sky-700">Focus insurer</div></div> : (row.insurance || "—")}</td><td className="px-3 py-2 print:px-2 print:py-1.5">{Math.round(row.daysInShop || 0)}</td><td className="px-3 py-2 print:px-2 print:py-1.5">{row.stage}</td><td className="px-3 py-2 print:px-2 print:py-1.5">{Math.round(row.roHours)}</td><td className="px-3 py-2 print:px-2 print:py-1.5">{Math.round(row.remainingHours)}</td>
                  <td className="px-3 py-2 print:px-2 print:py-1.5">{row.isHeld ? <div className="text-amber-800"><div className="font-semibold">ON HOLD</div>{row.holdReason ? <div className="text-xs">{row.holdReason}</div> : null}</div> : <span className="text-slate-400">—</span>}</td>
                  {canManageHolds ? <td className="px-3 py-2 print-hidden"><div className="flex flex-col gap-1"><HoldToggleButton roNumber={row.roNumber} isHeld={row.isHeld} holdReason={row.holdReason || ""} /></div></td> : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
