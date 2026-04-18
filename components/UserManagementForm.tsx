"use client";

import { useState } from "react";

type Role = "SUPER_ADMIN" | "EXECUTIVE" | "SHOP_MANAGER" | "SERVICE_WRITER" | "FDR";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  mustChangePassword: boolean;
  shopName: string | null;
  lastLoginAt: string | null;
};

export function UserManagementForm({ users, shops, allowedRoles, canManageAllShops }: { users: UserRow[]; shops: { id: string; name: string }[]; allowedRoles: Role[]; canManageAllShops: boolean; }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>(allowedRoles[0] || "FDR");
  const [shopId, setShopId] = useState(shops[0]?.id || "");
  const [tempPassword, setTempPassword] = useState("changeme");
  const [status, setStatus] = useState("");
  const [rows, setRows] = useState(users);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setStatus("Creating user...");
    const res = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, role, shopId: shopId || null, tempPassword }) });
    const data = await res.json().catch(() => ({ error: "Create failed." }));
    if (!res.ok) return setStatus(data.error || "Create failed.");
    setRows(data.users);
    setName("");
    setEmail("");
    setTempPassword("changeme");
    setStatus(`Created ${data.created.email}.`);
  }

  async function resetPassword(userId: string) {
    const nextTemp = window.prompt("Enter a temporary password for this user:", "changeme");
    if (!nextTemp) return;
    const res = await fetch("/api/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "reset_password", userId, tempPassword: nextTemp }) });
    const data = await res.json().catch(() => ({ error: "Reset failed." }));
    if (!res.ok) return setStatus(data.error || "Reset failed.");
    setRows(data.users);
    setStatus("Password reset saved.");
  }

  async function toggleActive(userId: string, isActive: boolean) {
    const res = await fetch("/api/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "toggle_active", userId, isActive: !isActive }) });
    const data = await res.json().catch(() => ({ error: "Update failed." }));
    if (!res.ok) return setStatus(data.error || "Update failed.");
    setRows(data.users);
    setStatus("User status updated.");
  }

  return (
    <div className="space-y-6">
      <form onSubmit={createUser} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-5">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2" required />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="w-full rounded-xl border border-slate-300 px-3 py-2" required />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="w-full rounded-xl border border-slate-300 px-3 py-2">
            {allowedRoles.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Shop</label>
          <select value={shopId} onChange={(e) => setShopId(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2" disabled={!canManageAllShops && shops.length === 1}>
            <option value="">None / all shops</option>
            {shops.map((shop) => <option key={shop.id} value={shop.id}>{shop.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Temporary password</label>
          <input value={tempPassword} onChange={(e) => setTempPassword(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2" required />
        </div>
        <div className="lg:col-span-5 flex items-center justify-between gap-3">
          <p className="text-sm text-slate-500">All new users will be forced to change their password at first login.</p>
          <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white">Create User</button>
        </div>
      </form>

      {status ? <p className="text-sm text-slate-600">{status}</p> : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50"><tr><th className="px-4 py-3 text-left font-semibold text-slate-700">Name</th><th className="px-4 py-3 text-left font-semibold text-slate-700">Email</th><th className="px-4 py-3 text-left font-semibold text-slate-700">Role</th><th className="px-4 py-3 text-left font-semibold text-slate-700">Shop</th><th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th><th className="px-4 py-3 text-left font-semibold text-slate-700">Last Login</th><th className="px-4 py-3 text-left font-semibold text-slate-700">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {rows.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3 text-slate-900">{user.name || "—"}</td>
                  <td className="px-4 py-3 text-slate-900">{user.email}</td>
                  <td className="px-4 py-3 text-slate-600">{user.role}</td>
                  <td className="px-4 py-3 text-slate-600">{user.shopName || "All shops"}</td>
                  <td className="px-4 py-3 text-slate-600">{user.isActive ? "Active" : "Inactive"}{user.mustChangePassword ? " • reset required" : ""}</td>
                  <td className="px-4 py-3 text-slate-600">{user.lastLoginAt || "—"}</td>
                  <td className="px-4 py-3"><div className="flex flex-wrap gap-2"><button type="button" onClick={() => void resetPassword(user.id)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700">Reset Password</button><button type="button" onClick={() => void toggleActive(user.id, user.isActive)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700">{user.isActive ? "Deactivate" : "Activate"}</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
