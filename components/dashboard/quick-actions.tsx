"use client";

import { useRouter } from "next/navigation";
import { Plus, ShoppingCart, BarChart3, UserPlus, FileText, RefreshCw } from "lucide-react";

const ACTIONS = [
  { label: "New Order", href: "/orders?create=true", icon: ShoppingCart, color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20" },
  { label: "Add Product", href: "/products?create=true", icon: Plus, color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20" },
  { label: "View Reports", href: "/reports", icon: BarChart3, color: "bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-500/20" },
  { label: "Invite Staff", href: "/staff", icon: UserPlus, color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20" },
];

export function QuickActions() {
  const router = useRouter();

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
        Quick Actions
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              type="button"
              onClick={() => router.push(action.href)}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-medium transition duration-200 hover:scale-[1.02] active:scale-[0.98] ${action.color}`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {action.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
