export function WipTable({ rows }: { rows: any[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Current WIP Rows</h2>
      <div className="mt-4 max-h-[520px] overflow-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead className="sticky top-0 bg-white"><tr className="border-b border-slate-200 text-left text-slate-600">
            <th className="px-3 py-2">RO #</th><th className="px-3 py-2">Owner</th><th className="px-3 py-2">Vehicle</th><th className="px-3 py-2">Technician</th><th className="px-3 py-2">Stage</th><th className="px-3 py-2">RO Hours</th><th className="px-3 py-2">Remaining Hours</th>
          </tr></thead>
          <tbody>{rows.map((row) => (
            <tr key={row.id} className="border-b border-slate-100">
              <td className="px-3 py-2">{row.roNumber}</td><td className="px-3 py-2">{row.owner}</td><td className="px-3 py-2">{row.vehicle}</td><td className="px-3 py-2">{row.technician}</td><td className="px-3 py-2">{row.stage}</td><td className="px-3 py-2">{row.roHours.toFixed(1)}</td><td className="px-3 py-2">{row.remainingHours.toFixed(1)}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
