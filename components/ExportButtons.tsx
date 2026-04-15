"use client";

import { useState } from "react";

export function ExportButtons() {
  const [emailStatus, setEmailStatus] = useState("");
  const [isSending, setIsSending] = useState(false);

  async function sendEmailReport() {
    try {
      setIsSending(true);
      setEmailStatus("Sending email report...");

      const res = await fetch("/api/report-email", { method: "POST" });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setEmailStatus(json.error || "Email report failed.");
        return;
      }

      setEmailStatus("Email report sent.");
    } catch {
      setEmailStatus("Email report failed.");
    } finally {
      setIsSending(false);
    }
  }

  function printAllTechReports() {
    window.open("/print/tech-reports", "_blank", "noopener,noreferrer");
  }

  function printEmailReport() {
    window.open("/print/email-report", "_blank", "noopener,noreferrer");
  }

  return (
    <div className="print-hidden flex flex-wrap items-center justify-end gap-3">
      <button
        type="button"
        onClick={printEmailReport}
        className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
      >
        Print Email Report
      </button>

      <button
        type="button"
        onClick={printAllTechReports}
        className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
      >
        Print All Tech Reports
      </button>

      <button
        type="button"
        onClick={sendEmailReport}
        disabled={isSending}
        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSending ? "Sending..." : "Email Report"}
      </button>

      {emailStatus ? (
        <p className="w-full text-right text-sm text-slate-600">{emailStatus}</p>
      ) : null}
    </div>
  );
}
