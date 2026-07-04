"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { createOrder, updateOrder, deleteOrder, updateOrderStatus, duplicateOrder, bulkDeleteOrders, bulkUpdateOrderStatus, exportOrdersCsv } from "@/app/(dashboard)/orders/actions";
import type { OrderListItem, OrderFormItem, OrderTimelineRow, OrderCommentRow, OrderItemRow, OrderRow } from "@/types/orders";
import { ORDER_STATUSES } from "@/types/orders";
import { computeOrderStats, getOrderStatusBadgeClass, getPaymentStatusBadgeClass, formatPaymentStatus, formatOrderStatusLabel } from "@/lib/orders/display";
import { formatPriceBdt } from "@/lib/products/display";
import { formatOrderDate, formatOrderDateTime } from "@/lib/orders/map-row";
import { OrderItemsEditor } from "@/components/orders/order-items-editor";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { OrderComments } from "@/components/orders/order-comments";
import { Search, SlidersHorizontal, X, Download, ChevronLeft, ChevronRight, Package, Eye, Copy, Printer, ShoppingCart, Phone, Truck, CreditCard } from "lucide-react";

type OrdersViewProps = {
  initialOrders: OrderListItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  role: string;
};

export function OrdersView({ initialOrders, totalCount, totalPages, currentPage, role }: OrdersViewProps) {
  const router = useRouter();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [formError, setFormError] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [query, setQuery] = useState(sp.get("query") ?? "");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [exportLoading, setExportLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<{
    order: OrderRow; items: OrderItemRow[]; timeline: OrderTimelineRow[]; comments: OrderCommentRow[];
  } | null>(null);
  const [bulkStatusOpen, setBulkStatusOpen] = useState(false);

  const isViewer = role === "viewer";
  const orders = initialOrders;
  const stats = computeOrderStats(orders);

  const statusFilter = sp.get("status") ?? "";
  const paymentStatusFilter = sp.get("paymentStatus") ?? "";

  const buildUrl = useCallback(
    (params: Record<string, string | undefined>) => {
      const p = new URLSearchParams(sp.toString());
      for (const [k, v] of Object.entries(params)) {
        if (v) p.set(k, v);
        else p.delete(k);
      }
      return `/orders?${p.toString()}`;
    },
    [sp],
  );

  const handleSearch = () => router.push(buildUrl({ query: query || undefined, page: "1" }));
  const applyFilter = (key: string, value: string) => router.push(buildUrl({ [key]: value || undefined, page: "1" }));
  const handlePageChange = (page: number) => router.push(buildUrl({ page: String(page) }));

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === orders.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(orders.map((o) => o.id)));
  };

  const handleCreate = (formData: FormData) => {
    setFormError(null);
    startTransition(async () => {
      const result = await createOrder(formData);
      if (!result.ok) { setFormError(result.error); return; }
      setAddOpen(false);
      setFormError(null);
      router.refresh();
    });
  };

  const handleUpdate = (formData: FormData) => {
    setFormError(null);
    startTransition(async () => {
      const result = await updateOrder(formData);
      if (!result.ok) { setFormError(result.error); return; }
      setEditOpen(false);
      setFormError(null);
      router.refresh();
    });
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Delete this order?")) return;
    startTransition(async () => {
      const result = await deleteOrder(id);
      if (!result.ok) { setFormError(result.error); return; }
      router.refresh();
    });
  };

  const handleDuplicate = (id: string) => {
    startTransition(async () => {
      const result = await duplicateOrder(id);
      if (!result.ok) { setFormError(result.error); return; }
      router.refresh();
    });
  };

  const handleBulkDelete = () => {
    startTransition(async () => {
      const result = await bulkDeleteOrders(Array.from(selectedIds));
      if (!result.ok) { setFormError(result.error); return; }
      setSelectedIds(new Set());
      router.refresh();
    });
  };

  const handleBulkStatusChange = (status: string) => {
    startTransition(async () => {
      const result = await bulkUpdateOrderStatus(Array.from(selectedIds), status);
      if (!result.ok) { setFormError(result.error); return; }
      setSelectedIds(new Set());
      setBulkStatusOpen(false);
      router.refresh();
    });
  };

  const handleExport = async () => {
    setExportLoading(true);
    const result = await exportOrdersCsv();
    if (!result.ok) { setFormError(result.error); setExportLoading(false); return; }
    const blob = new Blob([result.csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportLoading(false);
  };

  const openDetail = async (id: string) => {
    setDetailOrderId(id);
    setDetailOpen(true);
    const { getSupabaseBrowserClient } = await import("@/lib/supabase/client");
    const client = getSupabaseBrowserClient();
    const [oRes, iRes, tRes, cRes] = await Promise.all([
      client.from("orders").select("*").eq("id", id).single(),
      client.from("order_items").select("*").eq("order_id", id),
      client.from("order_timeline").select("*").eq("order_id", id).order("created_at", { ascending: false }),
      client.from("order_comments").select("*").eq("order_id", id).order("created_at", { ascending: false }),
    ]);
    if (oRes.data) {
      setDetailData({
        order: oRes.data,
        items: iRes.data ?? [],
        timeline: tRes.data ?? [],
        comments: cRes.data ?? [],
      });
    }
  };

  const sortValue = `${sp.get("sortBy") ?? "created_at"}-${sp.get("sortOrder") ?? "desc"}`;
  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split("-");
    router.push(buildUrl({ sortBy, sortOrder, page: "1" }));
  };

  return (
    <section className={`space-y-6 ${isPending ? "pointer-events-none opacity-60" : ""}`} aria-busy={isPending}>
      <header className="animate-fade-in flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Orders</h1>
          <p className="text-sm text-muted-foreground">Manage orders, shipping, and payments.</p>
          {isPending && <p className="mt-1 text-xs text-muted-foreground">Saving…</p>}
        </div>
        {!isViewer && (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={handleExport} disabled={exportLoading} className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-50">
              <Download className="h-4 w-4" /> Export CSV
            </button>
            <button type="button" onClick={() => { setFormError(null); setAddOpen(true); }} className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700">
              <Package className="h-4 w-4" /> New Order
            </button>
          </div>
        )}
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Orders" value={totalCount.toLocaleString("en-BD")} />
        <StatCard label="Pending" value={stats.pendingCount.toLocaleString("en-BD")} accent="amber" />
        <StatCard label="Delivered" value={stats.deliveredCount.toLocaleString("en-BD")} accent="emerald" />
        <StatCard label="Revenue" value={formatPriceBdt(stats.totalRevenue)} accent="blue" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }} placeholder="Search order #, customer, phone..." className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground outline-none transition focus:border-blue-500" />
          </div>
          <button type="button" onClick={() => setFilterOpen(true)} className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition ${statusFilter || paymentStatusFilter ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300" : "border-border bg-background text-foreground hover:bg-muted"}`}>
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </button>
          <select value={sortValue} onChange={(e) => handleSortChange(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500">
            <option value="created_at-desc">Newest First</option>
            <option value="created_at-asc">Oldest First</option>
            <option value="order_number-asc">Order # A–Z</option>
            <option value="order_number-desc">Order # Z–A</option>
            <option value="amount_bdt-desc">Highest Amount</option>
            <option value="amount_bdt-asc">Lowest Amount</option>
          </select>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm dark:border-blue-900 dark:bg-blue-950/50">
          <span className="font-medium text-blue-800 dark:text-blue-200">{selectedIds.size} selected</span>
          <button type="button" onClick={toggleSelectAll} className="text-blue-700 underline hover:no-underline dark:text-blue-300">Deselect all</button>
          <button type="button" onClick={() => setBulkStatusOpen(true)} className="ml-auto rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700">Change Status</button>
          <button type="button" onClick={handleBulkDelete} className="rounded bg-rose-600 px-3 py-1 text-xs font-medium text-white hover:bg-rose-700">Delete Orders</button>
        </div>
      )}

      {orders.length === 0 ? (
        <EmptyState query={sp.get("query") ?? ""} statusFilter={statusFilter} isViewer={isViewer} onAdd={() => { setFormError(null); setAddOpen(true); }} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="text-muted-foreground">
              <tr className="border-b border-border">
                {!isViewer && <th className="px-3 py-3 w-10"><input type="checkbox" checked={selectedIds.size === orders.length && orders.length > 0} onChange={toggleSelectAll} className="h-4 w-4 rounded border-gray-300 text-blue-600" /></th>}
                <th className="px-3 py-3 font-medium">Order</th>
                <th className="px-3 py-3 font-medium">Customer</th>
                <th className="px-3 py-3 font-medium hidden sm:table-cell">Items</th>
                <th className="px-3 py-3 font-medium text-right">Total</th>
                <th className="px-3 py-3 font-medium hidden md:table-cell">Payment</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium hidden lg:table-cell">Courier</th>
                <th className="px-3 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className={`border-b border-border/70 last:border-b-0 hover:bg-muted/50 transition-colors ${selectedIds.has(o.id) ? "bg-blue-50/50 dark:bg-blue-950/20" : ""}`}>
                  {!isViewer && (
                    <td className="px-3 py-3">
                      <input type="checkbox" checked={selectedIds.has(o.id)} onChange={() => toggleSelect(o.id)} className="h-4 w-4 rounded border-gray-300 text-blue-600" />
                    </td>
                  )}
                  <td className="px-3 py-3">
                    <span className="font-medium text-card-foreground">#{o.orderNumber}</span>
                    <p className="text-xs text-muted-foreground">{o.date}</p>
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-medium text-card-foreground">{o.customerName}</p>
                    {o.orderPhone && <p className="text-xs text-muted-foreground">{o.orderPhone}</p>}
                  </td>
                  <td className="px-3 py-3 hidden sm:table-cell text-muted-foreground">{o.itemCount}</td>
                  <td className="px-3 py-3 text-right font-medium text-card-foreground">{o.amountLabel}</td>
                  <td className="px-3 py-3 hidden md:table-cell">
                    <span className={getPaymentStatusBadgeClass(o.paymentStatus)}>{formatPaymentStatus(o.paymentStatus)}</span>
                  </td>
                  <td className="px-3 py-3">
                    <span className={getOrderStatusBadgeClass(o.status)}>{formatOrderStatusLabel(o.status)}</span>
                  </td>
                  <td className="px-3 py-3 hidden lg:table-cell text-xs text-muted-foreground">
                    {o.courierName ? `${o.courierName}${o.trackingCode ? ` (${o.trackingCode})` : ""}` : "—"}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button type="button" onClick={() => openDetail(o.id)} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" title="View"><Eye className="h-4 w-4" /></button>
                      <button type="button" onClick={() => router.push(`/orders/${o.id}/invoice`)} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" title="Invoice"><Printer className="h-4 w-4" /></button>
                      {!isViewer && (
                        <>
                          <button type="button" onClick={() => handleDuplicate(o.id)} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" title="Duplicate"><Copy className="h-4 w-4" /></button>
                          <button type="button" onClick={() => handleDelete(o.id)} className="rounded p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950" title="Delete"><X className="h-4 w-4" /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
      )}

      {formError && <p className="rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-200">{formError}</p>}

      <FilterDrawer open={filterOpen} onClose={() => setFilterOpen(false)} statusFilter={statusFilter} paymentStatusFilter={paymentStatusFilter} onStatusChange={(v) => applyFilter("status", v)} onPaymentStatusChange={(v) => applyFilter("paymentStatus", v)} onClear={() => router.push("/orders")} />

      {addOpen && (
        <OrderFormModal title="New Order" onClose={() => setAddOpen(false)} onSubmit={handleCreate} error={formError} disabled={isPending} />
      )}

      {bulkStatusOpen && (
        <BulkStatusModal onConfirm={handleBulkStatusChange} onCancel={() => setBulkStatusOpen(false)} disabled={isPending} />
      )}

      {detailOpen && detailData && (
        <DetailModal data={detailData} role={role} onClose={() => { setDetailOpen(false); setDetailOrderId(null); setDetailData(null); }} onStatusChange={(id, status) => {
          startTransition(async () => {
            await updateOrderStatus(id, status);
            router.refresh();
            const { getSupabaseBrowserClient } = await import("@/lib/supabase/client");
            const client = getSupabaseBrowserClient();
            const [oRes, iRes, tRes, cRes] = await Promise.all([
              client.from("orders").select("*").eq("id", id).single(),
              client.from("order_items").select("*").eq("order_id", id),
              client.from("order_timeline").select("*").eq("order_id", id).order("created_at", { ascending: false }),
              client.from("order_comments").select("*").eq("order_id", id).order("created_at", { ascending: false }),
            ]);
            if (oRes.data) setDetailData({ order: oRes.data, items: iRes.data ?? [], timeline: tRes.data ?? [], comments: cRes.data ?? [] });
          });
        }} />
      )}
    </section>
  );
}

const ORDERS_STAT_TOOLTIPS: Record<string, string> = {
  "Total Orders": "All orders placed in store",
  "Pending": "Orders awaiting confirmation",
  "Delivered": "Orders delivered successfully",
  "Revenue": "Total income from orders",
};

function StatCard({ label, value, accent }: { label: string; value: string; accent?: "amber" | "emerald" | "blue" }) {
  const valClass = accent === "amber" ? "text-amber-600 dark:text-amber-400" : accent === "emerald" ? "text-emerald-600 dark:text-emerald-400" : accent === "blue" ? "text-blue-600 dark:text-blue-400" : "text-card-foreground";
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground" title={ORDERS_STAT_TOOLTIPS[label] ?? label}>{label}</p>
      <h2 className={`mt-2 text-3xl font-bold tracking-tight ${valClass}`}>{value}</h2>
    </div>
  );
}

