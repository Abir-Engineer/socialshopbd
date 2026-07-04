"use client";

import { ShoppingCart, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { RecentOrderActivity } from "@/types/analytics";

interface Props {
  data: RecentOrderActivity[];
}

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  processing: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  shipped: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  delivered: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  returned: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  cancelled: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

export function WidgetRecentOrders({ data }: Props) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-blue-500" />
          Recent Orders
        </h3>
        <span className="text-xs text-muted-foreground">Last 10 orders</span>
      </div>
      <div className="divide-y divide-border/50">
        {data.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-5 py-8 text-center">
            <ShoppingCart className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No orders yet</p>
            <p className="text-xs text-muted-foreground/60">Start by creating your first order.</p>
          </div>
        ) : (
          data.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="flex items-center justify-between px-5 py-2.5 hover:bg-muted/30 transition group/item"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground truncate">{order.customerName}</p>
                  <span className="text-xs text-muted-foreground shrink-0">#{order.orderNumber}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  ৳{order.amountBDT.toLocaleString("en-BD")}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    STATUS_BADGE[order.status] ?? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {order.status}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover/item:opacity-100 transition-all -translate-x-1 group-hover/item:translate-x-0" />
              </div>
            </Link>
          ))
        )}
      </div>
      <Link
        href="/orders"
        className="block border-t border-border px-5 py-2 text-center text-xs font-medium text-blue-600 hover:bg-muted/30 transition dark:text-blue-400"
      >
        View all orders →
      </Link>
    </div>
  );
}
