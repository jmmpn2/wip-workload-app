export function StageBars({ stages }: { stages: { stage: string; count: number; color: string }[] }) {
  const total = stages.reduce((sum, stage) => sum + stage.count, 0) || 1;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">WIP by Stage</h2>
      <div className="mt-4 flex h-10 overflow-hidden rounded-xl border border-slate-200">
        {stages.map((stage) => (
          <div key={stage.stage} style={{ width: `${(stage.count / total) * 100}%`, backgroundColor: stage.color }} className="flex min-w-[40px] items-center justify-center border-r border-white px-2 text-xs font-medium text-white last:border-r-0" title={`${stage.stage}: ${stage.count}`}>
            {stage.count > 0 ? stage.count : ""}
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-4 xl:grid-cols-6">
        {stages.map((stage) => <div key={stage.stage} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700"><span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: stage.color }} /><span className="font-medium">{stage.stage}</span>: {stage.count}</div>)}
      </div>
    </div>
  );
}