function Pagination({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (page: number) => void }) {
  const pages: (number | "...")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") pages.push("...");
  }
  return (
    <nav className="flex items-center justify-center gap-1" aria-label="Pagination">
      <button type="button" disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)} className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft className="h-4 w-4" /> Prev</button>
      {pages.map((p, i) =>
        p === "..." ? <span key={`e${i}`} className="px-2 text-muted-foreground">…</span> : (
          <button key={p} type="button" onClick={() => onPageChange(p)} className={`min-w-[2.25rem] rounded-lg px-3 py-2 text-sm font-medium transition ${p === currentPage ? "bg-blue-600 text-white" : "border border-border text-foreground hover:bg-muted"}`}>{p}</button>
        ),
      )}
      <button type="button" disabled={currentPage >= totalPages} onClick={() => onPageChange(currentPage + 1)} className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40">Next <ChevronRight className="h-4 w-4" /></button>
    </nav>
  );
}

function EmptyState({ query, statusFilter, isViewer, onAdd }: { query: string; statusFilter: string; isViewer: boolean; onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
      <Package className="mb-3 h-10 w-10 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{query || statusFilter ? "No orders match your search." : "No orders yet"}</p>
      {!isViewer && !query && !statusFilter && (
        <button type="button" onClick={onAdd} className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Start by creating your first order.</button>
      )}
    </div>
  );
}

