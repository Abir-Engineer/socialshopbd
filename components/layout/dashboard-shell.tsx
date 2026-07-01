"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { DASHBOARD_NAVIGATION } from "@/lib/constants/navigation";
import { canAccessModule } from "@/lib/permissions";
import type { PermissionModule } from "@/lib/permissions";
import { Icon } from "@/components/ui/icon";
import { ProfileDropdown } from "@/components/dashboard/profile-dropdown";
import { GlobalSearch } from "@/components/dashboard/global-search";
import { NotificationCenter } from "@/components/dashboard/notification-center";

const NAV_MODULE_MAP: Record<string, PermissionModule> = {
  "/dashboard": "dashboard",
  "/orders": "orders",
  "/products": "products",
  "/customers": "customers",
  "/analytics": "analytics",
  "/staff": "staff",
  "/billing": "billing",
  "/inventory": "inventory",
  "/settings": "settings",
};

function NavLinks({ onNavigate, userRole }: { onNavigate?: () => void; userRole: string | null }) {
  const pathname = usePathname();

  return (
    <nav className="mt-8 space-y-1 px-3">
      {DASHBOARD_NAVIGATION.filter((item) => {
        const mod = NAV_MODULE_MAP[item.href];
        if (!mod) return true;
        return canAccessModule(userRole ?? "viewer", mod);
      }).map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 hover:translate-x-0.5 ${
              isActive
                ? "bg-blue-600 text-white"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <span className="mr-3">
              <Icon path={item.icon} />
            </span>
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    supabase.auth.getUser().then(async ({ data, error }) => {
      if (!error && data.user) {
        setUserEmail(data.user.email || null);
        setUserName(data.user.user_metadata?.full_name || null);

        // Fetch current workspace role
        const { data: membership } = await supabase
          .from("organization_members")
          .select("role")
          .eq("user_id", data.user.id)
          .limit(1)
          .maybeSingle();

        if (membership) {
          setUserRole(membership.role);
        }
      }
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <aside className="animate-fade-in hidden h-screen w-64 border-r border-border bg-card md:sticky md:top-0 md:block">
          <div className="border-b border-border px-6 py-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">সোশ্যাল শপ বিডি</p>
            <h1 className="mt-1 text-xl font-semibold text-card-foreground">সাস প্যানেল</h1>
          </div>
          <NavLinks userRole={userRole} />
        </aside>

        {sidebarOpen && (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar backdrop"
          />
        )}

        <aside
          className={`fixed left-0 top-0 z-50 h-full w-64 border-r border-border bg-card transition-transform md:hidden ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-border px-6 py-5">
            <h2 className="text-lg font-semibold text-card-foreground">সোশ্যাল শপ বিডি</h2>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="rounded-md border border-border px-2 py-1 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              বন্ধ
            </button>
          </div>
          <NavLinks onNavigate={() => setSidebarOpen(false)} userRole={userRole} />
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
            <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background text-foreground md:hidden"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Open sidebar"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-5 w-5"
                    aria-hidden
                  >
                    <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <div>
                  <p className="animate-slide-up text-sm font-medium text-foreground">
                    স্বাগতম, {userName ?? "অ্যাডমিন"}
                  </p>
                  <p className="text-xs text-muted-foreground">অর্ডার, পণ্য ও গ্রোথ ম্যানেজ করুন</p>
                </div>
                <span className="ml-2 mt-0.5 h-2 w-2 rounded-full bg-emerald-500 animate-pulse-dot shrink-0" title="লাইভ" />
              </div>
              <div className="hidden sm:block flex-1 max-w-md mx-4">
                <GlobalSearch />
              </div>
              <div className="flex items-center gap-2">
                <NotificationCenter />
                <ProfileDropdown />
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
