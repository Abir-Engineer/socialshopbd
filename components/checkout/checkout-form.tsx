"use client";

import { useState, useTransition } from "react";
import { submitCheckoutOrder } from "@/app/checkout/actions";
import type { Database } from "@/types/supabase";

type ShopRow = Database["public"]["Tables"]["shops"]["Row"];
type ProductRow = Database["public"]["Tables"]["products"]["Row"];

interface CheckoutFormProps {
  shop: ShopRow;
  products: ProductRow[];
}

export function CheckoutForm({ shop, products }: CheckoutFormProps) {
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [successOrder, setSuccessOrder] = useState<{ orderNumber: string; total: number } | null>(null);

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const unitPrice = selectedProduct?.price_bdt ?? 0;
  const totalPrice = unitPrice * quantity;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!selectedProductId) {
      setError("Please select a product.");
      return;
    }

    const formData = new FormData(e.currentTarget);
    formData.append("shop_slug", shop.slug);
    formData.append("product_id", selectedProductId);
    formData.append("quantity", String(quantity));

    startTransition(async () => {
      const res = await submitCheckoutOrder(formData);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSuccessOrder({
        orderNumber: res.orderNumber,
        total: totalPrice,
      });
    });
  };

  if (successOrder) {
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-emerald-100 bg-card p-8 text-center shadow-xl dark:border-emerald-950/30">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
          <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h2 className="mt-6 text-2xl font-bold text-foreground">Order placed successfully</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Thank you for shopping with <span className="font-semibold text-foreground">{shop.shop_name}</span>.
        </p>

        <div className="mt-6 rounded-2xl bg-muted/50 p-5 text-left space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Order Number:</span>
            <span className="font-mono font-bold text-foreground">{successOrder.orderNumber}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Product:</span>
            <span className="font-medium text-foreground">{selectedProduct?.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Quantity:</span>
            <span className="font-medium text-foreground">{quantity}</span>
          </div>
          <div className="border-t border-border pt-3 flex justify-between text-base font-semibold">
            <span className="text-foreground">Total Amount:</span>
            <span className="text-blue-600 dark:text-blue-400">
              {successOrder.total.toLocaleString()} {shop.currency}
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            setSuccessOrder(null);
            setQuantity(1);
          }}
          className="mt-8 w-full rounded-2xl bg-blue-600 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-700 active:scale-95"
        >
          Order Another Product
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl rounded-3xl border border-border bg-card p-6 shadow-xl sm:p-10">
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Checkout Form */}
        <form onSubmit={handleSubmit} className="space-y-6 lg:col-span-7">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">Shipping Information</h2>
            <p className="text-xs text-muted-foreground">Please provide valid shipping details for accurate delivery.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Full Name</label>
              <input
                name="name"
                type="text"
                required
                disabled={isPending}
                placeholder="e.g. Adnan Rahman"
                className="mt-1.5 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-blue-500 disabled:opacity-60"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone Number</label>
                <input
                  name="phone"
                  type="tel"
                  required
                  disabled={isPending}
                  placeholder="e.g. 017xxxxxxxx"
                  className="mt-1.5 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-blue-500 disabled:opacity-60"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email (Optional)</label>
                <input
                  name="email"
                  type="email"
                  disabled={isPending}
                  placeholder="e.g. adnan@gmail.com"
                  className="mt-1.5 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-blue-500 disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Delivery Address</label>
              <textarea
                name="address"
                required
                rows={3}
                disabled={isPending}
                placeholder="House, Road, Area, District"
                className="mt-1.5 w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-blue-500 disabled:opacity-60"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-2xl bg-rose-50 border border-rose-100 p-4 text-sm text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending || products.length === 0}
            className="w-full rounded-2xl bg-blue-600 py-4 text-sm font-semibold text-white shadow-lg shadow-blue-500/10 transition hover:bg-blue-700 active:scale-95 disabled:opacity-60"
          >
            {isPending ? "Processing Order…" : "Confirm Cash on Delivery"}
          </button>
        </form>

        {/* Product Selection & Summary */}
        <div className="rounded-2xl border border-border bg-muted/30 p-6 lg:col-span-5 flex flex-col justify-between">
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-foreground">Select Product</h3>

            {products.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No products available for purchase right now.
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Available Items
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => {
                      setSelectedProductId(e.target.value);
                      setQuantity(1);
                    }}
                    disabled={isPending}
                    className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-blue-500"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.price_bdt} BDT)
                      </option>
                    ))}
                  </select>
                </div>

                {selectedProduct && (
                  <div className="rounded-2xl bg-background p-4 border border-border space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-foreground">{selectedProduct.name}</span>
                      <span className="text-xs text-muted-foreground">SKU: {selectedProduct.sku}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Unit Price:</span>
                      <span className="font-semibold text-foreground">{selectedProduct.price_bdt} {shop.currency}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Stock Status:</span>
                      {selectedProduct.stock > 0 ? (
                        <span className="text-emerald-500 font-semibold">{selectedProduct.stock} Available</span>
                      ) : (
                        <span className="text-rose-500 font-semibold">Out of Stock</span>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Quantity
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={isPending || quantity <= 1}
                      onClick={() => setQuantity((q) => q - 1)}
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background font-semibold hover:bg-muted text-foreground transition disabled:opacity-40"
                    >
                      -
                    </button>
                    <span className="w-12 text-center text-sm font-bold text-foreground">{quantity}</span>
                    <button
                      type="button"
                      disabled={isPending || (selectedProduct ? quantity >= selectedProduct.stock : true)}
                      onClick={() => setQuantity((q) => q + 1)}
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background font-semibold hover:bg-muted text-foreground transition disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 border-t border-border pt-6 space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium text-foreground">
                {totalPrice.toLocaleString()} {shop.currency}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Delivery Charge</span>
              <span className="text-emerald-500 font-semibold">FREE</span>
            </div>
            <div className="flex justify-between items-center border-t border-border pt-4">
              <span className="text-base font-bold text-foreground">Total Amount</span>
              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {totalPrice.toLocaleString()} {shop.currency}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
