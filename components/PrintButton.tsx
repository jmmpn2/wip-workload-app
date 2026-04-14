"use client";
export function PrintButton() {
  return <button onClick={() => window.print()} className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white">Print</button>;
}
