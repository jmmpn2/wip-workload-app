"use client";

import { useState } from "react";

export function ReportRecipientsSettingsForm({
  reportRecipients,
}: {
  reportRecipients: string;
}) {
  const [value, setValue] = useState(reportRecipients || "");
  const [status, setStatus] = useState("");

  async function save() {
    setStatus("Saving...");

    const res = await fetch("/api/settings/shop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportRecipients: value }),
    });

    const json = await res.json().catch(() => ({}));
    setStatus(res.ok ? "Saved." : json.error || "Save failed.");
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Email Report Recipients</h2>
      <p className="mt-1 text-sm text-slate-600">
        Enter one or more email addresses separated by commas. These recipients
        will receive the dashboard workbook when you click Email Report.
      </p>

      <div className="mt-4">
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Recipients
        </label>
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={3}
          placeholder="writer1@example.com, writer2@example.com"
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </div>

      <button
        type="button"
        onClick={save}
        className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-white"
      >
        Save Recipients
      </button>

      {status ? <p className="mt-3 text-sm text-slate-600">{status}</p> : null}
    </div>
  );
}