function FilterDrawer({ open, onClose, statusFilter, paymentStatusFilter, onStatusChange, onPaymentStatusChange, onClear }: {
  open: boolean; onClose: () => void; statusFilter: string; paymentStatusFilter: string;
  onStatusChange: (v: string) => void; onPaymentStatusChange: (v: string) => void; onClear: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-80 max-w-full border-l border-border bg-card p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-card-foreground">Filters</h2>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-5">
          <div>
            <label className="text-sm font-medium text-card-foreground">Order Status</label>
            <select value={statusFilter} onChange={(e) => onStatusChange(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500">
              <option value="">All Statuses</option>
              {ORDER_STATUSES.map((s) => <option key={s} value={s}>{formatOrderStatusLabel(s)}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-card-foreground">Payment Status</label>
            <select value={paymentStatusFilter} onChange={(e) => onPaymentStatusChange(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500">
              <option value="">All</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="partial">Partial</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
          <button type="button" onClick={onClear} className="w-full rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted">Clear all filters</button>
        </div>
      </div>
    </div>
  );
}

export function OrderFormModal({ title, initial, onClose, onSubmit, error, disabled, inline }: {
  title: string; initial?: any; onClose: () => void; onSubmit: (fd: FormData) => void; error: string | null; disabled: boolean; inline?: boolean;
}) {
  const [items, setItems] = useState<OrderFormItem[]>(initial?.items ?? []);
  const [status, setStatus] = useState(initial?.status ?? "pending");
  const [paymentStatus, setPaymentStatus] = useState(initial?.paymentStatus ?? "unpaid");

  const subtotal = items.reduce((s, item) => s + Math.max(0, item.quantity * item.unit_price_bdt - item.discount_bdt), 0);
  const [deliveryCharge, setDeliveryCharge] = useState(initial?.delivery_charge_bdt ?? 0);
  const [discount, setDiscount] = useState(initial?.discount_bdt ?? 0);
  const [advance, setAdvance] = useState(initial?.advance_bdt ?? 0);
  const total = Math.max(0, subtotal + deliveryCharge - discount);

  const formContent = (
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-card-foreground">{title}</h2>
        <form className="mt-4 space-y-4" onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          fd.set("items", JSON.stringify(items.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price_bdt: item.unit_price_bdt,
            discount_bdt: item.discount_bdt,
            line_total_bdt: Math.max(0, item.quantity * item.unit_price_bdt - item.discount_bdt),
            product_name: item.product_name,
            product_sku: item.product_sku,
          }))));
          fd.set("status", status);
          fd.set("payment_status", paymentStatus);
          onSubmit(fd);
        }}>
          {initial && <input type="hidden" name="id" value={initial.id} />}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-card-foreground">Order # *</span>
              <input name="order_number" required defaultValue={initial?.orderNumber ?? ""} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-card-foreground">Customer Name *</span>
              <input name="customer_name" required defaultValue={initial?.customerName ?? ""} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-card-foreground">Phone</span>
              <input name="order_phone" defaultValue={initial?.orderPhone ?? ""} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-card-foreground">Status</span>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500">
                {ORDER_STATUSES.map((s) => <option key={s} value={s}>{formatOrderStatusLabel(s)}</option>)}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-card-foreground">Payment Status</span>
              <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500">
                <option value="unpaid">Unpaid (COD)</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="refunded">Refunded</option>
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-card-foreground">Customer ID (optional)</span>
              <input name="customer_id" defaultValue={initial?.customerId ?? ""} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500" />
            </label>
          </div>

          <OrderItemsEditor items={items} onChange={setItems} disabled={disabled} />

          <div className="grid gap-4 sm:grid-cols-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-card-foreground">Delivery Charge</span>
              <input type="number" min={0} value={deliveryCharge} onChange={(e) => setDeliveryCharge(Number(e.target.value))} name="delivery_charge_bdt" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-card-foreground">Discount</span>
              <input type="number" min={0} value={discount} onChange={(e) => setDiscount(Number(e.target.value))} name="discount_bdt" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-card-foreground">Advance Payment</span>
              <input type="number" min={0} value={advance} onChange={(e) => setAdvance(Number(e.target.value))} name="advance_bdt" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-card-foreground">Coupon Code</span>
              <input name="coupon_code" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500" />
            </label>
          </div>

          <div className="flex justify-end border-t border-border pt-3">
            <p className="text-base font-bold text-card-foreground">Total: {formatPriceBdt(total)}</p>
          </div>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-card-foreground">Notes</span>
            <textarea name="notes" rows={2} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500" />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-card-foreground">Shipping Address</span>
            <textarea name="order_address" rows={2} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500" />
          </label>

          {error && <p className="rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-700">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">Cancel</button>
            <button type="submit" disabled={disabled} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">{initial ? "Update Order" : "Create Order"}</button>
          </div>
        </form>
      </div>
    );

  if (inline) return formContent;
  return <Overlay onClose={onClose}>{formContent}</Overlay>;
}

function BulkStatusModal({ onConfirm, onCancel, disabled }: { onConfirm: (status: string) => void; onCancel: () => void; disabled: boolean }) {
  const [status, setStatus] = useState("confirmed");
  return (
    <Overlay onClose={onCancel}>
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-card-foreground">Change Status</h2>
        <div className="mt-4 space-y-4">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500">
            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{formatOrderStatusLabel(s)}</option>)}
          </select>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onCancel} className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">Cancel</button>
            <button type="button" disabled={disabled} onClick={() => onConfirm(status)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">Update Status</button>
          </div>
        </div>
      </div>
    </Overlay>
  );
}

