"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createOrder,
  deleteOrder,
  updateOrder,
  updateOrderStatus,
} from "@/app/(dashboard)/orders/actions";
import { useOrderFilters } from "@/hooks/use-order-filters";
import { formatOrderStatusLabel } from "@/lib/orders/map-row";
import type { Order, OrderStatus } from "@/types/orders";
import { ORDER_STATUSES, ORDER_STATUS_FILTER_OPTIONS } from "@/types/orders";

type OrdersViewProps = {
  initialOrders: Order[];
};

export function OrdersView({ initialOrders }: OrdersViewProps) {
  const router = useRouter();
  const { query, setQuery, selectedStatus, setSelectedStatus, filteredOrders } =
    useOrderFilters(initialOrders);
  const [isPending, startTransition] = useTransition();
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Order | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingRowId, setPendingRowId] = useState<string | null>(null);

  const closeModals = () => {
    setAddOpen(false);
    setEditOpen(false);
    setEditing(null);
    setFormError(null);
  };

  const handleCreate = (formData: FormData) => {
    setFormError(null);
    startTransition(async () => {
      const result = await createOrder(formData);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      closeModals();
      router.refresh();
    });
  };

  const handleUpdate = (formData: FormData) => {
    setFormError(null);
    startTransition(async () => {
      const result = await updateOrder(formData);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      closeModals();
      router.refresh();
    });
  };

  const handleDelete = (order: Order) => {
    if (!window.confirm(`Delete order “${order.orderNumber}”? This cannot be undone.`)) {
      return;
    }
    setActionError(null);
    startTransition(async () => {
      const result = await deleteOrder(order.id);
      if (!result.ok) {
        setActionError(result.error);
        return;
      }
      if (editing?.id === order.id) {
        setEditOpen(false);
        setEditing(null);
        setFormError(null);
      }
      router.refresh();
    });
  };

  const handleStatusChange = (orderId: string, next: OrderStatus) => {
    setActionError(null);
    setPendingRowId(orderId);
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, next);
      setPendingRowId(null);
      if (!result.ok) {
        setActionError(result.error);
        return;
      }
      router.refresh();
    });
  };

  const emptyMessage =
    initialOrders.length === 0
      ? "No orders yet. Use Add Order to create your first order."
      : "No orders match your search or filter.";

  return (
    <section className={`space-y-6 ${isPending ? "pointer-events-none opacity-60" : ""}`} aria-busy={isPending}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Orders Management</h1>
          <p className="text-sm text-muted-foreground">Track and manage all customer orders.</p>
          {isPending && <p className="mt-1 text-xs text-muted-foreground">Saving…</p>}
        </div>
        <button
          type="button"
          onClick={() => {
            setFormError(null);
            setAddOpen(true);
          }}
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
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by order number, customer, or id…"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-500 sm:max-w-sm"
              autoComplete="off"
            />
            <select
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value as (typeof ORDER_STATUS_FILTER_OPTIONS)[number])}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-500 sm:w-52"
            >
              {ORDER_STATUS_FILTER_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status === "All" ? "All statuses" : formatOrderStatusLabel(status)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full text-left text-sm">
            <thead className="text-muted-foreground">
              <tr className="border-b border-border">
                <th className="whitespace-nowrap px-3 py-3 font-medium sm:px-5">Order</th>
                <th className="min-w-[8rem] px-3 py-3 font-medium sm:px-5">Customer</th>
                <th className="whitespace-nowrap px-3 py-3 font-medium sm:px-5">Date</th>
                <th className="whitespace-nowrap px-3 py-3 font-medium sm:px-5">Amount</th>
                <th className="min-w-[9.5rem] px-3 py-3 font-medium sm:px-5">Status</th>
                <th className="whitespace-nowrap px-3 py-3 font-medium sm:px-5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-b border-border/70 last:border-b-0">
                  <td className="whitespace-nowrap px-3 py-4 font-medium text-card-foreground sm:px-5">
                    {order.orderNumber}
                  </td>
                  <td className="max-w-[10rem] truncate px-3 py-4 text-muted-foreground sm:max-w-none sm:px-5 sm:whitespace-normal">
                    {order.customer}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-muted-foreground sm:px-5">{order.date}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-card-foreground sm:px-5">{order.amount}</td>
                  <td className="px-3 py-4 sm:px-5">
                    <select
                      value={order.status}
                      disabled={pendingRowId === order.id && isPending}
                      onChange={(event) => {
                        const next = event.target.value as OrderStatus;
                        if (next === order.status) return;
                        handleStatusChange(order.id, next);
                      }}
                      className="w-full min-w-[7.5rem] max-w-[12rem] rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground outline-none transition focus:border-blue-500 sm:max-w-[13rem] sm:text-sm"
                      aria-label={`Status for ${order.orderNumber}`}
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {formatOrderStatusLabel(s)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 sm:px-5">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setFormError(null);
                          setEditing(order);
                          setEditOpen(true);
                        }}
                        className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(order)}
                        className="text-xs font-medium text-rose-600 hover:underline dark:text-rose-400"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-muted-foreground">
                    {emptyMessage}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {actionError && !addOpen && !editOpen && (
        <p className="rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-200">
          {actionError}
        </p>
      )}

      {addOpen && (
        <OrderModal
          title="Add order"
          submitLabel="Create order"
          onClose={closeModals}
          onSubmit={handleCreate}
          error={formError}
          disabled={isPending}
        />
      )}

      {editOpen && editing && (
        <OrderModal
          key={editing.id}
          title="Edit order"
          submitLabel="Save changes"
          initial={editing}
          onClose={closeModals}
          onSubmit={handleUpdate}
          error={formError}
          disabled={isPending}
        />
      )}
    </section>
  );
}

type OrderModalProps = {
  title: string;
  submitLabel: string;
  initial?: Order;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
  error: string | null;
  disabled: boolean;
};

function OrderModal({ title, submitLabel, initial, onClose, onSubmit, error, disabled }: OrderModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-modal-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-lg">
        <h2 id="order-modal-title" className="text-lg font-semibold text-card-foreground">
          {title}
        </h2>
        <form
          className="mt-4 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(new FormData(e.currentTarget));
          }}
        >
          {initial && <input type="hidden" name="id" value={initial.id} />}
          <label className="block space-y-2">
            <span className="text-sm font-medium text-card-foreground">Order number</span>
            <input
              name="order_number"
              required
              defaultValue={initial?.orderNumber}
              placeholder="ORD-1001"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-500"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-card-foreground">Customer name</span>
            <input
              name="customer_name"
              required
              defaultValue={initial?.customer}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-500"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-card-foreground">Amount (BDT)</span>
            <input
              name="amount_bdt"
              type="number"
              min={0}
              step={1}
              required
              defaultValue={initial?.amountBdt ?? 0}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-500"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-card-foreground">Status</span>
            <select
              name="status"
              required
              defaultValue={initial?.status ?? "pending"}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-500"
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {formatOrderStatusLabel(s)}
                </option>
              ))}
            </select>
          </label>
          {error && <p className="rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-700">{error}</p>}
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={disabled}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
