"use client";

import { formatOrderDateTime } from "@/lib/orders/map-row";
import { getOrderStatusBadgeClass, formatOrderStatusLabel } from "@/lib/orders/display";
import { Clock } from "lucide-react";
import type { OrderTimelineRow } from "@/types/orders";

type OrderTimelineProps = {
  timeline: OrderTimelineRow[];
};

export function OrderTimeline({ timeline }: OrderTimelineProps) {
  if (timeline.length === 0) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <Clock className="mb-2 h-6 w-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No timeline entries yet.</p>
      </div>
    );
  }

  const sorted = [...timeline].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return (
    <div className="space-y-0">
      {sorted.map((entry, i) => {
        const isLast = i === sorted.length - 1;
        return (
          <div key={entry.id} className="relative flex gap-4 pb-6">
            {/* Vertical line */}
            {!isLast && (
              <div className="absolute left-[11px] top-5 h-full w-0.5 bg-border" />
            )}

            {/* Dot */}
            <div className="relative z-10 mt-1.5 h-[22px] w-[22px] flex-shrink-0 rounded-full border-2 border-blue-500 bg-card flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={getOrderStatusBadgeClass(entry.status as any)}>
                  {formatOrderStatusLabel(entry.status as any)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatOrderDateTime(entry.created_at)}
                </span>
              </div>
              {entry.note && (
                <p className="mt-1 text-sm text-muted-foreground">{entry.note}</p>
              )}
              {entry.created_by && (
                <p className="mt-0.5 text-xs text-muted-foreground/70">
                  by {entry.created_by}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