function DetailModal({ data, role, onClose, onStatusChange }: {
  data: { order: OrderRow; items: OrderItemRow[]; timeline: OrderTimelineRow[]; comments: OrderCommentRow[] };
  role: string; onClose: () => void; onStatusChange: (id: string, status: string) => void;
}) {
  const { order, items, timeline, comments } = data;
  const subtotal = items.reduce((s, i) => s + i.line_total_bdt, 0);
  const totalDiscount = (order.discount_bdt ?? 0) + (order.coupon_discount_bdt ?? 0);
  const totalDue = Math.max(0, order.amount_bdt - (order.advance_bdt ?? 0));

  const [selectedTab, setSelectedTab] = useState<"items" | "timeline" | "comments">("items");

  return (
    <Overlay onClose={onClose}>
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-lg">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-card-foreground">Order #{order.order_number}</h2>
              <span className={getOrderStatusBadgeClass(order.status as any)}>{formatOrderStatusLabel(order.status as any)}</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {order.customer_name} {order.order_phone ? `· ${order.order_phone}` : ""}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatOrderDateTime(order.created_at)} · Updated {formatOrderDateTime(order.updated_at)}
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => window.open(`/orders/${order.id}/invoice`, "_blank")} className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"><Printer className="h-3.5 w-3.5" /> Invoice</button>
            <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-4">
          <MiniStat label="Items" value={items.length.toString()} />
          <MiniStat label="Advance" value={formatPriceBdt(order.advance_bdt ?? 0)} />
          <MiniStat label="Due" value={formatPriceBdt(totalDue)} />
          <MiniStat label="Payment" value={formatPaymentStatus(order.payment_status as any)} />
        </div>

        {order.courier_name && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-2 text-sm dark:border-indigo-900 dark:bg-indigo-950/30">
            <Truck className="h-4 w-4 text-indigo-600" />
            <span className="text-indigo-800 dark:text-indigo-200">
              {order.courier_name} · {order.tracking_code ?? "No tracking"}
            </span>
          </div>
        )}

        <div className="flex gap-1 rounded-lg border border-border bg-muted/30 p-1 mb-4">
          {(["items", "timeline", "comments"] as const).map((tab) => (
            <button key={tab} type="button" onClick={() => setSelectedTab(tab)} className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition ${selectedTab === tab ? "bg-card text-card-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {tab === "items" ? `Items (${items.length})` : tab === "timeline" ? `Timeline (${timeline.length})` : `Comments (${comments.length})`}
            </button>
          ))}
        </div>

        {selectedTab === "items" && (
          <div>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="pb-2 font-medium">Item</th>
                  <th className="pb-2 font-medium">SKU</th>
                  <th className="pb-2 font-medium text-right">Qty</th>
                  <th className="pb-2 font-medium text-right">Price</th>
                  <th className="pb-2 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id} className="border-b border-border/50">
                    <td className="py-2 text-card-foreground">{i.product_name ?? "Product"}</td>
                    <td className="py-2 text-muted-foreground">{i.product_sku ?? "—"}</td>
                    <td className="py-2 text-right text-card-foreground">{i.quantity}</td>
                    <td className="py-2 text-right text-card-foreground">{formatPriceBdt(i.unit_price_bdt ?? 0)}</td>
                    <td className="py-2 text-right font-medium text-card-foreground">{formatPriceBdt(i.line_total_bdt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatPriceBdt(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>{formatPriceBdt(order.delivery_charge_bdt ?? 0)}</span></div>
              {totalDiscount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span className="text-rose-600">-{formatPriceBdt(totalDiscount)}</span></div>}
              <div className="flex justify-between border-t border-border pt-1 text-base font-bold"><span>Total</span><span>{formatPriceBdt(order.amount_bdt)}</span></div>
            </div>
          </div>
        )}

        {selectedTab === "timeline" && (
          <div className="max-h-80 overflow-y-auto">
            <OrderTimeline timeline={timeline} />
          </div>
        )}

        {selectedTab === "comments" && (
          <div className="max-h-80 overflow-y-auto">
            <OrderComments orderId={order.id} comments={comments} role={role} />
          </div>
        )}

        {role !== "viewer" && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
            <span className="text-xs font-medium text-muted-foreground">Quick Status:</span>
            {ORDER_STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onStatusChange(order.id, s)}
                disabled={s === order.status}
                className={`rounded px-2.5 py-1 text-xs font-medium transition ${s === order.status ? "bg-blue-600 text-white" : "border border-border text-foreground hover:bg-muted"}`}
              >
                {formatOrderStatusLabel(s)}
              </button>
            ))}
          </div>
        )}
      </div>
    </Overlay>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-card-foreground">{value}</p>
    </div>
  );
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      {children}
    </div>
  );
}
