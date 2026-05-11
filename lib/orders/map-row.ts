import type { Database } from "@/types/supabase";
import type { Order, OrderStatus } from "@/types/orders";
import { ORDER_STATUSES } from "@/types/orders";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];

function assertOrderStatus(value: string): OrderStatus {
  if ((ORDER_STATUSES as readonly string[]).includes(value)) {
    return value as OrderStatus;
  }
  return "pending";
}

export function formatOrderDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatOrderStatusLabel(status: OrderStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function orderRowToListItem(row: OrderRow): Order {
  return {
    id: row.id,
    orderNumber: row.order_number,
    customer: row.customer_name,
    date: formatOrderDate(row.created_at),
    updatedAt: formatOrderDate(row.updated_at),
    amount: `BDT ${row.amount_bdt.toLocaleString("en-BD")}`,
    amountBdt: row.amount_bdt,
    status: assertOrderStatus(row.status),
  };
}
