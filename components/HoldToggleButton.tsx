"use client";

import { useState } from "react";

export function HoldToggleButton({
  roNumber,
  isHeld,
  holdReason,
}: {
  roNumber: string;
  isHeld: boolean;
  holdReason: string;
}) {
  const [busy, setBusy] = useState(false);

  async function toggleHold() {
    setBusy(true);
    const reason = isHeld ? "" : window.prompt("Optional hold reason", holdReason || "Back order") || "";
    const res = await fetch("/api/holds/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roNumber, reason }),
    });
    setBusy(false);
    if (res.ok) window.location.reload();
  }

  return (
    <button
      onClick={toggleHold}
      disabled={busy}
      className={`rounded-lg px-3 py-1 text-xs font-semibold ${isHeld ? "bg-amber-100 text-amber-800" : "bg-slate-900 text-white"} disabled:opacity-50`}
    >
      {busy ? "Saving..." : isHeld ? "Release Hold" : "Put On Hold"}
    </button>
  );
}
