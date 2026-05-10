export const ORDER_STATUSES = [
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type OrderFilterStatus = "All" | OrderStatus;

export type Order = {
  id: string;
  customer: string;
  date: string;
  amount: string;
  status: OrderStatus;
};
