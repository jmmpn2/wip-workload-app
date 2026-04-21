"use client";

import { useState } from "react";

export function ShopManagementForm({ shops }: { shops: { id: string; name: string; isActive: boolean }[] }) {
  const [name, setName] = useState("");
  const [status, setStatus] = useState("");
  const [rows, setRows] = useState(shops);

  async function createShop(e: React.FormEvent) {
    e.preventDefault();
    setStatus("Creating shop...");
    const res = await fetch("/api/shops", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    const data = await res.json().catch(() => ({ error: "Create failed." }));
    if (!res.ok) return setStatus(data.error || "Create failed.");
    setRows(data.shops);
    setName("");
    setStatus(`Created ${data.created.name}.`);
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Shops</h2>
        <p className="mt-1 text-sm text-slate-600">Executive and super admin accounts can create additional shops here.</p>
      </div>
      <form onSubmit={createShop} className="flex flex-wrap items-end gap-3">
        <div className="min-w-[280px] flex-1">
          <label className="mb-1 block text-sm font-medium text-slate-700">Shop name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2" required />
        </div>
        <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white">Create Shop</button>
      </form>
      {status ? <p className="text-sm text-slate-600">{status}</p> : null}
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50"><tr><th className="px-4 py-3 text-left font-semibold text-slate-700">Shop</th><th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th></tr></thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.map((shop) => <tr key={shop.id}><td className="px-4 py-3 text-slate-900">{shop.name}</td><td className="px-4 py-3 text-slate-600">{shop.isActive ? "Active" : "Inactive"}</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
