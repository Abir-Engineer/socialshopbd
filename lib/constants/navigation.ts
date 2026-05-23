import type { NavigationItem } from "@/types/dashboard";

export const DASHBOARD_NAVIGATION: NavigationItem[] = [
  { name: "Dashboard", href: "/", icon: "M3 12l9-8 9 8M5 10v10h14V10" },
  { name: "Orders", href: "/orders", icon: "M3 7h18M6 3h12l1 4H5l1-4zm-1 4v13h14V7" },
  { name: "Products", href: "/products", icon: "M4 7l8-4 8 4-8 4-8-4zm0 0v10l8 4 8-4V7" },
  { name: "Customers", href: "/customers", icon: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" },
  { name: "Analytics", href: "/analytics", icon: "M4 19V5m6 14V9m6 10V3m4 16H2" },
  { name: "Staff", href: "/staff", icon: "M17 21v-2a4 4 0 0 0-3-3.87M9 14a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" },
  { name: "Billing", href: "/billing", icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3z" },
  { name: "Settings", href: "/settings", icon: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM3 12h2m14 0h2M12 3v2m0 14v2" },
];
