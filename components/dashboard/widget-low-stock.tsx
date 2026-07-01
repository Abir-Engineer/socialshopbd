"use client";

import { AlertTriangle, Package } from "lucide-react";
import Link from "next/link";
import type { LowStockRow } from "@/types/analytics";

interface Props {
  data: LowStockRow[];
}

export function WidgetLowStock({ data }: Props) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Low Stock
        </h3>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{data.length} items</span>
      </div>
      <div className="divide-y divide-border/50">
        {data.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-5 py-8 text-center">
            <Package className="h-8 w-8 text-emerald-500/60" />
            <p className="text-sm text-muted-foreground">All stocked up</p>
          </div>
        ) : (
          data.map((item) => (
            <div key={item.id} className="flex items-center justify-between px-5 py-2.5 hover:bg-muted/30 transition">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.sku}</p>
              </div>
              <span
                className={`ml-3 shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                  item.stock === 0
                    ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                }`}
              >
                {item.stock}
              </span>
            </div>
          ))
        )}
      </div>
      <Link
        href="/inventory"
        className="block border-t border-border px-5 py-2 text-center text-xs font-medium text-blue-600 hover:bg-muted/30 transition dark:text-blue-400"
      >
        View inventory →
      </Link>
    </div>
  );
}
