"use client";

import { Users, Medal, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { RecentOrderActivity } from "@/types/analytics";

interface Props {
  orders: RecentOrderActivity[];
}

export function WidgetTopCustomers({ orders }: Props) {
  const customerMap = new Map<string, { name: string; orders: number; total: number }>();
  for (const o of orders) {
    const cur = customerMap.get(o.customerName) ?? { name: o.customerName, orders: 0, total: 0 };
    cur.orders += 1;
    cur.total += o.amountBDT;
    customerMap.set(o.customerName, cur);
  }

  const top = Array.from(customerMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const initials = (name: string) =>
    name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  const MEDAL_COLORS = ["text-amber-500", "text-slate-400", "text-amber-700", "text-muted-foreground", "text-muted-foreground"];

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Users className="h-4 w-4 text-indigo-500" />
          Top Customers
        </h3>
      </div>
      <div className="divide-y divide-border/50">
        {top.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-5 py-8 text-center">
            <Users className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No customer data yet</p>
          </div>
        ) : (
          top.map((c, i) => (
            <div key={c.name} className="flex items-center gap-3 px-5 py-2.5 hover:bg-muted/30 transition">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-[10px] font-semibold text-white">
                {initials(c.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                  {i < 3 && <Medal className={`h-3 w-3 ${MEDAL_COLORS[i]}`} />}
                </div>
                <p className="text-xs text-muted-foreground">{c.orders} orders · ৳{c.total.toLocaleString("en-BD")}</p>
              </div>
            </div>
          ))
        )}
      </div>
      <Link
        href="/customers"
        className="block border-t border-border px-5 py-2 text-center text-xs font-medium text-blue-600 hover:bg-muted/30 transition dark:text-blue-400"
      >
        View all customers →
      </Link>
    </div>
  );
}
