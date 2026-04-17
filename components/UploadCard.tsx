"use client";

import { useState } from "react";

export function UploadCard() {
  const [status, setStatus] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem("file") as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      setStatus("Choose an Excel file first.");
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

    setStatus(`Imported ${json.rowCount} rows.`);
    window.location.reload();
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:sticky xl:top-5">
      <h2 className="text-base font-semibold text-slate-900">Upload WIP Excel</h2>
      <p className="mt-1 text-sm leading-5 text-slate-600">Uploading a new file overwrites the current snapshot for this shop.</p>
      <input name="file" type="file" accept=".xlsx,.xls" className="mt-3 block w-full text-sm" />
      <button className="mt-3 w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white">Import</button>
      {status ? <p className="mt-2 text-sm text-slate-700">{status}</p> : null}
    </form>
  );
}
