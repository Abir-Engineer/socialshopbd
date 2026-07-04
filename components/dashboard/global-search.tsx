"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { Search, Command, ArrowRight, Package, ShoppingCart, Users, BarChart3, Settings, Shield } from "lucide-react";

interface SearchItem {
  label: string;
  href: string;
  icon: typeof Package;
  keywords: string[];
}

const ITEMS: SearchItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: BarChart3, keywords: ["home", "overview", "analytics"] },
  { label: "Orders", href: "/orders", icon: ShoppingCart, keywords: ["sales", "transactions", "selling"] },
  { label: "Products", href: "/products", icon: Package, keywords: ["items", "inventory", "goods"] },
  { label: "Customers", href: "/customers", icon: Users, keywords: ["clients", "people", "leads"] },
  { label: "Reports", href: "/analytics", icon: BarChart3, keywords: ["analytics", "stats", "metrics"] },
  { label: "Staff", href: "/staff", icon: Shield, keywords: ["team", "members", "employees"] },
  { label: "Settings", href: "/settings", icon: Settings, keywords: ["preferences", "config", "profile"] },
];

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const filtered = query.trim()
    ? ITEMS.filter((item) => {
        const q = query.toLowerCase();
        return item.label.toLowerCase().includes(q) || item.keywords.some((k) => k.includes(q));
      })
    : ITEMS;

  const navigate = useCallback((href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  }, [router]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) setSelectedIdx(0);
  }, [open, query]);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIdx((i) => Math.min(i + 1, filtered.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIdx((i) => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && filtered[selectedIdx]) { navigate(filtered[selectedIdx].href); }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-muted-foreground hover:border-muted-foreground/30 transition w-full max-w-[280px]"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">Search orders, products or customers...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          <Command className="h-3 w-3" />K
        </kbd>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Search pages"
          className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/50"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
          onKeyDown={(e) => {
            if (e.key === "Tab") {
              const modal = modalRef.current;
              if (!modal) return;
              const focusable = modal.querySelectorAll<HTMLElement>(
                'input, button, [tabindex]:not([tabindex="-1"])'
              );
              const first = focusable[0];
              const last = focusable[focusable.length - 1];
              if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last?.focus();
              } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first?.focus();
              }
            }
          }}
        >
          <div ref={modalRef} className="w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <Search className="h-5 w-5 text-muted-foreground" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Search pages..."
                className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                autoComplete="off"
              />
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">ESC</kbd>
            </div>
            <div className="max-h-72 overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <p className="p-4 text-center text-sm text-muted-foreground">No results found. Try a different search term.</p>
              ) : (
                filtered.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.href}
                      type="button"
                      onMouseDown={() => navigate(item.href)}
                      onMouseEnter={() => setSelectedIdx(i)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                        i === selectedIdx ? "bg-blue-600 text-white" : "text-foreground hover:bg-muted"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1 font-medium">{item.label}</span>
                      <ArrowRight className={`h-3.5 w-3.5 ${i === selectedIdx ? "text-white" : "text-muted-foreground"}`} />
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
