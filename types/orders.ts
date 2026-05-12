export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
  "returned",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type OrderFilterStatus = "All" | OrderStatus;

export const ORDER_STATUS_FILTER_OPTIONS: OrderFilterStatus[] = [
  "All",
  ...ORDER_STATUSES,
];

/** Row-shaped data for the orders table UI (mapped from Supabase). */
export type Order = {
  id: string;
  orderNumber: string;
  customer: string;
  /** Linked CRM customer (optional). */
  customerId: string | null;
  /** Created date (formatted). */
  date: string;
  /** Last updated (formatted). */
  updatedAt: string;
  amount: string;
  amountBdt: number;
  status: OrderStatus;
};
