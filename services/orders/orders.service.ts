import type { Order, OrderFilterStatus } from "@/types/orders";

export function filterOrders(orders: Order[], query: string, selectedStatus: OrderFilterStatus): Order[] {
  const normalizedQuery = query.trim().toLowerCase();

  return orders.filter((order) => {
    const matchesSearch =
      normalizedQuery.length === 0 ||
      order.orderNumber.toLowerCase().includes(normalizedQuery) ||
      order.customer.toLowerCase().includes(normalizedQuery) ||
      order.id.toLowerCase().includes(normalizedQuery);
    const matchesStatus = selectedStatus === "All" || order.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });
}
