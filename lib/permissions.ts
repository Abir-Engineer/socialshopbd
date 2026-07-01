import type { OrgRole } from "@/types/organization";

export type PermissionModule = "dashboard" | "orders" | "products" | "customers" | "analytics" | "staff" | "inventory" | "billing" | "settings";

/**
 * Role-based permission matrix.
 * Each role maps to a set of modules they can access.
 */
const ROLE_MODULE_ACCESS: Record<OrgRole, PermissionModule[]> = {
  owner: ["dashboard", "orders", "products", "customers", "analytics", "staff", "inventory", "billing", "settings"],
  admin: ["dashboard", "orders", "products", "customers", "analytics", "staff", "inventory", "billing", "settings"],
  manager: ["dashboard", "orders", "products", "customers", "analytics", "inventory"],
  staff: ["dashboard"],
  viewer: ["dashboard"],
};

/**
 * Returns whether a given role can access a specific module.
 */
export function canAccessModule(role: OrgRole | string, mod: PermissionModule): boolean {
  const allowed = ROLE_MODULE_ACCESS[role as OrgRole] ?? [];
  return allowed.includes(mod);
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
