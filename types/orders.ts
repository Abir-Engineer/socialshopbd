import type { Database, Json } from "@/types/supabase";

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
  "returned",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = ["unpaid", "paid", "partial", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
export type OrderItemRow = Database["public"]["Tables"]["order_items"]["Row"];
export type OrderTimelineRow = Database["public"]["Tables"]["order_timeline"]["Row"];
export type OrderCommentRow = Database["public"]["Tables"]["order_comments"]["Row"];

export type OrderFormItem = {
  product_id: string;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price_bdt: number;
  discount_bdt: number;
};

export type OrderListItem = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerId: string | null;
  orderPhone: string | null;
  date: string;
  updatedAt: string;
  itemCount: number;
  subtotalBdt: number;
  deliveryChargeBdt: number;
  discountBdt: number;
  totalBdt: number;
  amountLabel: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  courierName: string | null;
  trackingCode: string | null;
};

export type OrderDetailData = {
  order: OrderRow;
  items: OrderItemRow[];
  timeline: OrderTimelineRow[];
  comments: OrderCommentRow[];
};

export type OrderFilters = {
  query: string;
  status: string;
  paymentStatus: string;
};

export type OrderStats = {
  totalOrders: number;
  pendingCount: number;
  deliveredCount: number;
  returnedCount: number;
  totalRevenue: number;
  todayRevenue: number;
};

export const DEFAULT_ORDER_FILTERS: OrderFilters = {
  query: "",
  status: "",
  paymentStatus: "",
};

export const ORDER_SORT_OPTIONS = [
  { label: "Newest First", value: "created_at-desc" },
  { label: "Oldest First", value: "created_at-asc" },
  { label: "Order # A–Z", value: "order_number-asc" },
  { label: "Order # Z–A", value: "order_number-desc" },
  { label: "Highest Amount", value: "amount_bdt-desc" },
  { label: "Lowest Amount", value: "amount_bdt-asc" },
];

export type OrderBulkAction = "status" | "delete";

export function calculateLineTotal(
  qty: number,
  unitPrice: number,
  discount: number,
): number {
  return Math.max(0, qty * unitPrice - discount);
}

export function calculateOrderTotal(
  items: { line_total_bdt: number }[],
  deliveryCharge: number,
  discount: number,
  couponDiscount: number,
): number {
  const subtotal = items.reduce((s, i) => s + i.line_total_bdt, 0);
  return Math.max(0, subtotal + deliveryCharge - discount - couponDiscount);
}
