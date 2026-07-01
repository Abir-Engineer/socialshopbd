import type { Database } from "@/types/supabase";
import type { OrderListItem, OrderStatus, PaymentStatus } from "@/types/orders";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/types/orders";
import { formatPriceBdt } from "@/lib/products/display";


type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type OrderItemRow = Database["public"]["Tables"]["order_items"]["Row"];

function assertOrderStatus(value: string): OrderStatus {
  if ((ORDER_STATUSES as readonly string[]).includes(value)) return value as OrderStatus;
  return "pending";
}

function assertPaymentStatus(value: string): PaymentStatus {
  if ((PAYMENT_STATUSES as readonly string[]).includes(value)) return value as PaymentStatus;
  return "unpaid";
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

export function formatOrderDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function orderRowToListItem(
  row: OrderRow,
  items?: OrderItemRow[],
): OrderListItem {
  const itemCount = items?.length ?? 0;
  const subtotal = items ? items.reduce((s, i) => s + i.line_total_bdt, 0) : row.amount_bdt;
  const total = subtotal + (row.delivery_charge_bdt ?? 0) - (row.discount_bdt ?? 0) - (row.coupon_discount_bdt ?? 0);

  return {
    id: row.id,
    orderNumber: row.order_number,
    customerName: row.customer_name,
    customerId: row.customer_id ?? null,
    orderPhone: row.order_phone ?? null,
    date: formatOrderDate(row.created_at),
    updatedAt: formatOrderDate(row.updated_at),
    itemCount,
    subtotalBdt: subtotal,
    deliveryChargeBdt: row.delivery_charge_bdt ?? 0,
    discountBdt: (row.discount_bdt ?? 0) + (row.coupon_discount_bdt ?? 0),
    totalBdt: total,
    amountLabel: formatPriceBdt(total),
    status: assertOrderStatus(row.status),
    paymentStatus: assertPaymentStatus(row.payment_status ?? "unpaid"),
    courierName: row.courier_name,
    trackingCode: row.tracking_code,
  };
}
