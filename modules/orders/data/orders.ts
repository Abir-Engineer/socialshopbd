import type { Order, OrderFilterStatus } from "@/types/orders";

export const ordersData: Order[] = [
  {
    id: "ORD-9031",
    customer: "Farhana Islam",
    date: "09 May 2026",
    amount: "BDT 2,280",
    status: "Shipped",
  },
  {
    id: "ORD-9032",
    customer: "Mahmudul Karim",
    date: "09 May 2026",
    amount: "BDT 1,790",
    status: "Pending",
  },
  {
    id: "ORD-9033",
    customer: "Jannat Ara",
    date: "08 May 2026",
    amount: "BDT 940",
    status: "Delivered",
  },
  {
    id: "ORD-9034",
    customer: "Sabbir Ahmed",
    date: "08 May 2026",
    amount: "BDT 4,100",
    status: "Cancelled",
  },
  {
    id: "ORD-9035",
    customer: "Tahsin Chowdhury",
    date: "07 May 2026",
    amount: "BDT 1,360",
    status: "Processing",
  },
];

export const orderStatusFilters: OrderFilterStatus[] = [
  "All",
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];
