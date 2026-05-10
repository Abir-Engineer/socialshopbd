"use client";

import { useOrderFilters } from "@/hooks/use-order-filters";
import { ordersData, orderStatusFilters } from "@/modules/orders/data/orders";
import type { OrderFilterStatus } from "@/types/orders";
import { getOrderStatusBadgeClass } from "@/utils/order-status";

export default function OrdersPage() {
  const { query, setQuery, selectedStatus, setSelectedStatus, filteredOrders } =
    useOrderFilters(ordersData);

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Orders Management</h1>
          <p className="text-sm text-muted-foreground">Track and manage all customer orders.</p>
        </div>
        <button
          type="button"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          Add Order
        </button>
      </header>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="space-y-4 border-b border-border px-4 py-4 sm:px-5">
          <p className="text-sm text-muted-foreground">Showing {filteredOrders.length} orders</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by order ID or customer..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-500 sm:max-w-sm"
            />
            <select
              value={selectedStatus}
              onChange={(event) =>
                setSelectedStatus(event.target.value as OrderFilterStatus)
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-500 sm:w-52"
            >
              {orderStatusFilters.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-muted-foreground">
              <tr className="border-b border-border">
                <th className="px-5 py-3 font-medium">Order</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-b border-border/70 last:border-b-0">
                  <td className="px-5 py-4 font-medium text-card-foreground">{order.id}</td>
                  <td className="px-5 py-4 text-muted-foreground">{order.customer}</td>
                  <td className="px-5 py-4 text-muted-foreground">{order.date}</td>
                  <td className="px-5 py-4 text-card-foreground">{order.amount}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${getOrderStatusBadgeClass(order.status)}`}
                    >
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-muted-foreground">
                    No orders match your search/filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
