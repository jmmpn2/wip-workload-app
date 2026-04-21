"use client";

import { formatCentralDateTime } from "@/lib/datetime";
import { useEffect, useRef, useState } from "react";

function formatMeta(name: string | null, when: string | null) {
  if (!name || !when) return "";
  const formatted = formatCentralDateTime(when);
  return `Last edited by ${name} on ${formatted}`;
}

export function JobBucketNoteEditor({ roNumber, initialNote, initialLastEditedByName, initialLastEditedAt }: { roNumber: string; initialNote: string; initialLastEditedByName?: string | null; initialLastEditedAt?: string | null }) {
  const [note, setNote] = useState(initialNote || "");
  const [savedNote, setSavedNote] = useState(initialNote || "");
  const [status, setStatus] = useState("");
  const [lastEditedByName, setLastEditedByName] = useState(initialLastEditedByName || "");
  const [lastEditedAt, setLastEditedAt] = useState(initialLastEditedAt || "");
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestCounterRef = useRef(0);

  useEffect(() => {
    setNote(initialNote || "");
    setSavedNote(initialNote || "");
    setStatus("");
    setLastEditedByName(initialLastEditedByName || "");
    setLastEditedAt(initialLastEditedAt || "");
  }, [initialNote, initialLastEditedAt, initialLastEditedByName, roNumber]);

  async function persistNote(nextNote: string) {
    const requestId = ++requestCounterRef.current;
    try {
      setIsSaving(true);
      setStatus("Saving...");
      const res = await fetch("/api/job-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roNumber, note: nextNote }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus(json.error || "Save failed.");
        return;
      }
      if (requestId !== requestCounterRef.current) return;
      setSavedNote(nextNote);
      setLastEditedByName(json.lastEditedByName || "");
      setLastEditedAt(json.lastEditedAt || "");
      setStatus("Saved");
      window.setTimeout(() => {
        if (requestId === requestCounterRef.current) setStatus("");
      }, 1200);
    } catch {
      if (requestId === requestCounterRef.current) setStatus("Save failed.");
    } finally {
      if (requestId === requestCounterRef.current) setIsSaving(false);
    }
  }

  useEffect(() => {
    if (note === savedNote) return;
    setStatus("Editing...");
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      void persistNote(note);
    }, 700);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [note, savedNote]);

  async function clearNote() {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setNote("");
    await persistNote("");
  }

  return (
    <div className="w-[190px] min-w-[190px]">
      <textarea
        title={formatMeta(lastEditedByName || null, lastEditedAt || null) || undefined}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder="Add note"
        className="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-700"
      />
      <div className="mt-1 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => void clearNote()}
          disabled={isSaving && !note}
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          Clear
        </button>
        {status ? <span className="text-[11px] text-slate-500">{status}</span> : <span className="text-[11px] text-transparent">Saved</span>}
      </div>
      {lastEditedByName && lastEditedAt ? <div className="mt-1 text-[10px] text-slate-400">Hover note to see last edit</div> : null}
    </div>
  );
}
