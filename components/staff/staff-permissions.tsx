"use client";

import { getAccessibleModules, type PermissionModule } from "@/lib/permissions";
import type { OrgRole } from "@/types/organization";
import { ROLE_BADGE } from "@/lib/staff/display";
import { Shield, Check, X } from "lucide-react";

const MODULE_LABELS: Record<PermissionModule, string> = {
  dashboard: "Dashboard",
  orders: "Orders",
  products: "Products",
  customers: "Customers",
  analytics: "Analytics",
  inventory: "Inventory",
  staff: "Staff",
  billing: "Billing",
  settings: "Settings",
};

const ALL_ROLES: OrgRole[] = ["owner", "admin", "manager", "staff", "viewer"];

export function StaffPermissions() {
  const canView = (role: OrgRole, mod: PermissionModule) => {
    const mods = getAccessibleModules(role);
    return mods.includes(mod);
  };

  const modules = Object.keys(MODULE_LABELS) as PermissionModule[];

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          Permission matrix
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Overview of module access per role. <span className="italic">Staff</span> and
          higher roles may have limited CRUD within each module.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-muted-foreground border-b border-border">
            <tr>
              <th className="px-4 py-3 font-medium sm:px-5">Module</th>
              {ALL_ROLES.map((role) => (
                <th key={role} className="px-3 py-3 font-medium text-center">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      ROLE_BADGE[role] ?? ROLE_BADGE.viewer
                    }`}
                  >
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {modules.map((mod) => (
              <tr key={mod} className="border-b border-border/70 last:border-b-0 hover:bg-muted/20 transition">
                <td className="px-4 py-3 sm:px-5 font-medium text-foreground">{MODULE_LABELS[mod]}</td>
                {ALL_ROLES.map((role) => {
                  const hasAccess = canView(role, mod);
                  return (
                    <td key={role} className="px-3 py-3 text-center">
                      {hasAccess ? (
                        <Check className="h-4 w-4 text-emerald-500 mx-auto" />
                      ) : (
                        <X className="h-4 w-4 text-rose-400 mx-auto" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
