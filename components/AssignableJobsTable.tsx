import { HandoutHoldToggleButton } from "@/components/HandoutHoldToggleButton";

function HandoutTable({
  title,
  description,
  rows,
  held,
}: {
  title: string;
  description: string;
  rows: any[];
  held: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
      <div className="mt-4 max-h-[520px] overflow-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead className="sticky top-0 bg-white">
            <tr className="border-b border-slate-200 text-left text-slate-600">
              <th className="px-3 py-2">RO #</th>
              <th className="px-3 py-2">Owner</th>
              <th className="px-3 py-2">Vehicle</th>
              <th className="px-3 py-2">Estimator</th>
              <th className="px-3 py-2">Stage</th>
              <th className="px-3 py-2">RO Hours</th>
              <th className="px-3 py-2">Remaining Hours</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 print-hidden">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? rows.map((row) => (
              <tr key={row.id} className={`border-b border-slate-100 ${held ? "bg-amber-50" : ""}`}>
                <td className="px-3 py-2">{row.roNumber}</td>
                <td className="px-3 py-2">{row.owner}</td>
                <td className="px-3 py-2">{row.vehicle}</td>
                <td className="px-3 py-2">{row.estimator || "—"}</td>
                <td className="px-3 py-2">{row.stage}</td>
                <td className="px-3 py-2">{Math.round(row.roHours)}</td>
                <td className="px-3 py-2">{Math.round(row.remainingHours)}</td>
                <td className="px-3 py-2">
                  {held ? (
                    <div className="text-amber-800">
                      <div className="font-semibold">ON HOLD</div>
                      {row.handoutHoldReason ? <div className="text-xs">{row.handoutHoldReason}</div> : null}
                    </div>
                  ) : (
                    <span className="text-slate-400">Ready to handout</span>
                  )}
                </td>
                <td className="px-3 py-2 print-hidden">
                  <HandoutHoldToggleButton roNumber={row.roNumber} isHeld={held} holdReason={row.handoutHoldReason || ""} />
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-slate-500">No cars in this section.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AssignableJobsTable({ rows, holdRows }: { rows: any[]; holdRows: any[] }) {
  return (
    <div className="space-y-6">
      <HandoutTable
        title="Cars To Handout"
        description="These jobs have no technician assigned and are available to hand out."
        rows={rows}
        held={false}
      />
      <HandoutTable
        title="Cars On Hold"
        description="These jobs are not ready to hand out yet. Release them here to move them back to Cars To Handout."
        rows={holdRows}
        held
      />
    </div>
  );
}
