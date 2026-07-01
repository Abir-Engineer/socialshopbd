import type { OrgRole } from "./organization";

export type MemberStatus = "active" | "inactive" | "suspended";

export type AuditAction =
  | "member.invite"
  | "member.role_change"
  | "member.remove"
  | "member.suspend"
  | "member.activate"
  | "invitation.cancel"
  | "order.create"
  | "order.update"
  | "order.delete"
  | "order.status_change"
  | "product.create"
  | "product.update"
  | "product.delete"
  | "customer.create"
  | "customer.update"
  | "customer.delete"
  | "settings.update"
  | "subscription.change";

export type ActivityType = "login" | "logout" | "viewed" | "created" | "updated" | "deleted" | "exported" | "imported" | "generated";

export interface StaffMember {
  id: string;
  user_id: string;
  role: OrgRole;
  status: MemberStatus;
  last_login: string | null;
  created_at: string;
  email: string;
  full_name: string;
}

export interface StaffInvitation {
  id: string;
  email: string;
  role: OrgRole;
  created_at: string;
  status: string;
  expires_at: string;
}

export interface AuditLogEntry {
  id: string;
  organization_id: string;
  actor_id: string;
  action: AuditAction;
  target_type: string;
  target_id: string;
  details: Record<string, unknown> | null;
  created_at: string;
  actor_email?: string;
  actor_name?: string;
}

export interface ActivityLogEntry {
  id: string;
  organization_id: string;
  user_id: string;
  activity_type: ActivityType;
  description: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  user_email?: string;
  user_name?: string;
}

export interface StaffStats {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  byRole: Record<string, number>;
}

export interface StaffFilters {
  search: string;
  role: string;
  status: string;
}

export const STAFF_SORT_OPTIONS = [
  { value: "created_at", label: "Join date" },
  { value: "full_name",  label: "Name" },
  { value: "role",       label: "Role" },
  { value: "last_login", label: "Last active" },
] as const;

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  "member.invite":       "Member invited",
  "member.role_change":  "Role changed",
  "member.remove":       "Member removed",
  "member.suspend":      "Member suspended",
  "member.activate":     "Member activated",
  "invitation.cancel":   "Invitation cancelled",
  "order.create":        "Order created",
  "order.update":        "Order updated",
  "order.delete":        "Order deleted",
  "order.status_change": "Order status changed",
  "product.create":      "Product created",
  "product.update":      "Product updated",
  "product.delete":      "Product deleted",
  "customer.create":     "Customer created",
  "customer.update":     "Customer updated",
  "customer.delete":     "Customer deleted",
  "settings.update":     "Settings updated",
  "subscription.change": "Subscription changed",
};
