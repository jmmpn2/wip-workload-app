"use client";

export function ExportButtons() {
  function printAllTechReports() {
    window.open("/print/tech-reports", "_blank", "noopener,noreferrer");
  }

  return (
    <div className="print-hidden flex flex-wrap items-center justify-end gap-3">
      <button type="button" onClick={printAllTechReports} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
        Print All Tech Reports
      </button>
      <a href="/api/export" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800">
        Export Excel
      </a>
    </div>
  );
}
