"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { createCustomer, deleteCustomer, updateCustomer, bulkDeleteCustomers, exportCustomersCsv } from "@/app/(dashboard)/customers/actions";
import type { CustomerListItem, CustomerFilters } from "@/types/customers";
import { customerStats as computeStats, tagBadgeClass, formatLtv } from "@/lib/customers/display";
import { CustomerForm } from "@/components/customers/customer-form";
import { Users, Search, SlidersHorizontal, X, Upload, Download, ChevronLeft, ChevronRight, Star, Package, Phone, Mail } from "lucide-react";

type CustomersViewProps = {
  initialCustomers: CustomerListItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  allTags: string[];
  role: string;
};

export function CustomersView({ initialCustomers, totalCount, totalPages, currentPage, allTags, role }: CustomersViewProps) {
  const router = useRouter();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [addOpen, setAddOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [query, setQuery] = useState(sp.get("query") ?? "");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [exportLoading, setExportLoading] = useState(false);

  const isViewer = role === "viewer";
  const customers = initialCustomers;
  const stats = computeStats(customers);

  const buildUrl = useCallback(
    (params: Record<string, string | undefined>) => {
      const p = new URLSearchParams(sp.toString());
      for (const [k, v] of Object.entries(params)) {
        if (v) p.set(k, v);
        else p.delete(k);
      }
      return `/customers?${p.toString()}`;
    },
    [sp],
  );

  const handleSearch = () => {
    router.push(buildUrl({ query: query || undefined, page: "1" }));
  };

  const applyFilter = (key: string, value: string) => {
    router.push(buildUrl({ [key]: value || undefined, page: "1" }));
  };

  const handlePageChange = (page: number) => {
    router.push(buildUrl({ page: String(page) }));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === customers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(customers.map((c) => c.id)));
    }
  };

  const handleCreate = (formData: FormData) => {
    setFormError(null);
    startTransition(async () => {
      const result = await createCustomer(formData);
      if (!result.ok) { setFormError(result.error); return; }
      setAddOpen(false);
      setFormError(null);
      router.refresh();
    });
  };

  const handleBulkDelete = () => {
    startTransition(async () => {
      const result = await bulkDeleteCustomers(Array.from(selectedIds));
      if (!result.ok) { setFormError(result.error); return; }
      setSelectedIds(new Set());
      router.refresh();
    });
  };

  const handleExport = async () => {
    setExportLoading(true);
    const result = await exportCustomersCsv();
    if (!result.ok) { setFormError(result.error); setExportLoading(false); return; }
    const blob = new Blob([result.csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `customers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportLoading(false);
  };

  const sortValue = `${sp.get("sortBy") ?? "created_at"}-${sp.get("sortOrder") ?? "desc"}`;
  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split("-");
    router.push(buildUrl({ sortBy, sortOrder, page: "1" }));
  };

  const tagFilterValue = sp.get("tag") ?? "";
  const repeatFilterValue = sp.get("isRepeat") ?? "";

  return (
    <section className={`space-y-6 ${isPending ? "pointer-events-none opacity-60" : ""}`} aria-busy={isPending}>
      <header className="animate-fade-in flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Customers</h1>
          <p className="text-sm text-muted-foreground">Manage your customer relationships.</p>
          {isPending && <p className="mt-1 text-xs text-muted-foreground">Saving…</p>}
        </div>
        {!isViewer && (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={handleExport} disabled={exportLoading} className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-50">
              <Download className="h-4 w-4" /> Export CSV
            </button>
            <button type="button" onClick={() => router.push("/customers/new")} className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700">
              <Users className="h-4 w-4" /> Add Customer
            </button>
          </div>
        )}
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Customers" value={totalCount.toLocaleString("en-BD")} />
        <StatCard label="Repeat Buyers" value={stats.repeatBuyers.toLocaleString("en-BD")} accent="amber" />
        <StatCard label="Total LTV" value={`৳${stats.totalLtv.toLocaleString("en-BD")}`} />
        <StatCard label="Avg Order Value" value={`৳${stats.avgOrderValue.toLocaleString("en-BD")}`} accent="blue" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
              placeholder="Search name, phone, email, tags..."
              className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground outline-none transition focus:border-blue-500"
            />
          </div>
          <button type="button" onClick={() => setFilterOpen(true)} className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition ${tagFilterValue || repeatFilterValue ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300" : "border-border bg-background text-foreground hover:bg-muted"}`}>
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </button>
          <select value={sortValue} onChange={(e) => handleSortChange(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500">
            <option value="created_at-desc">Newest First</option>
            <option value="created_at-asc">Oldest First</option>
            <option value="name-asc">Name A–Z</option>
            <option value="name-desc">Name Z–A</option>
            <option value="orderCount-desc">Most Orders</option>
            <option value="totalSpentBdt-desc">Highest Spent</option>
          </select>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm dark:border-blue-900 dark:bg-blue-950/50">
          <span className="font-medium text-blue-800 dark:text-blue-200">{selectedIds.size} selected</span>
          <button type="button" onClick={toggleSelectAll} className="text-blue-700 underline hover:no-underline dark:text-blue-300">Deselect all</button>
            <button type="button" onClick={handleBulkDelete} className="ml-auto rounded bg-rose-600 px-3 py-1 text-xs font-medium text-white hover:bg-rose-700">Delete Customers</button>
        </div>
      )}

      {customers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <Users className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {sp.get("query") || tagFilterValue ? "No customers match your search." : "No customers yet"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Customers will appear here after receiving orders.</p>
          {!isViewer && !sp.get("query") && !tagFilterValue && (
            <button type="button" onClick={() => router.push("/customers/new")} className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Add Customer</button>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {customers.map((c) => (
              <CustomerCard
                key={c.id}
                customer={c}
                isSelected={selectedIds.has(c.id)}
                onToggleSelect={toggleSelect}
                onView={() => router.push(`/customers/${c.id}`)}
                isViewer={isViewer}
              />
            ))}
          </div>
        </>
      )}

      {totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
      )}

      {formError && !addOpen && (
        <p className="rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-200">{formError}</p>
      )}

      <FilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        tagFilter={tagFilterValue}
        repeatFilter={repeatFilterValue}
        allTags={allTags}
        onTagChange={(v) => applyFilter("tag", v)}
        onRepeatChange={(v) => applyFilter("isRepeat", v)}
        onClear={() => router.push("/customers")}
      />

      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-8" onMouseDown={(e) => { if (e.target === e.currentTarget) setAddOpen(false); }}>
          <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-card-foreground">Add Customer</h2>
              <button type="button" onClick={() => setAddOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <CustomerForm error={formError} disabled={isPending} onSubmit={handleCreate} />
          </div>
        </div>
      )}
    </section>
  );
}

