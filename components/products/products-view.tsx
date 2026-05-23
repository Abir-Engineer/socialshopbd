"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createProduct, deleteProduct, updateProduct } from "@/app/(dashboard)/products/actions";
import { formatPriceBdt, getStockStatus, productStats, statusBadgeClass } from "@/lib/products/display";
import type { ProductRow } from "@/types/products";

type ProductsViewProps = {
  initialProducts: ProductRow[];
  role: string;
};

export function ProductsView({ initialProducts, role }: ProductsViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const products = initialProducts;
  const stats = productStats(products);

  const closeModals = () => {
    setAddOpen(false);
    setEditOpen(false);
    setEditing(null);
    setFormError(null);
  };

  const handleCreate = (formData: FormData) => {
    setFormError(null);
    startTransition(async () => {
      const result = await createProduct(formData);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      closeModals();
      router.refresh();
    });
  };

  const handleUpdate = (formData: FormData) => {
    setFormError(null);
    startTransition(async () => {
      const result = await updateProduct(formData);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      closeModals();
      router.refresh();
    });
  };

  const handleDelete = (product: ProductRow) => {
    if (!window.confirm(`Delete “${product.name}”? This cannot be undone.`)) {
      return;
    }
    setFormError(null);
    startTransition(async () => {
      const result = await deleteProduct(product.id);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      if (editing?.id === product.id) {
        setEditOpen(false);
        setEditing(null);
        setFormError(null);
      }
      router.refresh();
    });
  };

  return (
    <section className={`space-y-6 ${isPending ? "pointer-events-none opacity-60" : ""}`} aria-busy={isPending}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Products</h1>
          <p className="text-sm text-muted-foreground">Monitor product inventory and listing health.</p>
          {isPending && <p className="mt-1 text-xs text-muted-foreground">Saving…</p>}
        </div>
        {role !== "viewer" && (
          <button
            type="button"
            onClick={() => {
              setFormError(null);
              setAddOpen(true);
            }}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Add New Product
          </button>
        )}
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Total Products</p>
          <h2 className="mt-2 text-2xl font-semibold text-card-foreground">{stats.total.toLocaleString("en-BD")}</h2>
        </article>
        <article className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Active Listings</p>
          <h2 className="mt-2 text-2xl font-semibold text-card-foreground">{stats.active.toLocaleString("en-BD")}</h2>
        </article>
        <article className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Low Stock Alerts</p>
          <h2 className="mt-2 text-2xl font-semibold text-amber-600 dark:text-amber-400">
            {stats.lowStock.toLocaleString("en-BD")}
          </h2>
        </article>
        <article className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Out of Stock</p>
          <h2 className="mt-2 text-2xl font-semibold text-rose-600 dark:text-rose-400">
            {stats.outOfStock.toLocaleString("en-BD")}
          </h2>
        </article>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-5 py-4">
          <p className="text-sm text-muted-foreground">Inventory Overview</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-muted-foreground">
              <tr className="border-b border-border">
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 font-medium">SKU</th>
                <th className="px-5 py-3 font-medium">Stock</th>
                <th className="px-5 py-3 font-medium">Price</th>
                <th className="px-5 py-3 font-medium">Status</th>
                {role !== "viewer" && <th className="px-5 py-3 font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                    No products yet. Use <span className="font-medium text-foreground">Add New Product</span> to create
                    your first item.
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const status = getStockStatus(product.stock);
                  return (
                    <tr key={product.id} className="border-b border-border/70 last:border-b-0">
                      <td className="px-5 py-4 font-medium text-card-foreground">{product.name}</td>
                      <td className="px-5 py-4 text-muted-foreground">{product.sku}</td>
                      <td className="px-5 py-4 text-card-foreground">{product.stock}</td>
                      <td className="px-5 py-4 text-card-foreground">{formatPriceBdt(product.price_bdt)}</td>
                      <td className="px-5 py-4">
                        <span className={statusBadgeClass(status)}>{status}</span>
                      </td>
                      {role !== "viewer" && (
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setFormError(null);
                                setEditing(product);
                                setEditOpen(true);
                              }}
                              className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(product)}
                              className="text-xs font-medium text-rose-600 hover:underline dark:text-rose-400"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {formError && !addOpen && !editOpen && (
        <p className="rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-200">
          {formError}
        </p>
      )}

      {addOpen && (
        <ProductModal
          title="Add New Product"
          submitLabel="Create product"
          onClose={closeModals}
          onSubmit={handleCreate}
          error={formError}
          disabled={isPending}
        />
      )}

      {editOpen && editing && (
        <ProductModal
          key={editing.id}
          title="Edit Product"
          submitLabel="Save changes"
          initial={editing}
          onClose={closeModals}
          onSubmit={handleUpdate}
          error={formError}
          disabled={isPending}
        />
      )}
    </section>
  );
}

type ProductModalProps = {
  title: string;
  submitLabel: string;
  initial?: ProductRow;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
  error: string | null;
  disabled: boolean;
};

function ProductModal({ title, submitLabel, initial, onClose, onSubmit, error, disabled }: ProductModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-lg">
        <h2 id="product-modal-title" className="text-lg font-semibold text-card-foreground">
          {title}
        </h2>
        <form
          className="mt-4 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(new FormData(e.currentTarget));
          }}
        >
          {initial && <input type="hidden" name="id" value={initial.id} />}
          <label className="block space-y-2">
            <span className="text-sm font-medium text-card-foreground">Name</span>
            <input
              name="name"
              required
              defaultValue={initial?.name}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-500"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-card-foreground">SKU</span>
            <input
              name="sku"
              required
              defaultValue={initial?.sku}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-500"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-card-foreground">Stock</span>
            <input
              name="stock"
              type="number"
              min={0}
              step={1}
              required
              defaultValue={initial?.stock ?? 0}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-500"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-card-foreground">Price (BDT)</span>
            <input
              name="price_bdt"
              type="number"
              min={0}
              step={1}
              required
              defaultValue={initial?.price_bdt ?? 0}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-500"
            />
          </label>
          {error && <p className="rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-700">{error}</p>}
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={disabled}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
