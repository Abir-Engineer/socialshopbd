"use client";

import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";
import type { AnalyticsSnapshot } from "@/types/analytics";
import { QuickActions } from "./quick-actions";
import { WidgetRecentOrders } from "./widget-recent-orders";
import { WidgetTopProducts } from "./widget-top-products";
import { WidgetTopCustomers } from "./widget-top-customers";
import { WidgetLowStock } from "./widget-low-stock";
import { WidgetActivityTimeline } from "./widget-activity-timeline";
import { WidgetRevenueComparison } from "./widget-revenue-comparison";
import { WidgetMonthlyGrowth } from "./widget-monthly-growth";

type Props = {
  snapshot: AnalyticsSnapshot;
};

export function PremiumDashboard({ snapshot }: Props) {
  return (
    <div className="space-y-6">
      <AnalyticsDashboard snapshot={snapshot} />

      <div className="grid gap-6 lg:grid-cols-3">
        <QuickActions />

        <div className="lg:col-span-2">
          <WidgetActivityTimeline orders={snapshot.recentOrders} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <WidgetRevenueComparison monthly={snapshot.monthly} />
        <WidgetMonthlyGrowth monthly={snapshot.monthly} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <WidgetTopProducts data={snapshot.topProducts} />
        <WidgetTopCustomers orders={snapshot.recentOrders} />
        <WidgetLowStock data={snapshot.lowStock} />
      </div>

      <div className="grid gap-6 lg:grid-cols-1">
        <WidgetRecentOrders data={snapshot.recentOrders} />
      </div>
    </div>
  );
}