const CUSTOMERS_STAT_TOOLTIPS: Record<string, string> = {
  "Total Customers": "All registered customers",
  "Repeat Buyers": "Customers with repeat purchases",
  "Total LTV": "Lifetime value of all customers",
  "Avg Order Value": "Average amount per customer order",
};

function StatCard({ label, value, accent }: { label: string; value: string; accent?: "amber" | "blue" }) {
  const valClass = accent === "amber"
    ? "text-amber-600 dark:text-amber-400"
    : accent === "blue"
      ? "text-blue-600 dark:text-blue-400"
      : "text-card-foreground";
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground" title={CUSTOMERS_STAT_TOOLTIPS[label] ?? label}>{label}</p>
      <h2 className={`mt-2 text-3xl font-bold tracking-tight ${valClass}`}>{value}</h2>
    </div>
  );
}

function CustomerCard({ customer, isSelected, onToggleSelect, onView, isViewer }: {
  customer: CustomerListItem;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onView: () => void;
  isViewer: boolean;
}) {
  return (
    <div className={`group relative overflow-hidden rounded-xl border bg-card shadow-sm transition hover:shadow-md cursor-pointer ${isSelected ? "border-blue-500 ring-1 ring-blue-500" : "border-border"}`} onClick={onView}>
      {!isViewer && (
        <div className="absolute left-2 top-2 z-10" onClick={(e) => e.stopPropagation()}>
          <input type="checkbox" checked={isSelected} onChange={() => onToggleSelect(customer.id)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full border border-border bg-muted/30">
            {customer.avatarUrl ? (
              <img src={customer.avatarUrl} alt={customer.fullName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-bold text-white">
                {customer.fullName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate text-sm font-semibold text-card-foreground">{customer.fullName}</h3>
              {customer.isRepeat && <Star className="h-3.5 w-3.5 flex-shrink-0 fill-amber-400 text-amber-400" />}
            </div>
            {customer.businessName && <p className="truncate text-xs text-muted-foreground">{customer.businessName}</p>}
          </div>
        </div>

        <div className="mt-3 space-y-1">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Phone className="h-3 w-3" /> {customer.phone}
          </p>
          {customer.email && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
              <Mail className="h-3 w-3" /> {customer.email}
            </p>
          )}
        </div>

        {customer.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {customer.tags.slice(0, 3).map((t) => (
              <span key={t} className={tagBadgeClass(t)}>{t}</span>
            ))}
            {customer.tags.length > 3 && <span className="text-[10px] text-muted-foreground">+{customer.tags.length - 3}</span>}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Package className="h-3 w-3" /> {customer.orderCount} orders
          </div>
          <p className="text-sm font-semibold text-card-foreground">{formatLtv(customer.totalSpentBdt)}</p>
        </div>
      </div>
    </div>
  );
}

function Pagination({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (page: number) => void }) {
  const pages: (number | "...")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <nav className="flex items-center justify-center gap-1" aria-label="Pagination">
      <button type="button" disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)} className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40">
        <ChevronLeft className="h-4 w-4" /> Prev
      </button>
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`e${i}`} className="px-2 text-muted-foreground">…</span>
        ) : (
          <button key={p} type="button" onClick={() => onPageChange(p)} className={`min-w-[2.25rem] rounded-lg px-3 py-2 text-sm font-medium transition ${p === currentPage ? "bg-blue-600 text-white" : "border border-border text-foreground hover:bg-muted"}`}>{p}</button>
        ),
      )}
      <button type="button" disabled={currentPage >= totalPages} onClick={() => onPageChange(currentPage + 1)} className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40">
        Next <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}

function FilterDrawer({ open, onClose, tagFilter, repeatFilter, allTags, onTagChange, onRepeatChange, onClear }: {
  open: boolean;
  onClose: () => void;
  tagFilter: string;
  repeatFilter: string;
  allTags: string[];
  onTagChange: (v: string) => void;
  onRepeatChange: (v: string) => void;
  onClear: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-80 max-w-full border-l border-border bg-card p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-card-foreground">Filters</h2>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-5">
          <div>
            <label className="text-sm font-medium text-card-foreground">Tag</label>
            <select value={tagFilter} onChange={(e) => onTagChange(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500">
              <option value="">All Tags</option>
              {allTags.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-card-foreground">Buyer Type</label>
            <select value={repeatFilter} onChange={(e) => onRepeatChange(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500">
              <option value="">All</option>
              <option value="yes">Repeat Buyers</option>
              <option value="no">First-Time</option>
            </select>
          </div>
          <button type="button" onClick={onClear} className="w-full rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted">Clear all filters</button>
        </div>
      </div>
    </div>
  );
}
