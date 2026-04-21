export const USER_ROLES = ["SUPER_ADMIN", "EXECUTIVE", "SHOP_MANAGER", "SERVICE_WRITER", "FDR"] as const;
export type AppUserRole = (typeof USER_ROLES)[number];

export type SessionUser = {
  userId: string;
  name: string;
  email: string;
  role: AppUserRole;
  shopId: string | null;
  currentShopId: string | null;
  mustChangePassword: boolean;
};

const roleRank: Record<AppUserRole, number> = {
  SUPER_ADMIN: 5,
  EXECUTIVE: 4,
  SHOP_MANAGER: 3,
  SERVICE_WRITER: 2,
  FDR: 1,
};

export function roleAtLeast(role: AppUserRole, minimum: AppUserRole) {
  return roleRank[role] >= roleRank[minimum];
}

export function canViewDashboard(role: AppUserRole) {
  return roleAtLeast(role, "FDR");
}
export function canImportWip(role: AppUserRole) {
  return roleAtLeast(role, "SERVICE_WRITER");
}
export function canMoveJobs(role: AppUserRole) {
  return roleAtLeast(role, "SERVICE_WRITER");
}
export function canEditNotes(role: AppUserRole) {
  return roleAtLeast(role, "FDR");
}
export function canEditSettings(role: AppUserRole) {
  return roleAtLeast(role, "SHOP_MANAGER");
}
export function canViewAuditLog(role: AppUserRole) {
  return roleAtLeast(role, "SHOP_MANAGER");
}
export function canManageUsers(role: AppUserRole) {
  return roleAtLeast(role, "SHOP_MANAGER");
}
export function canAccessAllShops(role: AppUserRole) {
  return role === "SUPER_ADMIN" || role === "EXECUTIVE";
}
export function canManagePto(role: AppUserRole) {
  return roleAtLeast(role, "SHOP_MANAGER");
}
export function canCreateShops(role: AppUserRole) {
  return roleAtLeast(role, "EXECUTIVE");
}
export function allowedRoleOptions(actorRole: AppUserRole): AppUserRole[] {
  if (actorRole === "SUPER_ADMIN") return [...USER_ROLES];
  if (actorRole === "EXECUTIVE") return ["SHOP_MANAGER", "SERVICE_WRITER", "FDR"];
  if (actorRole === "SHOP_MANAGER") return ["SERVICE_WRITER", "FDR"];
  return [];
}
