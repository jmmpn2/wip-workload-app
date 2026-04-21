import { ShopManagementForm } from "@/components/ShopManagementForm";
import { UserManagementForm } from "@/components/UserManagementForm";
import { requireRoleAccess } from "@/lib/auth";
import { formatCentralDateTime } from "@/lib/datetime";
import { allowedRoleOptions, canAccessAllShops, canCreateShops } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export default async function UsersPage() {
  const session = await requireRoleAccess({ users: true });
  const canAll = canAccessAllShops(session.role);
  const shops = await prisma.shop.findMany({ where: canAll ? {} : { id: session.shopId || undefined }, orderBy: { name: "asc" }, select: { id: true, name: true, isActive: true } });
  const users = await prisma.user.findMany({ where: canAll ? {} : { shopId: session.shopId || undefined }, include: { shop: true }, orderBy: [{ role: "asc" }, { email: "asc" }] });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Users</h1>
        <p className="mt-1 text-slate-600">Create users, reset passwords, activate or deactivate accounts, and manage shops.</p>
      </div>
      {canCreateShops(session.role) ? <ShopManagementForm shops={shops} /> : null}
      <UserManagementForm
        users={users.map((user) => ({ id: user.id, name: user.name, email: user.email, role: user.role, isActive: user.isActive, mustChangePassword: user.mustChangePassword, shopName: user.shop?.name || null, lastLoginAt: formatCentralDateTime(user.lastLoginAt) }))}
        shops={shops.map((shop) => ({ id: shop.id, name: shop.name }))}
        allowedRoles={allowedRoleOptions(session.role)}
        canManageAllShops={canAll}
      />
    </div>
  );
}
