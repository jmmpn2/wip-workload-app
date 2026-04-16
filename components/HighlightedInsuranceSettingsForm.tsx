"use client";

import { useMemo, useState } from "react";

type Props = {
  availableInsurers: string[];
  highlightedInsurers: string[];
};

export function HighlightedInsuranceSettingsForm({ availableInsurers, highlightedInsurers }: Props) {
  const [selectedToAdd, setSelectedToAdd] = useState(availableInsurers[0] || "");
  const [selected, setSelected] = useState(highlightedInsurers);
  const [status, setStatus] = useState("");

  const addableOptions = useMemo(
    () => availableInsurers.filter((name) => !selected.some((item) => item.toLowerCase() === name.toLowerCase())),
    [availableInsurers, selected]
  );

  async function save(nextSelected: string[]) {
    setSelected(nextSelected);
    setStatus("Saving...");
    const res = await fetch("/api/settings/highlighted-insurance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ highlightedInsurers: nextSelected }),
    });
    const json = await res.json().catch(() => ({}));
    setStatus(res.ok ? "Saved." : json.error || "Save failed.");
  }

  async function addSelected() {
    const value = selectedToAdd.trim();
    if (!value) return;
    if (selected.some((item) => item.toLowerCase() === value.toLowerCase())) return;
    const nextSelected = [...selected, value];
    await save(nextSelected);
    const remaining = addableOptions.filter((name) => name.toLowerCase() !== value.toLowerCase());
    setSelectedToAdd(remaining[0] || "");
  }

  async function removeSelected(name: string) {
    const nextSelected = selected.filter((item) => item.toLowerCase() !== name.toLowerCase());
    await save(nextSelected);
    if (!selectedToAdd) {
      const remaining = availableInsurers.filter((item) => !nextSelected.some((entry) => entry.toLowerCase() === item.toLowerCase()));
      setSelectedToAdd(remaining[0] || "");
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Highlighted Insurance Companies</h2>
      <p className="mt-1 text-sm text-slate-600">
        Pick insurers from the most recent import. Matching repairs will stand out across the dashboard and on technician printouts.
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="min-w-[280px] flex-1">
          <label className="mb-1 block text-sm font-medium text-slate-700">Insurance company to highlight</label>
          <select
            value={selectedToAdd}
            onChange={(e) => setSelectedToAdd(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            disabled={!addableOptions.length}
          >
            {addableOptions.length ? addableOptions.map((name) => (
              <option key={name} value={name}>{name}</option>
            )) : <option value="">No more insurers available</option>}
          </select>
        </div>
        <button
          type="button"
          onClick={() => void addSelected()}
          disabled={!addableOptions.length || !selectedToAdd}
          className="rounded-xl bg-slate-900 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          Add Highlight
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {selected.length ? selected.map((name) => (
          <div key={name} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2">
            <div>
              <div className="font-medium text-slate-900">{name}</div>
              <div className="text-xs text-slate-500">Shown with a left border and focus badge on screen, and a black-and-white focus marker on print.</div>
            </div>
            <button
              type="button"
              onClick={() => void removeSelected(name)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Remove
            </button>
          </div>
        )) : (
          <p className="text-sm text-slate-500">No insurers are highlighted yet.</p>
        )}
      </div>

      {status ? <p className="mt-3 text-sm text-slate-600">{status}</p> : null}
    </div>
  );
}
