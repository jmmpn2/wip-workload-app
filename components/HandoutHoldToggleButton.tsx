"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function HandoutHoldToggleButton({ roNumber, isHeld, holdReason }: { roNumber: string; isHeld: boolean; holdReason: string; }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onToggle() {
    const reason = isHeld ? "" : (window.prompt("Reason this car is not ready to hand out:", holdReason || "") || "").trim();

    try {
      setBusy(true);
      const res = await fetch("/api/handout-holds/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roNumber, reason }),
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
      className={`rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm disabled:opacity-60 ${isHeld ? "bg-slate-800 text-white hover:bg-slate-700" : "bg-amber-100 text-amber-900 hover:bg-amber-200"}`}
    >
      {busy ? "Saving..." : isHeld ? "Undo Not Ready" : "Not Ready To Handout"}
    </button>
  );
}
