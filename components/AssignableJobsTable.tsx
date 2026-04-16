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
  isHighlightedInsurance?: boolean;
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
      <div className="mt-4 max-h-[520px] overflow-y-auto overflow-x-visible">
        <table className="w-full table-fixed border-collapse text-sm">
          <thead className="sticky top-0 bg-white">
            <tr className="border-b border-slate-200 text-slate-600">
              <th className="w-[90px] px-3 py-2 text-left"><button type="button" onClick={() => toggleSort("roNumber")} className="inline-flex items-center gap-1 font-medium hover:text-slate-900"><span>RO #</span><span className="text-xs text-slate-400">{sortKey === "roNumber" ? (direction === "asc" ? "▲" : "▼") : "↕"}</span></button></th>
              <th className="w-[150px] px-3 py-2 text-left"><button type="button" onClick={() => toggleSort("owner")} className="inline-flex items-center gap-1 font-medium hover:text-slate-900"><span>Owner</span><span className="text-xs text-slate-400">{sortKey === "owner" ? (direction === "asc" ? "▲" : "▼") : "↕"}</span></button></th>
              <th className="w-[170px] px-3 py-2 text-left"><button type="button" onClick={() => toggleSort("vehicle")} className="inline-flex items-center gap-1 font-medium hover:text-slate-900"><span>Vehicle</span><span className="text-xs text-slate-400">{sortKey === "vehicle" ? (direction === "asc" ? "▲" : "▼") : "↕"}</span></button></th>
              <th className="w-[120px] px-3 py-2 text-left"><button type="button" onClick={() => toggleSort("estimator")} className="inline-flex items-center gap-1 font-medium hover:text-slate-900"><span>Estimator</span><span className="text-xs text-slate-400">{sortKey === "estimator" ? (direction === "asc" ? "▲" : "▼") : "↕"}</span></button></th>
              <th className="w-[160px] px-3 py-2 text-left"><button type="button" onClick={() => toggleSort("insurance")} className="inline-flex items-center gap-1 font-medium hover:text-slate-900"><span>Insurance</span><span className="text-xs text-slate-400">{sortKey === "insurance" ? (direction === "asc" ? "▲" : "▼") : "↕"}</span></button></th>
              <th className="w-[70px] px-3 py-2 text-right"><button type="button" onClick={() => toggleSort("daysInShop")} className="inline-flex items-center gap-1 font-medium hover:text-slate-900"><span>Days</span><span className="text-xs text-slate-400">{sortKey === "daysInShop" ? (direction === "asc" ? "▲" : "▼") : "↕"}</span></button></th>
              <th className="w-[120px] px-3 py-2 text-left"><button type="button" onClick={() => toggleSort("stage")} className="inline-flex items-center gap-1 font-medium hover:text-slate-900"><span>Stage</span><span className="text-xs text-slate-400">{sortKey === "stage" ? (direction === "asc" ? "▲" : "▼") : "↕"}</span></button></th>
              <th className="w-[95px] px-3 py-2 text-right"><button type="button" onClick={() => toggleSort("roHours")} className="inline-flex items-center gap-1 font-medium hover:text-slate-900"><span>RO Hours</span><span className="text-xs text-slate-400">{sortKey === "roHours" ? (direction === "asc" ? "▲" : "▼") : "↕"}</span></button></th>
              <th className="w-[130px] px-3 py-2 text-right"><button type="button" onClick={() => toggleSort("remainingHours")} className="inline-flex items-center gap-1 font-medium hover:text-slate-900"><span>Remaining Hours</span><span className="text-xs text-slate-400">{sortKey === "remainingHours" ? (direction === "asc" ? "▲" : "▼") : "↕"}</span></button></th>
              <th className="w-[205px] px-3 py-2 text-left"><button type="button" onClick={() => toggleSort("handoutNote")} className="inline-flex items-center gap-1 font-medium hover:text-slate-900"><span>Note</span><span className="text-xs text-slate-400">{sortKey === "handoutNote" ? (direction === "asc" ? "▲" : "▼") : "↕"}</span></button></th>
              <th className="w-[140px] px-3 py-2">Status</th>
              <th className="w-[170px] px-3 py-2 print-hidden">Action</th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.length ? sortedRows.map((row) => (
              <tr key={row.id} className={`border-b border-slate-100 ${row.isHighlightedInsurance ? "bg-slate-50 ring-1 ring-inset ring-slate-300" : variant === "hold" ? "bg-amber-50" : variant === "tow_in" ? "bg-blue-50" : ""}`}>
                <td className={`px-3 py-2 ${row.isHighlightedInsurance ? "border-l-4 border-slate-900 font-semibold" : ""}`}><div>{row.roNumber}</div>{row.isHighlightedInsurance ? <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">★ Focus insurer</div> : null}</td>
                <td className="px-3 py-2">{row.owner}</td>
                <td className="px-3 py-2">{row.vehicle}</td>
                <td className="px-3 py-2">{row.estimator || "—"}</td>
                <td className="px-3 py-2">{row.isHighlightedInsurance ? <div><div className="font-semibold text-slate-900">{row.insurance || "—"}</div><div className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">Focus insurer</div></div> : (row.insurance || "—")}</td>
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
                    <div className="flex flex-col gap-2">
                      <TowInEstimateToggleButton roNumber={row.roNumber} isTowInEstimate />
                      <HandoutHoldToggleButton roNumber={row.roNumber} isHeld={false} holdReason={row.handoutHoldReason || ""} />
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
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
