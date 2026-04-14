"use client";
import { useState } from "react";
export function LoginForm({ shops }: { shops: { id: string; name: string }[] }) {
  const [password, setPassword] = useState("");
  const [shopId, setShopId] = useState(shops[0]?.id ?? "");
  const [error, setError] = useState("");
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password, shopId }) });
    if (!res.ok) { const data = await res.json().catch(() => ({ error: "Login failed" })); setError(data.error || "Login failed"); return; }
    window.location.href = "/dashboard";
  }
  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div><label className="mb-1 block text-sm font-medium text-slate-700">Shop</label><select value={shopId} onChange={(e) => setShopId(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2">{shops.map((shop) => <option key={shop.id} value={shop.id}>{shop.name}</option>)}</select></div>
      <div><label className="mb-1 block text-sm font-medium text-slate-700">Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2" /></div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button className="w-full rounded-xl bg-slate-900 px-4 py-2 font-medium text-white">Enter</button>
    </form>
  );
}
