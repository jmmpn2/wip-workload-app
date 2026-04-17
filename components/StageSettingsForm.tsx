"use client";
import { useState } from "react";
type StageRow = { id: string; stageName: string; logicType: string; remainingPct: number; fixedHours: number | null; includeInLoad: boolean; sortOrder: number; };
export function StageSettingsForm({ stages }: { stages: StageRow[] }) {
  const [rows, setRows] = useState(stages.map((stage) => ({ ...stage, remainingPct: stage.logicType === "FIXED" ? stage.remainingPct : Number((stage.remainingPct * 100).toFixed(2)) })));
  const [status, setStatus] = useState("");
  async function save() {
    setStatus("Saving...");
    const payload = rows.map((row) => ({
      ...row,
      remainingPct: row.logicType === "FIXED" ? row.remainingPct : Number((row.remainingPct / 100).toFixed(4)),
    }));
    const res = await fetch("/api/settings/stages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stages: payload }) });
    const json = await res.json().catch(() => ({}));
    setStatus(res.ok ? "Saved." : json.error || "Save failed.");
  }
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Stage Rules</h2>
      <p className="mt-1 text-sm text-slate-600">Each phase is its own stage in the dashboard. Percent Remaining values are shown as percentages.</p>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead><tr className="border-b border-slate-200 text-left text-slate-600"><th className="px-3 py-2">Stage</th><th className="px-3 py-2">Logic</th><th className="px-3 py-2">Value</th><th className="px-3 py-2">Include</th><th className="px-3 py-2">Order</th></tr></thead>
          <tbody>{rows.map((row, index) => (
            <tr key={row.id} className="border-b border-slate-100">
              <td className="px-3 py-2 font-medium text-slate-900">{row.stageName}</td>
              <td className="px-3 py-2"><select value={row.logicType} onChange={(e) => { const copy=[...rows]; copy[index].logicType=e.target.value; setRows(copy); }} className="rounded-lg border border-slate-300 px-3 py-2"><option value="PERCENT">Percent Remaining</option><option value="FIXED">Fixed Hours</option><option value="EXCLUDE">Exclude</option></select></td>
              <td className="px-3 py-2">{row.logicType === "FIXED" ? <input type="number" step="1" value={row.fixedHours ?? ""} onChange={(e) => { const copy=[...rows]; copy[index].fixedHours=e.target.value === "" ? null : Number(e.target.value); setRows(copy); }} className="w-28 rounded-lg border border-slate-300 px-3 py-2" /> : <div className="relative w-28"><input type="number" step="1" value={row.remainingPct} onChange={(e) => { const copy=[...rows]; copy[index].remainingPct=e.target.value === "" ? 0 : Number(e.target.value); setRows(copy); }} className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-8" /><span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-500">%</span></div>}</td>
              <td className="px-3 py-2"><input type="checkbox" checked={row.includeInLoad} onChange={(e) => { const copy=[...rows]; copy[index].includeInLoad=e.target.checked; setRows(copy); }} /></td>
              <td className="px-3 py-2"><input type="number" step="1" value={row.sortOrder} onChange={(e) => { const copy=[...rows]; copy[index].sortOrder=Number(e.target.value); setRows(copy); }} className="w-24 rounded-lg border border-slate-300 px-3 py-2" /></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <button onClick={save} className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-white">Save Stage Rules</button>
      {status ? <p className="mt-3 text-sm text-slate-600">{status}</p> : null}
    </div>
  );
}
