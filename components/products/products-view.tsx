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
    if (!window.confirm(`"${product.name}" মুছবেন? এটি পূর্বাবস্থায় ফেরানো যাবে না।`)) {
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
          <h1 className="text-2xl font-semibold text-foreground">পণ্য</h1>
          <p className="text-sm text-muted-foreground">পণ্যের ইনভেন্টরি ও লিস্টিং স্বাস্থ্য পর্যবেক্ষণ করুন।</p>
          {isPending && <p className="mt-1 text-xs text-muted-foreground">সংরক্ষণ করা হচ্ছে…</p>}
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
            নতুন পণ্য যোগ করুন
          </button>
        )}
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">মোট পণ্য</p>
          <h2 className="mt-2 text-2xl font-semibold text-card-foreground">{stats.total.toLocaleString("en-BD")}</h2>
        </article>
        <article className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">সক্রিয় লিস্টিং</p>
          <h2 className="mt-2 text-2xl font-semibold text-card-foreground">{stats.active.toLocaleString("en-BD")}</h2>
        </article>
        <article className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">স্বল্প স্টক সতর্কতা</p>
          <h2 className="mt-2 text-2xl font-semibold text-amber-600 dark:text-amber-400">
            {stats.lowStock.toLocaleString("en-BD")}
          </h2>
        </article>
        <article className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">স্টকে নেই</p>
          <h2 className="mt-2 text-2xl font-semibold text-rose-600 dark:text-rose-400">
            {stats.outOfStock.toLocaleString("en-BD")}
          </h2>
        </article>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-5 py-4">
          <p className="text-sm text-muted-foreground">ইনভেন্টরি ওভারভিউ</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-muted-foreground">
              <tr className="border-b border-border">
                <th className="px-5 py-3 font-medium">পণ্য</th>
                <th className="px-5 py-3 font-medium">এসকেইউ</th>
                <th className="px-5 py-3 font-medium">স্টক</th>
                <th className="px-5 py-3 font-medium">মূল্য</th>
                <th className="px-5 py-3 font-medium">অবস্থা</th>
                {role !== "viewer" && <th className="px-5 py-3 font-medium">কার্যক্রম</th>}
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                    এখনো কোনো পণ্য নেই। <span className="font-medium text-foreground">নতুন পণ্য যোগ করুন</span> ব্যবহার করে আপনার প্রথম আইটেম তৈরি করুন।
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
                              সম্পাদনা
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(product)}
                              className="text-xs font-medium text-rose-600 hover:underline dark:text-rose-400"
                            >
                              মুছুন
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
            <span className="text-sm font-medium text-card-foreground">নাম</span>
            <input
              name="name"
              required
              defaultValue={initial?.name}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-500"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-card-foreground">এসকেইউ</span>
            <input
              name="sku"
              required
              defaultValue={initial?.sku}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-500"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-card-foreground">স্টক</span>
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
            <span className="text-sm font-medium text-card-foreground">মূল্য (বিডিটি)</span>
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
              বাতিল
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
