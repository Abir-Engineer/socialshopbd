"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { formatPriceBdt } from "@/lib/products/display";
import { calculateLineTotal } from "@/types/orders";
import type { OrderFormItem } from "@/types/orders";

type OrderItemsEditorProps = {
  items: OrderFormItem[];
  onChange: (items: OrderFormItem[]) => void;
  disabled?: boolean;
};

export function OrderItemsEditor({ items, onChange, disabled }: OrderItemsEditorProps) {
  const addItem = () => {
    onChange([
      ...items,
      { product_id: "", product_name: "", product_sku: "", quantity: 1, unit_price_bdt: 0, discount_bdt: 0 },
    ]);
  };

  const updateItem = (index: number, patch: Partial<OrderFormItem>) => {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((s, item) => s + calculateLineTotal(item.quantity, item.unit_price_bdt, item.discount_bdt), 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-card-foreground">Order Items</span>
        <button type="button" onClick={addItem} disabled={disabled} className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400 disabled:opacity-50">
          <Plus className="h-3 w-3" /> Add Item
        </button>
      </div>

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
          No items yet. Click "Add Item" to add products.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => {
            const lineTotal = calculateLineTotal(item.quantity, item.unit_price_bdt, item.discount_bdt);
            return (
              <div key={i} className="rounded-lg border border-border bg-muted/20 p-3">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
                  <div className="col-span-2 sm:col-span-2">
                    <label className="text-[10px] text-muted-foreground">Product</label>
                    <input
                      value={item.product_name}
                      onChange={(e) => updateItem(i, { product_name: e.target.value, product_id: e.target.value })}
                      placeholder="Product name"
                      disabled={disabled}
                      className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">SKU</label>
                    <input
                      value={item.product_sku}
                      onChange={(e) => updateItem(i, { product_sku: e.target.value })}
                      placeholder="SKU"
                      disabled={disabled}
                      className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">Qty</label>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateItem(i, { quantity: Math.max(1, Number(e.target.value)) })}
                      disabled={disabled}
                      className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">Price</label>
                    <input
                      type="number"
                      min={0}
                      value={item.unit_price_bdt}
                      onChange={(e) => updateItem(i, { unit_price_bdt: Math.max(0, Number(e.target.value)) })}
                      disabled={disabled}
                      className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="flex-1">
                      <label className="text-[10px] text-muted-foreground">Total</label>
                      <p className="pt-1.5 text-sm font-medium text-card-foreground">{formatPriceBdt(lineTotal)}</p>
                    </div>
                    <button type="button" onClick={() => removeItem(i)} disabled={disabled} className="mt-4 text-rose-500 hover:text-rose-700 disabled:opacity-50">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-end border-t border-border pt-2">
        <p className="text-sm font-semibold text-card-foreground">
          Subtotal: {formatPriceBdt(subtotal)}
        </p>
      </div>

      <input type="hidden" name="items" value={JSON.stringify(items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price_bdt: item.unit_price_bdt,
        discount_bdt: item.discount_bdt,
        line_total_bdt: calculateLineTotal(item.quantity, item.unit_price_bdt, item.discount_bdt),
        product_name: item.product_name,
        product_sku: item.product_sku,
      })))} />
    </div>
  );
}
