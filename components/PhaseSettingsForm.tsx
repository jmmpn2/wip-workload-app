"use client";

import { useState } from "react";

export function PhaseSettingsForm({
  phases,
}: {
  phases: {
    id: string;
    phaseName: string;
    remainingPct: number;
    sortOrder: number;
    countsInLoad: boolean;
    fixedHours: number | null;
    stageGroup: string | null;
  }[];
}) {
  const [rows, setRows] = useState(phases);
  const [status, setStatus] = useState("");

  async function save() {
    setStatus("Saving...");
    const res = await fetch("/api/settings/phases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phases: rows }),
    });
    const json = await res.json().catch(() => ({}));
    setStatus(res.ok ? "Saved." : json.error || "Save failed.");
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Phase Rules</h2>
      <div className="mt-4 space-y-3">
        {rows.map((row, index) => (
          <div key={row.id} className="grid gap-3 rounded-xl border border-slate-200 p-3 md:grid-cols-6">
            <input
              value={row.phaseName}
              onChange={(e) => {
                const copy = [...rows];
                copy[index].phaseName = e.target.value;
                setRows(copy);
              }}
              className="rounded-lg border border-slate-300 px-3 py-2"
            />
            <input
              type="number"
              step="0.01"
              value={row.remainingPct}
              onChange={(e) => {
                const copy = [...rows];
                copy[index].remainingPct = Number(e.target.value);
                setRows(copy);
              }}
              className="rounded-lg border border-slate-300 px-3 py-2"
              placeholder="Remaining %"
            />
            <input
              type="number"
              step="1"
              value={row.sortOrder}
              onChange={(e) => {
                const copy = [...rows];
                copy[index].sortOrder = Number(e.target.value);
                setRows(copy);
              }}
              className="rounded-lg border border-slate-300 px-3 py-2"
              placeholder="Sort"
            />
            <input
              type="number"
              step="0.1"
              value={row.fixedHours ?? ""}
              onChange={(e) => {
                const copy = [...rows];
                copy[index].fixedHours = e.target.value === "" ? null : Number(e.target.value);
                setRows(copy);
              }}
              className="rounded-lg border border-slate-300 px-3 py-2"
              placeholder="Fixed hrs"
            />
            <input
              value={row.stageGroup ?? ""}
              onChange={(e) => {
                const copy = [...rows];
                copy[index].stageGroup = e.target.value;
                setRows(copy);
              }}
              className="rounded-lg border border-slate-300 px-3 py-2"
              placeholder="Stage group"
            />
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={row.countsInLoad}
                onChange={(e) => {
                  const copy = [...rows];
                  copy[index].countsInLoad = e.target.checked;
                  setRows(copy);
                }}
              />
              Counts
            </label>
          </div>
        ))}
      </div>
      <button onClick={save} className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-white">Save Phase Rules</button>
      {status ? <p className="mt-3 text-sm text-slate-600">{status}</p> : null}
    </div>
  );
}
