"use client";

import { useState } from "react";

export function ShopSwitcher({ shops, currentShopId }: { shops: { id: string; name: string }[]; currentShopId: string | null }) {
  const [value, setValue] = useState(currentShopId || shops[0]?.id || "");
  const [saving, setSaving] = useState(false);

  async function onChange(nextValue: string) {
    setValue(nextValue);
    setSaving(true);
    const res = await fetch("/api/shop-context", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shopId: nextValue }),
    });
    setSaving(false);
    if (!res.ok) return;
    window.location.href = "/dashboard";
  }

  return (
    <div className="flex items-center gap-2 text-sm text-slate-600">
      <span>Shop</span>
      <select value={value} onChange={(e) => void onChange(e.target.value)} className="rounded-lg border border-slate-300 px-2 py-1 text-sm text-slate-700">
        {shops.map((shop) => <option key={shop.id} value={shop.id}>{shop.name}</option>)}
      </select>
      {saving ? <span className="text-xs text-slate-500">Updating...</span> : null}
    </div>
  );
}
