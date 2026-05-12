import type { Database } from "@/types/supabase";

export type CustomerRow = Database["public"]["Tables"]["customers"]["Row"];

/** Customer row + aggregated order stats (from linked orders only). */
export type CustomerListItem = {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  notes: string;
  orderCount: number;
  totalSpentBdt: number;
  totalSpentLabel: string;
  createdAtLabel: string;
  updatedAtLabel: string;
  /** True when two or more orders reference this customer (orders.customer_id). */
  isRepeat: boolean;
};
