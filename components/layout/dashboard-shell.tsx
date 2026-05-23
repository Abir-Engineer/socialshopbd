"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { LogoutButton } from "@/components/auth/logout-button";
import { DASHBOARD_NAVIGATION } from "@/lib/constants/navigation";
import { Icon } from "@/components/ui/icon";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";

function NavLinks({ onNavigate, userRole }: { onNavigate?: () => void; userRole: string | null }) {
  const pathname = usePathname();

  return (
    <nav className="mt-8 space-y-1 px-3">
      {DASHBOARD_NAVIGATION.filter((item) => {
        if (userRole === "staff" || userRole === "viewer") {
          return item.href !== "/staff" && item.href !== "/settings";
        }
        return true;
      }).map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium transition ${
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
        <aside className="hidden h-screen w-64 border-r border-border bg-card md:sticky md:top-0 md:block">
          <div className="border-b border-border px-6 py-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Social Shop BD</p>
            <h1 className="mt-1 text-xl font-semibold text-card-foreground">SaaS Panel</h1>
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
            <h2 className="text-lg font-semibold text-card-foreground">Social Shop BD</h2>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="rounded-md border border-border px-2 py-1 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Close
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
                  <p className="text-sm font-medium text-foreground">
                    Welcome back, {userName ?? "Admin"}
                  </p>
                  <p className="text-xs text-muted-foreground">Manage orders, products, and growth</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <div className="hidden rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground sm:block">
                  {userEmail ?? "admin@socialshopbd.com"}
                </div>
                <LogoutButton />
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
