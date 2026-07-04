"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Printer, Copy, Trash2 } from "lucide-react";
import type { OrderRow, OrderItemRow, OrderTimelineRow, OrderCommentRow } from "@/types/orders";
import { ORDER_STATUSES } from "@/types/orders";
import { formatOrderStatusLabel, getOrderStatusBadgeClass, getPaymentStatusBadgeClass, formatPaymentStatus } from "@/lib/orders/display";
import { formatPriceBdt } from "@/lib/products/display";
import { formatOrderDateTime } from "@/lib/orders/map-row";
import { deleteOrder, updateOrderStatus, duplicateOrder } from "@/app/(dashboard)/orders/actions";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { OrderComments } from "@/components/orders/order-comments";

type OrderDetailPageProps = {
  order: OrderRow;
  items: OrderItemRow[];
  timeline: OrderTimelineRow[];
  comments: OrderCommentRow[];
  role: string;
};

export function OrderDetailPage({ order, items, timeline, comments, role }: OrderDetailPageProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState<"items" | "timeline" | "comments">("items");

  const isViewer = role === "viewer";
  const subtotal = items.reduce((s, i) => s + i.line_total_bdt, 0);
  const totalDiscount = (order.discount_bdt ?? 0) + (order.coupon_discount_bdt ?? 0);
  const totalDue = Math.max(0, order.amount_bdt - (order.advance_bdt ?? 0));

  const handleStatusChange = (status: string) => {
    startTransition(async () => {
      await updateOrderStatus(order.id, status);
      router.refresh();
    });
  };

  const handleDuplicate = () => {
    startTransition(async () => {
      const result = await duplicateOrder(order.id);
      if (result.ok) router.push(`/orders/${result.id}`);
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (!window.confirm("Delete this order?")) return;
    startTransition(async () => {
      await deleteOrder(order.id);
      router.push("/orders");
    });
  };

  return (
    <section className={`space-y-6 ${isPending ? "pointer-events-none opacity-60" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={() => router.push("/orders")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Orders
        </button>
        <div className="flex gap-2">
          <button type="button" onClick={() => window.open(`/orders/${order.id}/invoice`, "_blank")} className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted">
            <Printer className="h-3.5 w-3.5" /> Invoice
          </button>
          {!isViewer && (
            <>
              <button type="button" onClick={handleDuplicate} className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted">
                <Copy className="h-3.5 w-3.5" /> Duplicate
              </button>
              <button type="button" onClick={handleDelete} className="flex items-center gap-1 rounded-lg border border-rose-300 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400">
                <Trash2 className="h-3.5 w-3.5" /> Delete Order
              </button>
            </>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-card-foreground">Order #{order.order_number}</h1>
              <span className={getOrderStatusBadgeClass(order.status as any)}>{formatOrderStatusLabel(order.status as any)}</span>
            </div>
            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
              <p><strong>Customer:</strong> {order.customer_name}</p>
              {order.order_phone && <p><strong>Phone:</strong> {order.order_phone}</p>}
              {order.order_address && <p><strong>Address:</strong> {order.order_address}</p>}
              {order.courier_name && <p><strong>Courier:</strong> {order.courier_name} {order.tracking_code ? `(${order.tracking_code})` : ""}</p>}
            </div>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <p>Created: {formatOrderDateTime(order.created_at)}</p>
            <p>Updated: {formatOrderDateTime(order.updated_at)}</p>
          </div>
        </div>

        {order.notes && (
          <div className="mt-4 rounded-lg border border-border bg-muted/20 p-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
            <p className="text-sm text-card-foreground">{order.notes}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatBox label="Items" value={String(items.length)} />
        <StatBox label="Advance" value={formatPriceBdt(order.advance_bdt ?? 0)} />
        <StatBox label="Due" value={formatPriceBdt(totalDue)} />
        <StatBox label="Payment" value={formatPaymentStatus(order.payment_status as any)} />
      </div>

      <div className="flex gap-1 rounded-lg border border-border bg-muted/30 p-1">
        {(["items", "timeline", "comments"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${tab === t ? "bg-card text-card-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {t === "items" ? `Items (${items.length})` : t === "timeline" ? `Timeline (${timeline.length})` : `Comments (${comments.length})`}
          </button>
        ))}
      </div>

      {tab === "items" && (
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="px-5 py-3 font-medium">Item</th>
                  <th className="px-5 py-3 font-medium">SKU</th>
                  <th className="px-5 py-3 font-medium text-right">Qty</th>
                  <th className="px-5 py-3 font-medium text-right">Price</th>
                  <th className="px-5 py-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id} className="border-b border-border/70 last:border-b-0 hover:bg-muted/50">
                    <td className="px-5 py-3 text-card-foreground">{i.product_name ?? "Product"}</td>
                    <td className="px-5 py-3 text-muted-foreground">{i.product_sku ?? "—"}</td>
                    <td className="px-5 py-3 text-right text-card-foreground">{i.quantity}</td>
                    <td className="px-5 py-3 text-right text-card-foreground">{formatPriceBdt(i.unit_price_bdt ?? 0)}</td>
                    <td className="px-5 py-3 text-right font-medium text-card-foreground">{formatPriceBdt(i.line_total_bdt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-border px-5 py-4">
            <div className="ml-auto max-w-xs space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatPriceBdt(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>{formatPriceBdt(order.delivery_charge_bdt ?? 0)}</span></div>
              {totalDiscount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span className="text-rose-600">-{formatPriceBdt(totalDiscount)}</span></div>}
              <div className="flex justify-between border-t border-border pt-1 text-base font-bold"><span>Total</span><span>{formatPriceBdt(order.amount_bdt)}</span></div>
            </div>
          </div>
        </div>
      )}

      {tab === "timeline" && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <OrderTimeline timeline={timeline} />
        </div>
      )}

      {tab === "comments" && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <OrderComments orderId={order.id} comments={comments} role={role} />
        </div>
      )}

      {!isViewer && (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-card-foreground">Change Status</h3>
          <div className="flex flex-wrap gap-2">
            {ORDER_STATUSES.map((s) => (
              <button key={s} type="button" onClick={() => handleStatusChange(s)} disabled={s === order.status || isPending}
                className={`rounded px-3 py-1.5 text-xs font-medium transition ${s === order.status ? "bg-blue-600 text-white" : "border border-border text-foreground hover:bg-muted"} disabled:opacity-50`}>
                {formatOrderStatusLabel(s)}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-base font-semibold text-card-foreground">{value}</p>
    </div>
  );
}
