"use client";

import { useState } from "react";

export function UploadCard() {
  const [status, setStatus] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem("file") as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      setStatus("Choose an Excel or PDF file first.");
      return;
    }

    const data = new FormData();
    data.append("file", file);
    setStatus("Uploading...");

    const res = await fetch("/api/import", { method: "POST", body: data });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus(json.error || "Import failed.");
      return;
    }

    setStatus(
      `${json.fileType}: Imported ${json.rowCount} rows • Techs found: ${json.techsFound} • Unassigned jobs: ${json.unassignedJobs} • Skipped rows: ${json.skippedRows}`
    );
    window.location.reload();
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Upload WIP File</h2>
      <p className="mt-1 text-sm text-slate-600">Upload a new Excel or RepairPulse PDF export to overwrite the current snapshot for this shop.</p>
      <input name="file" type="file" accept=".xlsx,.xls,.pdf,application/pdf" className="mt-4 block w-full text-sm" />
      <button className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-white">Import</button>
      {status ? <p className="mt-3 text-sm text-slate-700">{status}</p> : null}
    </form>
  );
}
