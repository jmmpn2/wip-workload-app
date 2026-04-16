"use client";

import { useState } from "react";

export function JobBucketNoteEditor({ roNumber, initialNote }: { roNumber: string; initialNote: string }) {
  const [note, setNote] = useState(initialNote || "");
  const [status, setStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function saveNote() {
    try {
      setIsSaving(true);
      setStatus("Saving...");
      const res = await fetch("/api/job-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roNumber, note }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus(json.error || "Save failed.");
        return;
      }
      setStatus("Saved");
      window.setTimeout(() => setStatus(""), 1600);
    } catch {
      setStatus("Save failed.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="min-w-[220px]">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder="Add note"
        className="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-700"
      />
      <div className="mt-1 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={saveNote}
          disabled={isSaving}
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
        {status ? <span className="text-[11px] text-slate-500">{status}</span> : null}
      </div>
    </div>
  );
}
