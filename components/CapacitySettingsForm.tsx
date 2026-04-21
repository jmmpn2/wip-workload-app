"use client";
import { useState } from "react";

export function CapacitySettingsForm({ technicians }: { technicians: { id: string; name: string; capacity: number; isActive: boolean; isOnPto: boolean }[] }) {
  const [rows, setRows] = useState(technicians);
  const [status, setStatus] = useState("");
  async function save() {
    setStatus("Saving...");
    const res = await fetch("/api/settings/capacities", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ technicians: rows }) });
    const json = await res.json().catch(() => ({}));
    setStatus(res.ok ? "Saved." : json.error || "Save failed.");
  }
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Technicians</h2>
      <p className="mt-1 text-sm text-slate-600">Technician names come from the import. Weekly capacity is editable here. Mark PTO here to push a tech to the bottom of the ranking while still showing their current workload.</p>
      <div className="mt-4 space-y-3">{rows.map((row, index) => (
        <div key={row.id} className={`grid gap-3 rounded-xl border p-3 md:grid-cols-[1fr_140px_120px_110px] ${row.isOnPto ? "border-amber-300 bg-amber-50" : "border-slate-200"}`}>
          <input value={row.name} onChange={(e) => { const copy=[...rows]; copy[index].name=e.target.value; setRows(copy); }} className="rounded-lg border border-slate-300 px-3 py-2" />
          <input type="number" step="1" value={Math.round(row.capacity)} onChange={(e) => { const copy=[...rows]; copy[index].capacity=Number(e.target.value); setRows(copy); }} className="rounded-lg border border-slate-300 px-3 py-2" />
          <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={row.isActive} onChange={(e) => { const copy=[...rows]; copy[index].isActive=e.target.checked; setRows(copy); }} />Active</label>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={row.isOnPto} onChange={(e) => { const copy=[...rows]; copy[index].isOnPto=e.target.checked; setRows(copy); }} />On PTO</label>
        </div>
      ))}</div>
      <button onClick={save} className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-white">Save Technicians</button>
      {status ? <p className="mt-3 text-sm text-slate-600">{status}</p> : null}
    </div>
  );
}
