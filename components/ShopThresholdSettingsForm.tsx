"use client";
import { useState } from "react";

export function ShopThresholdSettingsForm({ needsWorkThreshold, overloadedThreshold }: { needsWorkThreshold: number; overloadedThreshold: number; }) {
  const [needsWork, setNeedsWork] = useState(needsWorkThreshold);
  const [overloaded, setOverloaded] = useState(overloadedThreshold);
  const [status, setStatus] = useState("");

  async function save() {
    setStatus("Saving...");
    const res = await fetch("/api/settings/shop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ needsWorkThreshold: needsWork, overloadedThreshold: overloaded }),
    });
    const json = await res.json().catch(() => ({}));
    setStatus(res.ok ? "Saved." : json.error || "Save failed.");
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Load Thresholds</h2>
      <p className="mt-1 text-sm text-slate-600">Use load % to visually flag who needs work and who is overloaded.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Needs Work Under %</label>
          <input type="number" value={needsWork} onChange={(e) => setNeedsWork(Number(e.target.value))} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Overloaded Over %</label>
          <input type="number" value={overloaded} onChange={(e) => setOverloaded(Number(e.target.value))} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        </div>
      </div>
      <button onClick={save} className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-white">Save Thresholds</button>
      {status ? <p className="mt-3 text-sm text-slate-600">{status}</p> : null}
    </div>
  );
}
