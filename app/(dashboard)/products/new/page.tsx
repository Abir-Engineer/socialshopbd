"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createProduct } from "@/app/(dashboard)/products/actions";

export default function NewProductPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createProduct(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/products");
      router.refresh();
    });
  };

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Add New Product</h1>
        <p className="text-sm text-muted-foreground">Create a new product for your inventory.</p>
      </header>

      <div className="max-w-lg rounded-xl border border-border bg-card p-6 shadow-sm">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-card-foreground">Name</span>
            <input
              name="name"
              required
              disabled={isPending}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-500 disabled:opacity-60"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-card-foreground">SKU</span>
            <input
              name="sku"
              required
              disabled={isPending}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-500 disabled:opacity-60"
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
              defaultValue={0}
              disabled={isPending}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-500 disabled:opacity-60"
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
              defaultValue={0}
              disabled={isPending}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-500 disabled:opacity-60"
            />
          </label>
          {error && (
            <p className="rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
              {error}
            </p>
          )}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push("/products")}
              disabled={isPending}
              className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-60 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-70 cursor-pointer"
            >
              {isPending ? "Saving…" : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
