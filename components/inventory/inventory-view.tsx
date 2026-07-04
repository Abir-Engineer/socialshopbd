"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateStock } from "@/app/(dashboard)/inventory/actions";
import { getStockStatus, inventoryStats, stockStatusBadge, stockStatusLabel } from "@/lib/inventory/display";
import type { ProductRow as InventoryItem } from "@/types/products";

type InventoryViewProps = {
  initialItems: InventoryItem[];
  role: string;
};

export function InventoryView({ initialItems, role }: InventoryViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjusting, setAdjusting] = useState<InventoryItem | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const items = initialItems;
  const stats = inventoryStats(items);

  const closeModal = () => {
    setAdjustOpen(false);
    setAdjusting(null);
    setFormError(null);
  };

  const handleAdjustStock = (formData: FormData) => {
    setFormError(null);
    startTransition(async () => {
      const productId = formData.get("product_id") as string;
      const type = formData.get("type") as string;
      const quantityRaw = formData.get("quantity") as string;
      const quantity = Number.parseInt(quantityRaw, 10);

      if (!Number.isFinite(quantity) || quantity < 1) {
        setFormError("Quantity must be at least 1.");
        return;
      }

      const currentItem = items.find((i) => i.id === productId);
      if (!currentItem) {
        setFormError("Product not found. Please try again.");
        return;
      }

      const newStock = type === "remove" ? Math.max(0, currentItem.stock - quantity) : currentItem.stock + quantity;

      const result = await updateStock(productId, newStock);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      closeModal();
      router.refresh();
    });
  };

  return (
    <section className={`space-y-6 ${isPending ? "pointer-events-none opacity-60" : ""}`} aria-busy={isPending}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Inventory</h1>
          <p className="text-sm text-muted-foreground">Monitor stock levels and inventory health.</p>
          {isPending && <p className="mt-1 text-xs text-muted-foreground">Saving…</p>}
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Total Products</p>
          <h2 className="mt-2 text-2xl font-semibold text-card-foreground">{stats.total.toLocaleString("en-BD")}</h2>
        </article>
        <article className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">In Stock</p>
          <h2 className="mt-2 text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
            {stats.inStock.toLocaleString("en-BD")}
          </h2>
        </article>
        <article className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Low Stock</p>
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
          <p className="text-sm text-muted-foreground">Stock List (Low Stock First)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-muted-foreground">
              <tr className="border-b border-border">
                <th className="px-5 py-3 font-medium">Product Name</th>
                <th className="px-5 py-3 font-medium">SKU</th>
                <th className="px-5 py-3 font-medium">Current Stock</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Last Updated</th>
                {role !== "viewer" && <th className="px-5 py-3 font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={role !== "viewer" ? 6 : 5} className="px-5 py-12 text-center text-muted-foreground">
                    No products found in inventory.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const status = getStockStatus(item.stock);
                  return (
                    <tr key={item.id} className="border-b border-border/70 last:border-b-0">
                      <td className="px-5 py-4 font-medium text-card-foreground">{item.name}</td>
                      <td className="px-5 py-4 text-muted-foreground">{item.sku}</td>
                      <td className="px-5 py-4 text-card-foreground">{item.stock}</td>
                      <td className="px-5 py-4">
                        <span className={stockStatusBadge(item.stock)}>{stockStatusLabel(item.stock)}</span>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {new Date(item.updated_at).toLocaleDateString("bn-BD", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      {role !== "viewer" && (
                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() => {
                              setFormError(null);
                              setAdjusting(item);
                              setAdjustOpen(true);
                            }}
                            className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                          >
                            Adjust
                          </button>
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

      {formError && !adjustOpen && (
        <p className="rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-200">
          {formError}
        </p>
      )}

      {adjustOpen && adjusting && (
        <StockAdjustModal
          key={adjusting.id}
          item={adjusting}
          onClose={closeModal}
          onSubmit={handleAdjustStock}
          error={formError}
          disabled={isPending}
        />
      )}
    </section>
  );
}

type StockAdjustModalProps = {
  item: InventoryItem;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
  error: string | null;
  disabled: boolean;
};

function StockAdjustModal({ item, onClose, onSubmit, error, disabled }: StockAdjustModalProps) {
  const [type, setType] = useState<"add" | "remove">("add");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="stock-modal-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-lg">
        <h2 id="stock-modal-title" className="text-lg font-semibold text-card-foreground">
          Adjust Stock
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {item.name} — Current Stock: <span className="font-medium text-card-foreground">{item.stock}</span>
        </p>
        <form
          className="mt-4 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(new FormData(e.currentTarget));
          }}
        >
          <input type="hidden" name="product_id" value={item.id} />

          <div className="flex gap-3">
            <label className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 dark:has-[:checked]:bg-blue-950/30">
              <input
                type="radio"
                name="type"
                value="add"
                checked={type === "add"}
                onChange={() => setType("add")}
                className="accent-blue-600"
              />
              Add Stock
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium has-[:checked]:border-rose-500 has-[:checked]:bg-rose-50 dark:has-[:checked]:bg-rose-950/30">
              <input
                type="radio"
                name="type"
                value="remove"
                checked={type === "remove"}
                onChange={() => setType("remove")}
                className="accent-rose-600"
              />
              Remove Stock
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-card-foreground">Quantity</span>
            <input
              name="quantity"
              type="number"
              min={1}
              step={1}
              required
              placeholder="e.g. 5"
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
              {disabled ? "Updating…" : "Update Stock"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
