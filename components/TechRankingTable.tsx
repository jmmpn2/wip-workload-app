import Link from "next/link";

function rowClasses(status: string) {
  if (status === "needs_work") return "bg-green-50";
  if (status === "overloaded") return "bg-red-50";
  if (status === "pto") return "bg-amber-50";
  return "";
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    needs_work: "bg-green-100 text-green-800",
    overloaded: "bg-red-100 text-red-800",
    normal: "bg-slate-100 text-slate-700",
    pto: "bg-amber-100 text-amber-900",
  };

  const labels: Record<string, string> = {
    needs_work: "Needs Work",
    overloaded: "Overloaded",
    normal: "Balanced",
    pto: "On PTO",
  };

  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${styles[status] || styles.normal}`}>{labels[status] || labels.normal}</span>;
}

function LoadBar({ loadPct, status, technician }: { loadPct: number; status: string; technician: string; }) {
  const barColor = status === "needs_work" ? "bg-green-500" : status === "overloaded" ? "bg-red-500" : status === "pto" ? "bg-amber-500" : "bg-slate-500";
  const textColor = status === "needs_work" ? "text-green-700" : status === "overloaded" ? "text-red-700" : status === "pto" ? "text-amber-800" : "text-slate-900";
  const cappedWidth = Math.min(loadPct, 100);
  return (
    <Link href={`/tech/${encodeURIComponent(technician)}`} className="block min-w-[150px] rounded-lg p-1 hover:bg-slate-50" title={`Open ${technician}'s detail page`}>
      <div className="mb-1 flex items-center justify-between"><span className={`text-sm font-semibold ${textColor}`}>{loadPct}%</span></div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200"><div className={`h-full rounded-full ${barColor}`} style={{ width: `${cappedWidth}%` }} /></div>
    </Link>
  );
}

export function TechRankingTable({ techRank }: { techRank: any[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Who Needs Work</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead><tr className="border-b border-slate-200 text-left text-slate-600"><th className="px-3 py-2">Rank</th><th className="px-3 py-2">Technician</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Capacity</th><th className="px-3 py-2">Remaining Hours</th><th className="px-3 py-2">Load %</th><th className="px-3 py-2">RO Hours</th><th className="px-3 py-2">Active Jobs</th></tr></thead>
          <tbody>
            {techRank.map((row) => (
              <tr key={row.technician} className={`border-b border-slate-100 ${rowClasses(row.status)}`}>
                <td className="px-3 py-2">{row.rank}</td>
                <td className="px-3 py-2 font-medium text-slate-900"><Link href={`/tech/${encodeURIComponent(row.technician)}`} className="text-blue-700 hover:underline">{row.technician}</Link>{row.isOnPto ? <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700">On PTO</div> : null}</td>
                <td className="px-3 py-2"><StatusPill status={row.status} /></td>
                <td className="px-3 py-2">{row.capacity}</td>
                <td className="px-3 py-2">{row.remainingHours}</td>
                <td className="px-3 py-2"><LoadBar loadPct={row.loadPct} status={row.status} technician={row.technician} /></td>
                <td className="px-3 py-2">{row.roHours}</td>
                <td className="px-3 py-2">{row.activeJobs}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
