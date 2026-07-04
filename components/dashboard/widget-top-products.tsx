"use client";

import { Package, TrendingUp, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { TopProductRow } from "@/types/analytics";

interface Props {
  data: TopProductRow[];
}

export function WidgetTopProducts({ data }: Props) {
  const maxRevenue = Math.max(...data.map((p) => p.revenue), 1);

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Package className="h-4 w-4 text-emerald-500" />
          Top Products
        </h3>
      </div>
      <div className="divide-y divide-border/50">
        {data.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-5 py-8 text-center">
            <Package className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No product data yet</p>
            <p className="text-xs text-muted-foreground/60">Sales will appear here once orders are placed.</p>
          </div>
        ) : (
          data.map((product, i) => {
            const pct = (product.revenue / maxRevenue) * 100;
            return (
              <div key={product.productId} className="px-5 py-2.5 hover:bg-muted/30 transition">
                <div className="flex items-center justify-between mb-1">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-muted-foreground w-5">#{i + 1}</span>
                      <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                    </div>
                    <p className="text-xs text-muted-foreground ml-7">{product.units} sold</p>
                  </div>
                  <span className="text-sm font-semibold text-foreground shrink-0">
                    ৳{product.revenue.toLocaleString("en-BD")}
                  </span>
                </div>
                <div className="ml-7 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
      <Link
        href="/products"
        className="block border-t border-border px-5 py-2 text-center text-xs font-medium text-blue-600 hover:bg-muted/30 transition dark:text-blue-400"
      >
        View all products →
      </Link>
    </div>
  );
}
