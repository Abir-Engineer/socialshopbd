import type { OrderListItem, OrderFilters } from "@/types/orders";

export type OrderFilterResult = {
  orders: OrderListItem[];
  total: number;
  totalPages: number;
  currentPage: number;
};

export function applyOrderFilters(
  orders: OrderListItem[],
  filters: OrderFilters,
  page: number,
  perPage: number,
): OrderFilterResult {
  let filtered = [...orders];

  if (filters.query.trim()) {
    const q = filters.query.toLowerCase().trim();
    filtered = filtered.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        (o.orderPhone && o.orderPhone.toLowerCase().includes(q)),
    );
  }

  if (filters.status) {
    filtered = filtered.filter((o) => o.status === filters.status);
  }

  if (filters.paymentStatus) {
    filtered = filtered.filter((o) => o.paymentStatus === filters.paymentStatus);
  }

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * perPage;
  const paged = filtered.slice(start, start + perPage);

  return { orders: paged, total, totalPages, currentPage: safePage };
}
