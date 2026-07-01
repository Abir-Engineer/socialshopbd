import type { Database, Json } from "@/types/supabase";

export type CustomerRow = Database["public"]["Tables"]["customers"]["Row"];

export type CustomerAddress = {
  label: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  is_default: boolean;
};

export type CustomerPhone = {
  number: string;
  label: string;
  is_primary: boolean;
};

export type CustomerListItem = {
  id: string;
  fullName: string;
  businessName: string;
  phone: string;
  email: string | null;
  avatarUrl: string | null;
  tags: string[];
  notes: string;
  orderCount: number;
  totalSpentBdt: number;
  totalSpentLabel: string;
  createdAtLabel: string;
  updatedAtLabel: string;
  isRepeat: boolean;
};

export type CustomerStats = {
  totalCustomers: number;
  repeatBuyers: number;
  totalLtv: number;
  avgOrderValue: number;
};

export type CustomerFilters = {
  query: string;
  tag: string;
  isRepeat: "" | "yes" | "no";
  sortBy: string;
  sortOrder: "asc" | "desc";
};

export const CUSTOMER_SORT_OPTIONS = [
  { label: "Newest First", value: "created_at-desc" },
  { label: "Oldest First", value: "created_at-asc" },
  { label: "Name A–Z", value: "name-asc" },
  { label: "Name Z–A", value: "name-desc" },
  { label: "Most Orders", value: "orderCount-desc" },
  { label: "Highest Spent", value: "totalSpentBdt-desc" },
];

export const DEFAULT_CUSTOMER_FILTERS: CustomerFilters = {
  query: "",
  tag: "",
  isRepeat: "",
  sortBy: "created_at",
  sortOrder: "desc",
};

export function parseAddresses(json: Json): CustomerAddress[] {
  if (!Array.isArray(json)) return [];
  return json as CustomerAddress[];
}

export function parsePhones(json: Json): CustomerPhone[] {
  if (!Array.isArray(json)) return [];
  return json as CustomerPhone[];
}
