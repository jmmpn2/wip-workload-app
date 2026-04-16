"use client";

import { useMemo, useState } from "react";
import { HandoutHoldToggleButton } from "@/components/HandoutHoldToggleButton";
import { TowInEstimateToggleButton } from "@/components/TowInEstimateToggleButton";
import { JobBucketNoteEditor } from "@/components/JobBucketNoteEditor";

type BucketRow = {
  id: string;
  roNumber: string;
  owner: string;
  vehicle: string;
  estimator: string;
  insurance: string;
  daysInShop: number;
  stage: string;
  roHours: number;
  remainingHours: number;
  handoutHoldReason?: string;
  handoutNote?: string;
};

type SortKey = keyof Pick<BucketRow, "roNumber" | "owner" | "vehicle" | "estimator" | "insurance" | "daysInShop" | "stage" | "roHours" | "remainingHours" | "handoutNote">;

function SortableHeader({ label, sortKey, activeKey, direction, onToggle, align = "left" }: { label: string; sortKey: SortKey; activeKey: SortKey; direction: "asc" | "desc"; onToggle: (key: SortKey) => void; align?: "left" | "right"; }) {
  const active = activeKey === sortKey;
  return (
    <th className={`px-3 py-2 ${align === "right" ? "text-right" : "text-left"}`}>
      <button type="button" onClick={() => onToggle(sortKey)} className="inline-flex items-center gap-1 font-medium hover:text-slate-900">
        <span>{label}</span>
        <span className="text-xs text-slate-400">{active ? (direction === "asc" ? "▲" : "▼") : "↕"}</span>
      </button>
    </th>
  );
}

function sortRows(rows: BucketRow[], sortKey: SortKey, direction: "asc" | "desc") {
  const factor = direction === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const av = a[sortKey] ?? "";
    const bv = b[sortKey] ?? "";
    let cmp = 0;
    if (typeof av === "number" && typeof bv === "number") cmp = av - bv;
    else cmp = String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: "base" });
    if (cmp !== 0) return cmp * factor;
    return a.roNumber.localeCompare(b.roNumber) * factor;
  });
}

function HandoutTable({ title, description, rows, variant }: { title: string; description: string; rows: BucketRow[]; variant: "assignable" | "tow_in" | "hold"; }) {
  const [sortKey, setSortKey] = useState<SortKey>("remainingHours");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");

  function toggleSort(nextKey: SortKey) {
    if (nextKey === sortKey) {
      setDirection(direction === "asc" ? "desc" : "asc");
      return;
    }
    setSortKey(nextKey);
    setDirection(nextKey === "daysInShop" || nextKey === "owner" || nextKey === "vehicle" || nextKey === "estimator" || nextKey === "insurance" || nextKey === "stage" || nextKey === "handoutNote" ? "asc" : "desc");
  }

  const sortedRows = useMemo(() => sortRows(rows, sortKey, direction), [rows, sortKey, direction]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
      <div className="mt-4 max-h-[520px] overflow-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead className="sticky top-0 bg-white">
            <tr className="border-b border-slate-200 text-slate-600">
              <SortableHeader label="RO #" sortKey="roNumber" activeKey={sortKey} direction={direction} onToggle={toggleSort} />
              <SortableHeader label="Owner" sortKey="owner" activeKey={sortKey} direction={direction} onToggle={toggleSort} />
              <SortableHeader label="Vehicle" sortKey="vehicle" activeKey={sortKey} direction={direction} onToggle={toggleSort} />
              <SortableHeader label="Estimator" sortKey="estimator" activeKey={sortKey} direction={direction} onToggle={toggleSort} />
              <SortableHeader label="Insurance" sortKey="insurance" activeKey={sortKey} direction={direction} onToggle={toggleSort} />
              <SortableHeader label="Days" sortKey="daysInShop" activeKey={sortKey} direction={direction} onToggle={toggleSort} align="right" />
              <SortableHeader label="Stage" sortKey="stage" activeKey={sortKey} direction={direction} onToggle={toggleSort} />
              <SortableHeader label="RO Hours" sortKey="roHours" activeKey={sortKey} direction={direction} onToggle={toggleSort} align="right" />
              <SortableHeader label="Remaining Hours" sortKey="remainingHours" activeKey={sortKey} direction={direction} onToggle={toggleSort} align="right" />
              <SortableHeader label="Note" sortKey="handoutNote" activeKey={sortKey} direction={direction} onToggle={toggleSort} />
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 print-hidden">Action</th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.length ? sortedRows.map((row) => (
              <tr key={row.id} className={`border-b border-slate-100 ${variant === "hold" ? "bg-amber-50" : variant === "tow_in" ? "bg-blue-50" : ""}`}>
                <td className="px-3 py-2">{row.roNumber}</td>
                <td className="px-3 py-2">{row.owner}</td>
                <td className="px-3 py-2">{row.vehicle}</td>
                <td className="px-3 py-2">{row.estimator || "—"}</td>
                <td className="px-3 py-2">{row.insurance || "—"}</td>
                <td className="px-3 py-2 text-right">{Math.round(row.daysInShop || 0)}</td>
                <td className="px-3 py-2">{row.stage}</td>
                <td className="px-3 py-2 text-right">{Math.round(row.roHours)}</td>
                <td className="px-3 py-2 text-right">{Math.round(row.remainingHours)}</td>
                <td className="px-3 py-2"><JobBucketNoteEditor roNumber={row.roNumber} initialNote={row.handoutNote || ""} /></td>
                <td className="px-3 py-2">
                  {variant === "hold" ? (
                    <div className="text-amber-800">
                      <div className="font-semibold">ON HOLD</div>
                      {row.handoutHoldReason ? <div className="text-xs">{row.handoutHoldReason}</div> : null}
                    </div>
                  ) : variant === "tow_in" ? (
                    <div className="font-semibold text-blue-800">Tow in - Needs Estimate</div>
                  ) : (
                    <span className="text-slate-400">Ready to handout</span>
                  )}
                </td>
                <td className="px-3 py-2 print-hidden">
                  {variant === "hold" ? (
                    <HandoutHoldToggleButton roNumber={row.roNumber} isHeld holdReason={row.handoutHoldReason || ""} />
                  ) : variant === "tow_in" ? (
                    <TowInEstimateToggleButton roNumber={row.roNumber} isTowInEstimate />
                  ) : (
                    <div className="flex gap-2">
                      <TowInEstimateToggleButton roNumber={row.roNumber} isTowInEstimate={false} />
                      <HandoutHoldToggleButton roNumber={row.roNumber} isHeld={false} holdReason={row.handoutHoldReason || ""} />
                    </div>
                  )}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={12} className="px-3 py-8 text-center text-slate-500">No cars in this section.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AssignableJobsTable({ rows, towInRows, holdRows }: { rows: BucketRow[]; towInRows: BucketRow[]; holdRows: BucketRow[] }) {
  return (
    <div className="space-y-6">
      <HandoutTable title="Cars To Handout" description="These jobs have no technician assigned and are available to hand out." rows={rows} variant="assignable" />
      <HandoutTable title="Tow Ins Needing Estimate" description="These unassigned tow-ins have been tagged as needing an estimate before they are ready to hand out." rows={towInRows} variant="tow_in" />
      <HandoutTable title="Cars On Hold" description="These jobs are not ready to hand out yet. Release them here to move them back to Cars To Handout." rows={holdRows} variant="hold" />
    </div>
  );
}
