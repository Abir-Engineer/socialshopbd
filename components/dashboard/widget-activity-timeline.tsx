"use client";

import { Clock, ShoppingCart, Package, Users, DollarSign } from "lucide-react";
import type { RecentOrderActivity } from "@/types/analytics";

interface Props {
  orders: RecentOrderActivity[];
}

export function WidgetActivityTimeline({ orders }: Props) {
  const activities = orders.slice(0, 8).map((o) => ({
    id: o.id,
    type: "order" as const,
    message: `New order #${o.orderNumber} from ${o.customerName}`,
    amount: `৳${o.amountBDT.toLocaleString("en-BD")}`,
    time: o.createdAt,
  }));

  if (activities.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Clock className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No activity yet</p>
        </div>
      </div>
    );
  }

  const typeIcon = (type: string) => {
    switch (type) {
      case "order": return <ShoppingCart className="h-3.5 w-3.5 text-blue-500" />;
      default: return <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">Activity Timeline</h3>
      </div>
      <div className="relative">
        <div className="absolute left-8 top-0 bottom-0 w-px bg-border/60" />
        <div className="divide-y divide-border/50">
          {activities.map((act) => (
            <div key={act.id} className="relative flex items-start gap-4 px-5 py-3 hover:bg-muted/20 transition">
              <div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-card">
                {typeIcon(act.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{act.message}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{act.amount}</p>
              </div>
              <span className="shrink-0 text-[10px] text-muted-foreground/60">{timeAgo(act.time)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
