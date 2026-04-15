"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function TowInEstimateToggleButton({ roNumber, isTowInEstimate }: { roNumber: string; isTowInEstimate: boolean; }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onToggle() {
    try {
      setBusy(true);
      const res = await fetch("/api/tow-in-estimate-toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roNumber }),
      });
      if (!res.ok) throw new Error("Failed");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={busy}
      className={`rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm disabled:opacity-60 ${isTowInEstimate ? "bg-slate-800 text-white hover:bg-slate-700" : "bg-blue-100 text-blue-900 hover:bg-blue-200"}`}
    >
      {busy ? "Saving..." : isTowInEstimate ? "Undo Tow In" : "Tow in - Needs Estimate"}
    </button>
  );
}
