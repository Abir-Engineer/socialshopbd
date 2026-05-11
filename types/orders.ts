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
  date: string;
  amount: string;
  amountBdt: number;
  status: OrderStatus;
};
