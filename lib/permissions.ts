import type { OrgRole } from "@/types/organization";

export type PermissionModule = "dashboard" | "orders" | "products" | "customers" | "analytics" | "staff" | "billing" | "settings";

export type PermissionAction = "view" | "create" | "edit" | "delete";

/**
 * Role-based permission matrix.
 * Each role maps to a set of modules they can access.
 */
const ROLE_MODULE_ACCESS: Record<OrgRole, PermissionModule[]> = {
  owner: ["dashboard", "orders", "products", "customers", "analytics", "staff", "billing", "settings"],
  admin: ["dashboard", "orders", "products", "customers", "analytics", "staff", "billing", "settings"],
  manager: ["dashboard", "orders", "products", "customers", "analytics"],
  staff: ["dashboard"],
  viewer: ["dashboard"],
};

const MODULE_ACTION_LIMITS: Partial<Record<PermissionModule, PermissionAction[]>> = {
  dashboard: ["view"],
  analytics: ["view"],
};

/**
 * Returns whether a given role can access a specific module.
 */
export function canAccessModule(role: OrgRole | string, mod: PermissionModule): boolean {
  const allowed = ROLE_MODULE_ACCESS[role as OrgRole] ?? [];
  return allowed.includes(mod);
}

/**
 * Returns whether a given role can perform a specific action on a module.
 */
export function canPerformAction(role: OrgRole | string, mod: PermissionModule, action: PermissionAction): boolean {
  if (!canAccessModule(role, mod)) return false;

  const limits = MODULE_ACTION_LIMITS[mod];
  if (!limits) return true; // full CRUD allowed

  return limits.includes(action);
}

/**
 * Returns all modules a given role can access.
 */
export function getAccessibleModules(role: OrgRole | string): PermissionModule[] {
  return ROLE_MODULE_ACCESS[role as OrgRole] ?? ["dashboard"];
}

/**
 * Returns whether the given role is a manager-level or above (can manage orders/customers).
 */
export function isManagerOrAbove(role: OrgRole | string): boolean {
  return ["owner", "admin", "manager"].includes(role);
}

/**
 * Returns whether the given role is admin-level or above.
 */
export function isAdminOrAbove(role: OrgRole | string): boolean {
  return ["owner", "admin"].includes(role);
}
