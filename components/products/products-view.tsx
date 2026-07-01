"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { createProduct, deleteProduct, updateProduct, bulkDeleteProducts, bulkUpdateProducts, exportProductsCsv, importProductsCsv } from "@/app/(dashboard)/products/actions";
import { formatPriceBdt, getStockStatus, getStockStatusLabel, productStats, statusBadgeClass } from "@/lib/products/display";
import type { ProductRow } from "@/types/products";
import { PRODUCT_SORT_OPTIONS, PRODUCT_STOCK_FILTERS, PRODUCT_CATEGORIES } from "@/types/products";
import { ImageUpload } from "@/components/ui/image-upload";
import { MultiImageUpload } from "@/components/ui/multi-image-upload";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Search, SlidersHorizontal, X, Upload, Download, Package, ChevronLeft, ChevronRight } from "lucide-react";

type ProductsViewProps = {
  initialProducts: ProductRow[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  role: string;
};

export function ProductsView({ initialProducts, totalCount, totalPages, currentPage, role }: ProductsViewProps) {
  const router = useRouter();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [filterOpen, setFilterOpen] = useState(false);
  const [query, setQuery] = useState(sp.get("query") ?? "");
  const [category, setCategory] = useState(sp.get("category") ?? "");
  const [brand, setBrand] = useState(sp.get("brand") ?? "");
  const [stockFilter, setStockFilter] = useState(sp.get("stockStatus") ?? "");

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<"delete" | "update" | null>(null);

  const [importOpen, setImportOpen] = useState(false);
  const [importCsv, setImportCsv] = useState("");
  const [importResult, setImportResult] = useState<string | null>(null);

  const [exportLoading, setExportLoading] = useState(false);

  const isViewer = role === "viewer";
  const products = initialProducts;
  const stats = productStats(products);

  const closeModals = () => {
    setAddOpen(false);
    setEditOpen(false);
    setEditing(null);
    setFormError(null);
  };

  const buildUrl = useCallback(
    (params: Record<string, string | undefined>) => {
      const p = new URLSearchParams(sp.toString());
      for (const [k, v] of Object.entries(params)) {
        if (v) p.set(k, v);
        else p.delete(k);
      }
      return `/products?${p.toString()}`;
    },
    [sp],
  );

  const handleSearch = () => {
    router.push(buildUrl({ query: query || undefined, page: "1" }));
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
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
    if (selectedIds.size === products.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(products.map((p) => p.id)));
    }
  };

  const handleCreate = (formData: FormData) => {
    setFormError(null);
    startTransition(async () => {
      const result = await createProduct(formData);
      if (!result.ok) { setFormError(result.error); return; }
      closeModals();
      router.refresh();
    });
  };

  const handleUpdate = (formData: FormData) => {
    setFormError(null);
    startTransition(async () => {
      const result = await updateProduct(formData);
      if (!result.ok) { setFormError(result.error); return; }
      closeModals();
      router.refresh();
    });
  };

  const handleDelete = (product: ProductRow) => {
    if (!window.confirm(`"${product.name}" মুছবেন? এটি পূর্বাবস্থায় ফেরানো যাবে না।`)) return;
    setFormError(null);
    startTransition(async () => {
      const result = await deleteProduct(product.id);
      if (!result.ok) { setFormError(result.error); return; }
      if (editing?.id === product.id) { setEditOpen(false); setEditing(null); setFormError(null); }
      router.refresh();
    });
  };

  const handleBulkDelete = () => {
    startTransition(async () => {
      const result = await bulkDeleteProducts(Array.from(selectedIds));
      if (!result.ok) { setFormError(result.error); return; }
      setSelectedIds(new Set());
      setBulkAction(null);
      router.refresh();
    });
  };

  const handleBulkUpdate = (formData: FormData) => {
    startTransition(async () => {
      const ids = Array.from(selectedIds);
      const updates: { category?: string; brand?: string; stock?: number; price_bdt?: number } = {};
      const cat = formData.get("category") as string | null;
      const brd = formData.get("brand") as string | null;
      if (cat) updates.category = cat;
      if (brd) updates.brand = brd;
      const result = await bulkUpdateProducts(ids, updates);
      if (!result.ok) { setFormError(result.error); return; }
      setSelectedIds(new Set());
      setBulkAction(null);
      router.refresh();
    });
  };

  const handleExport = async () => {
    setExportLoading(true);
    const result = await exportProductsCsv();
    if (!result.ok) { setFormError(result.error); setExportLoading(false); return; }
    const blob = new Blob([result.csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `products-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportLoading(false);
  };

  const handleImport = async () => {
    setImportResult(null);
    if (!importCsv.trim()) { setImportResult("Please paste CSV content."); return; }
    startTransition(async () => {
      const result = await importProductsCsv(importCsv);
      if (!result.ok) { setImportResult(result.error); return; }
      setImportResult(`Imported ${result.count} product(s) successfully.`);
      setImportCsv("");
      setTimeout(() => { setImportOpen(false); setImportResult(null); router.refresh(); }, 1500);
    });
  };

  const sortValue = `${sp.get("sortBy") ?? "created_at"}-${sp.get("sortOrder") ?? "desc"}`;
  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split("-");
    router.push(buildUrl({ sortBy, sortOrder, page: "1" }));
  };

  return (
    <section className={`space-y-6 ${isPending ? "pointer-events-none opacity-60" : ""}`} aria-busy={isPending}>
      <header className="animate-fade-in flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">পণ্য</h1>
          <p className="text-sm text-muted-foreground">পণ্যের ইনভেন্টরি ও লিস্টিং স্বাস্থ্য পর্যবেক্ষণ করুন।</p>
          {isPending && <p className="mt-1 text-xs text-muted-foreground">সংরক্ষণ করা হচ্ছে…</p>}
        </div>
        {!isViewer && (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={handleExport} disabled={exportLoading} className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-50">
              <Download className="h-4 w-4" /> Export
            </button>
            <button type="button" onClick={() => { setImportOpen(true); setImportResult(null); setImportCsv(""); }} className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted">
              <Upload className="h-4 w-4" /> Import
            </button>
            <button
              type="button"
              onClick={() => { setFormError(null); setAddOpen(true); }}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              <Package className="h-4 w-4" /> নতুন পণ্য
            </button>
          </div>
        )}
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="মোট পণ্য" value={totalCount.toLocaleString("en-BD")} />
        <StatCard label="এই পৃষ্ঠায়" value={products.length.toLocaleString("en-BD")} />
        <StatCard label="স্বল্প স্টক" value={stats.lowStock.toLocaleString("en-BD")} accent="amber" />
        <StatCard label="স্টকে নেই" value={stats.outOfStock.toLocaleString("en-BD")} accent="rose" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search name, SKU, brand, barcode..."
              className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground outline-none transition focus:border-blue-500"
            />
          </div>
          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition ${
              category || brand || stockFilter
                ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                : "border-border bg-background text-foreground hover:bg-muted"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </button>
          <select
            value={sortValue}
            onChange={(e) => handleSortChange(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-500"
          >
            {PRODUCT_SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm dark:border-blue-900 dark:bg-blue-950/50">
          <span className="font-medium text-blue-800 dark:text-blue-200">{selectedIds.size} selected</span>
          <button type="button" onClick={toggleSelectAll} className="text-blue-700 underline hover:no-underline dark:text-blue-300">Deselect all</button>
          <button type="button" onClick={() => setBulkAction("update")} className="ml-auto rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700">Update</button>
          <button type="button" onClick={() => setBulkAction("delete")} className="rounded bg-rose-600 px-3 py-1 text-xs font-medium text-white hover:bg-rose-700">Delete</button>
        </div>
      )}

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <Package className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {sp.get("query") || category || brand ? "No products match your search." : "এখনো কোনো পণ্য নেই।"}
          </p>
          {!isViewer && !sp.get("query") && !category && !brand && (
            <button
              type="button"
              onClick={() => { setFormError(null); setAddOpen(true); }}
              className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              নতুন পণ্য যোগ করুন
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => {
            const status = getStockStatus(product.stock);
            return (
              <ProductCard
                key={product.id}
                product={product}
                status={status}
                isSelected={selectedIds.has(product.id)}
                onToggleSelect={toggleSelect}
                onEdit={() => { setFormError(null); setEditing(product); setEditOpen(true); }}
                onDelete={() => handleDelete(product)}
                isViewer={isViewer}
              />
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
      )}

      {formError && !addOpen && !editOpen && !bulkAction && (
        <p className="rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-200">{formError}</p>
      )}

      {addOpen && (
        <ProductModal
          title="নতুন পণ্য যোগ করুন"
          submitLabel="পণ্য তৈরি করুন"
          onClose={closeModals}
          onSubmit={handleCreate}
          error={formError}
          disabled={isPending}
        />
      )}

      {editOpen && editing && (
        <ProductModal
          key={editing.id}
          title="পণ্য সম্পাদনা করুন"
          submitLabel="পরিবর্তন সংরক্ষণ করুন"
          initial={editing}
          onClose={closeModals}
          onSubmit={handleUpdate}
          error={formError}
          disabled={isPending}
        />
      )}

      <FilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        category={category}
        brand={brand}
        stockFilter={stockFilter}
        onCategoryChange={(v) => { setCategory(v); applyFilter("category", v); }}
        onBrandChange={(v) => { setBrand(v); applyFilter("brand", v); }}
        onStockFilterChange={(v) => { setStockFilter(v); applyFilter("stockStatus", v); }}
        onClear={() => { setCategory(""); setBrand(""); setStockFilter(""); router.push("/products"); }}
      />

      {bulkAction === "delete" && (
        <BulkDeleteModal
          count={selectedIds.size}
          onConfirm={handleBulkDelete}
          onCancel={() => setBulkAction(null)}
          disabled={isPending}
        />
      )}

      {bulkAction === "update" && (
        <BulkUpdateModal
          onConfirm={handleBulkUpdate}
          onCancel={() => setBulkAction(null)}
          error={formError}
          disabled={isPending}
        />
      )}

      {importOpen && (
        <ImportModal
          csv={importCsv}
          onChange={setImportCsv}
          onImport={handleImport}
          onClose={() => { setImportOpen(false); setImportResult(null); }}
          result={importResult}
          disabled={isPending}
        />
      )}
    </section>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: "rose" | "amber" }) {
  const valClass = accent === "rose"
    ? "text-rose-600 dark:text-rose-400"
    : accent === "amber"
      ? "text-amber-600 dark:text-amber-400"
      : "text-card-foreground";
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <h2 className={`mt-2 text-3xl font-bold tracking-tight ${valClass}`}>{value}</h2>
    </div>
  );
}

function ProductCard({
  product, status, isSelected, onToggleSelect, onEdit, onDelete, isViewer,
}: {
  product: ProductRow;
  status: string;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  isViewer: boolean;
}) {
  const images = (Array.isArray(product.images) ? product.images : []).filter(Boolean) as string[];
  const displayImage = product.image_url ?? images[0] ?? null;

  return (
    <div className={`group relative overflow-hidden rounded-xl border bg-card shadow-sm transition hover:shadow-md ${isSelected ? "border-blue-500 ring-1 ring-blue-500" : "border-border"}`}>
      {!isViewer && (
        <div className="absolute left-2 top-2 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(product.id)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </div>
      )}
      <div className="aspect-square w-full overflow-hidden bg-muted/30">
        {displayImage ? (
          <img src={displayImage} alt={product.name} className="h-full w-full object-cover transition group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Package className="h-10 w-10" />
          </div>
        )}
      </div>
      <div className="space-y-1.5 p-4">
        <h3 className="truncate text-sm font-semibold text-card-foreground" title={product.name}>{product.name}</h3>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {product.brand && <span>{product.brand}</span>}
          {product.category && <span className="rounded bg-muted px-1.5 py-0.5">{product.category}</span>}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-base font-bold text-card-foreground">{formatPriceBdt(product.price_bdt)}</span>
          <span className={statusBadgeClass(status as any)}>{status}</span>
        </div>
        {!isViewer && (
          <div className="flex gap-2 pt-1.5">
            <button type="button" onClick={onEdit} className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400">সম্পাদনা</button>
            <button type="button" onClick={onDelete} className="text-xs font-medium text-rose-600 hover:underline dark:text-rose-400">মুছুন</button>
          </div>
        )}
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
          <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground">…</span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={`min-w-[2.25rem] rounded-lg px-3 py-2 text-sm font-medium transition ${
              p === currentPage
                ? "bg-blue-600 text-white"
                : "border border-border text-foreground hover:bg-muted"
            }`}
          >
            {p}
          </button>
        ),
      )}
      <button type="button" disabled={currentPage >= totalPages} onClick={() => onPageChange(currentPage + 1)} className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40">
        Next <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}

function FilterDrawer({
  open, onClose, category, brand, stockFilter, onCategoryChange, onBrandChange, onStockFilterChange, onClear,
}: {
  open: boolean;
  onClose: () => void;
  category: string;
  brand: string;
  stockFilter: string;
  onCategoryChange: (v: string) => void;
  onBrandChange: (v: string) => void;
  onStockFilterChange: (v: string) => void;
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
            <label className="text-sm font-medium text-card-foreground">Category</label>
            <select value={category} onChange={(e) => onCategoryChange(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500">
              <option value="">All Categories</option>
              {PRODUCT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-card-foreground">Brand</label>
            <input value={brand} onChange={(e) => onBrandChange(e.target.value)} placeholder="Filter by brand..." className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-card-foreground">Stock Status</label>
            <select value={stockFilter} onChange={(e) => onStockFilterChange(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500">
              {PRODUCT_STOCK_FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
          <button type="button" onClick={onClear} className="w-full rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted">Clear all filters</button>
        </div>
      </div>
    </div>
  );
}

function BulkDeleteModal({ count, onConfirm, onCancel, disabled }: { count: number; onConfirm: () => void; onCancel: () => void; disabled: boolean }) {
  return (
    <Overlay onClose={onCancel}>
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-card-foreground">Delete {count} product(s)?</h2>
        <p className="mt-2 text-sm text-muted-foreground">This action cannot be undone.</p>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">Cancel</button>
          <button type="button" disabled={disabled} onClick={onConfirm} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50">Delete</button>
        </div>
      </div>
    </Overlay>
  );
}

function BulkUpdateModal({ onConfirm, onCancel, error, disabled }: { onConfirm: (fd: FormData) => void; onCancel: () => void; error: string | null; disabled: boolean }) {
  return (
    <Overlay onClose={onCancel}>
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-card-foreground">Bulk Update</h2>
        <form className="mt-4 space-y-4" onSubmit={(e) => { e.preventDefault(); onConfirm(new FormData(e.currentTarget)); }}>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-card-foreground">Category</span>
            <select name="category" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500">
              <option value="">No change</option>
              {PRODUCT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-card-foreground">Brand</span>
            <input name="brand" placeholder="New brand name (optional)" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500" />
          </label>
          {error && <p className="rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-700">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onCancel} className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">Cancel</button>
            <button type="submit" disabled={disabled} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">Update</button>
          </div>
        </form>
      </div>
    </Overlay>
  );
}

function ImportModal({ csv, onChange, onImport, onClose, result, disabled }: { csv: string; onChange: (v: string) => void; onImport: () => void; onClose: () => void; result: string | null; disabled: boolean }) {
  return (
    <Overlay onClose={onClose}>
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-card-foreground">Import Products (CSV)</h2>
        <p className="mt-1 text-xs text-muted-foreground">Required columns: Name, SKU. Optional: Barcode, Brand, Category, Color, Size, Stock, Price (BDT), Cost Price (BDT), Image URL</p>
        <textarea
          value={csv}
          onChange={(e) => onChange(e.target.value)}
          rows={8}
          placeholder="Name,SKU,Barcode,Brand,Category,Stock,Price (BDT),Cost Price (BDT)&#10;Blue T-Shirt,TS-001,,MyBrand,Clothing,50,599,350&#10;Red Shoes,RS-002,,,Shoes,20,1299,800"
          className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500 font-mono"
        />
        {result && <p className="mt-2 rounded-lg bg-emerald-100 px-3 py-2 text-sm text-emerald-700">{result}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">Close</button>
          <button type="button" disabled={disabled || !csv.trim()} onClick={onImport} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">Import</button>
        </div>
      </div>
    </Overlay>
  );
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      {children}
    </div>
  );
}

function ProductModal({ title, submitLabel, initial, onClose, onSubmit, error, disabled }: {
  title: string;
  submitLabel: string;
  initial?: ProductRow;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
  error: string | null;
  disabled: boolean;
}) {
  const [selectedCategory, setSelectedCategory] = useState(initial?.category ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(initial?.image_url ?? null);
  const [images, setImages] = useState<string[]>((Array.isArray(initial?.images) ? initial?.images : []) as string[]);
  const [variants, setVariants] = useState<any[]>([]);

  const handleImageUpload = async (file: File): Promise<{ ok: true; url: string } | { ok: false; error: string }> => {
    const supabase = getSupabaseBrowserClient();
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `temp/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
    if (error) return { ok: false, error: error.message };
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    return { ok: true, url: data.publicUrl };
  };

  return (
    <Overlay onClose={onClose}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-card-foreground">{title}</h2>
        <form
          className="mt-4 space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            fd.set("image_url", imageUrl ?? "");
            fd.set("images", JSON.stringify(images));
            fd.set("variants", JSON.stringify(variants));
            onSubmit(fd);
          }}
        >
          {initial && <input type="hidden" name="id" value={initial.id} />}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-card-foreground">Name *</span>
              <input name="name" required defaultValue={initial?.name} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-500" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-card-foreground">SKU *</span>
              <input name="sku" required defaultValue={initial?.sku} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-500" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-card-foreground">Barcode</span>
              <input name="barcode" defaultValue={initial?.barcode ?? ""} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-500" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-card-foreground">Brand</span>
              <input name="brand" defaultValue={initial?.brand ?? ""} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-500" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-card-foreground">Category</span>
              <select name="category" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-500">
                <option value="">Select category</option>
                {PRODUCT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-card-foreground">Color</span>
              <input name="color" defaultValue={initial?.color ?? ""} placeholder="e.g. Red, Blue, Black" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-500" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-card-foreground">Size</span>
              <input name="size" defaultValue={initial?.size ?? ""} placeholder="e.g. M, L, XL" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-500" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-card-foreground">Stock *</span>
              <input name="stock" type="number" min={0} step={1} required defaultValue={initial?.stock ?? 0} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-500" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-card-foreground">Price (BDT) *</span>
              <input name="price_bdt" type="number" min={0} step={1} required defaultValue={initial?.price_bdt ?? 0} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-500" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-card-foreground">Cost Price (BDT)</span>
              <input name="cost_price_bdt" type="number" min={0} step={1} defaultValue={initial?.cost_price_bdt ?? 0} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-500" />
            </label>
          </div>

          <ImageUpload value={imageUrl} onChange={setImageUrl} onUpload={handleImageUpload} />
          <MultiImageUpload values={images} onChange={setImages} onUpload={handleImageUpload} />

          {error && <p className="rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-700">{error}</p>}

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted">বাতিল</button>
            <button type="submit" disabled={disabled} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70">{submitLabel}</button>
          </div>
        </form>
      </div>
    </Overlay>
  );
}
