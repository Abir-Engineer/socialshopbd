"use client";

import { useRouter } from "next/navigation";
import { useCallback, useId, useRef, useState, useTransition } from "react";
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
import { getOrderStatusBadgeClass } from "@/utils/order-status";

type OrdersViewProps = {
  initialOrders: Order[];
};

type ToastItem = { id: number; message: string; variant: "success" | "error" };

export function OrdersView({ initialOrders }: OrdersViewProps) {
  const router = useRouter();
  const searchFieldId = useId();
  const statusFilterId = useId();
  const { query, setQuery, selectedStatus, setSelectedStatus, filteredOrders } =
    useOrderFilters(initialOrders);
  const [isModalPending, startModalTransition] = useTransition();
  const [isListPending, startListTransition] = useTransition();
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Order | null>(null);
  const [detailsOrder, setDetailsOrder] = useState<Order | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingRowId, setPendingRowId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastSeq = useRef(0);

  const showToast = useCallback((message: string, variant: ToastItem["variant"]) => {
    const id = ++toastSeq.current;
    setToasts((prev) => [...prev, { id, message, variant }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const closeModals = () => {
    setAddOpen(false);
    setEditOpen(false);
    setEditing(null);
    setFormError(null);
  };

  const handleCreate = (formData: FormData) => {
    setFormError(null);
    startModalTransition(async () => {
      const result = await createOrder(formData);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      closeModals();
      showToast("Order created successfully.", "success");
      router.refresh();
    });
  };

  const handleUpdate = (formData: FormData) => {
    setFormError(null);
    startModalTransition(async () => {
      const result = await updateOrder(formData);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      closeModals();
      showToast("Order updated successfully.", "success");
      router.refresh();
    });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    startListTransition(async () => {
      const result = await deleteOrder(target.id);
      if (!result.ok) {
        showToast(result.error, "error");
        return;
      }
      if (editing?.id === target.id) {
        setEditOpen(false);
        setEditing(null);
        setFormError(null);
      }
      if (detailsOrder?.id === target.id) {
        setDetailsOrder(null);
      }
      showToast("Order deleted successfully.", "success");
      router.refresh();
    });
  };

  const handleStatusChange = (orderId: string, next: OrderStatus) => {
    startListTransition(async () => {
      setPendingRowId(orderId);
      const result = await updateOrderStatus(orderId, next);
      setPendingRowId(null);
      if (!result.ok) {
        showToast(result.error, "error");
        return;
      }
      showToast(`Status updated to ${formatOrderStatusLabel(next)}.`, "success");
      router.refresh();
    });
  };

  const openEditFromDetails = (order: Order) => {
    setDetailsOrder(null);
    setFormError(null);
    setEditing(order);
    setEditOpen(true);
  };

  const isBusy = isModalPending || isListPending;

  const emptyIsDatabase = initialOrders.length === 0;

  return (
    <section className="space-y-6" aria-busy={isBusy}>
      <ToastStack toasts={toasts} onDismiss={dismissToast} />

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Orders Management</h1>
          <p className="text-sm text-muted-foreground">Track and manage all customer orders.</p>
          {(isModalPending || isListPending) && (
            <p className="mt-1 text-xs text-muted-foreground" aria-live="polite">
              {isModalPending ? "Saving order…" : "Updating orders…"}
            </p>
          )}
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
          <p className="text-sm text-muted-foreground">
            Showing {filteredOrders.length} order{filteredOrders.length === 1 ? "" : "s"}
            {query.trim() !== "" || selectedStatus !== "All" ? " (filtered)" : ""}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex w-full flex-1 flex-col gap-1.5 sm:max-w-sm">
              <label htmlFor={searchFieldId} className="text-xs font-medium text-muted-foreground">
                Search orders
              </label>
              <div className="relative">
                <input
                  id={searchFieldId}
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Order number, customer, or id…"
                  className="w-full rounded-lg border border-border bg-background py-2 pl-3 pr-9 text-sm text-foreground outline-none transition focus:border-blue-500"
                  autoComplete="off"
                />
                {query.trim() !== "" && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
            <div className="flex w-full flex-col gap-1.5 sm:w-52">
              <label htmlFor={statusFilterId} className="text-xs font-medium text-muted-foreground">
                Filter by status
              </label>
              <select
                id={statusFilterId}
                value={selectedStatus}
                onChange={(event) =>
                  setSelectedStatus(event.target.value as (typeof ORDER_STATUS_FILTER_OPTIONS)[number])
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-500"
              >
                {ORDER_STATUS_FILTER_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status === "All" ? "All statuses" : formatOrderStatusLabel(status)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="relative overflow-x-auto">
          {isListPending && (
            <div
              className="pointer-events-none absolute inset-0 z-10 flex items-start justify-center bg-background/55 pt-14"
              aria-hidden
            >
              <span className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-sm">
                Loading…
              </span>
            </div>
          )}
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
                      disabled={isListPending && pendingRowId === order.id}
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
                        onClick={() => setDetailsOrder(order)}
                        className="text-xs font-medium text-slate-600 hover:underline dark:text-slate-300"
                      >
                        View
                      </button>
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
                        onClick={() => setDeleteTarget(order)}
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
                  <td colSpan={6} className="px-5 py-14 text-center">
                    {emptyIsDatabase ? (
                      <div className="mx-auto max-w-sm space-y-2">
                        <p className="text-base font-medium text-foreground">No orders yet</p>
                        <p className="text-sm text-muted-foreground">
                          When you add orders, they will show up here. Use{" "}
                          <span className="font-medium text-foreground">Add Order</span> above to create one.
                        </p>
                      </div>
                    ) : (
                      <div className="mx-auto max-w-sm space-y-2">
                        <p className="text-base font-medium text-foreground">No matching orders</p>
                        <p className="text-sm text-muted-foreground">
                          Try a different search term or set the status filter to{" "}
                          <span className="font-medium text-foreground">All statuses</span>.
                        </p>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {addOpen && (
        <OrderModal
          title="Add order"
          submitLabel="Create order"
          onClose={closeModals}
          onSubmit={handleCreate}
          error={formError}
          disabled={isModalPending}
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
          disabled={isModalPending}
        />
      )}

      {detailsOrder && (
        <OrderDetailsModal
          order={detailsOrder}
          onClose={() => setDetailsOrder(null)}
          onEdit={() => openEditFromDetails(detailsOrder)}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          order={deleteTarget}
          isDeleting={isListPending}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}
    </section>
  );
}

function ToastStack({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: number) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[60] flex max-w-sm flex-col gap-2 sm:max-w-md"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={
            t.variant === "success"
              ? "flex items-start justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900 shadow-md dark:border-emerald-900 dark:bg-emerald-950/90 dark:text-emerald-100"
              : "flex items-start justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-900 shadow-md dark:border-rose-900 dark:bg-rose-950/90 dark:text-rose-100"
          }
        >
          <span>{t.message}</span>
          <button
            type="button"
            onClick={() => onDismiss(t.id)}
            className="shrink-0 rounded p-0.5 opacity-70 hover:opacity-100"
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

type OrderDetailsModalProps = {
  order: Order;
  onClose: () => void;
  onEdit: () => void;
};

function OrderDetailsModal({ order, onClose, onEdit }: OrderDetailsModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-details-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <h2 id="order-details-title" className="text-lg font-semibold text-card-foreground">
            Order details
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{order.orderNumber}</p>

        <dl className="mt-6 space-y-4 text-sm">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Customer</dt>
            <dd className="mt-1 text-card-foreground">{order.customer}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Amount</dt>
            <dd className="mt-1 font-medium text-card-foreground">{order.amount}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</dt>
            <dd className="mt-2">
              <span className={`inline-flex ${getOrderStatusBadgeClass(order.status)}`}>
                {formatOrderStatusLabel(order.status)}
              </span>
            </dd>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Created</dt>
              <dd className="mt-1 text-card-foreground">{order.date}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Last updated</dt>
              <dd className="mt-1 text-card-foreground">{order.updatedAt}</dd>
            </div>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Internal id</dt>
            <dd className="mt-1 break-all font-mono text-xs text-muted-foreground">{order.id}</dd>
          </div>
        </dl>

        <div className="mt-8 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Edit order
          </button>
        </div>
      </div>
    </div>
  );
}

type ConfirmDeleteModalProps = {
  order: Order;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

function ConfirmDeleteModal({ order, isDeleting, onCancel, onConfirm }: ConfirmDeleteModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-delete-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isDeleting) onCancel();
      }}
    >
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg">
        <h2 id="order-delete-title" className="text-lg font-semibold text-card-foreground">
          Delete order?
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This will permanently remove{" "}
          <span className="font-medium text-foreground">{order.orderNumber}</span> for{" "}
          <span className="font-medium text-foreground">{order.customer}</span>. This cannot be undone.
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onCancel}
            className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isDeleting ? "Deleting…" : "Delete order"}
          </button>
        </div>
      </div>
    </div>
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
        if (e.target === e.currentTarget && !disabled) onClose();
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
              disabled={disabled}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-card-foreground">Customer name</span>
            <input
              name="customer_name"
              required
              defaultValue={initial?.customer}
              disabled={disabled}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
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
              disabled={disabled}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-card-foreground">Status</span>
            <select
              name="status"
              required
              defaultValue={initial?.status ?? "pending"}
              disabled={disabled}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
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
              disabled={disabled}
              onClick={onClose}
              className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={disabled}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {disabled ? "Please wait…" : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
