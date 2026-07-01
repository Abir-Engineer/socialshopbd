"use client";

import { useEffect } from "react";
import { generateInvoiceHtml } from "@/lib/orders/invoice";
import type { OrderRow } from "@/types/orders";
import type { OrderItemRow } from "@/types/orders";

type OrderInvoiceProps = {
  order: OrderRow;
  items: OrderItemRow[];
  shopName: string;
  shopAddress: string;
};

export function OrderInvoice({ order, items, shopName, shopAddress }: OrderInvoiceProps) {
  useEffect(() => {
    const html = generateInvoiceHtml(
      shopName,
      shopAddress,
      order.order_number,
      order.customer_name,
      order.order_phone ?? "",
      order.order_address ?? "",
      new Date(order.created_at).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      items.map((i) => ({
        name: i.product_name ?? "Product",
        sku: i.product_sku ?? "",
        qty: i.quantity,
        price: i.unit_price_bdt ?? 0,
        total: i.line_total_bdt,
      })),
      items.reduce((s, i) => s + i.line_total_bdt, 0),
      order.delivery_charge_bdt ?? 0,
      (order.discount_bdt ?? 0) + (order.coupon_discount_bdt ?? 0),
      order.amount_bdt,
      order.payment_status ?? "unpaid",
    );

    const iframe = document.getElementById("invoice-frame") as HTMLIFrameElement;
    if (iframe) {
      iframe.srcdoc = html;
    }
  }, [order, items, shopName, shopAddress]);

  return (
    <div className="w-full">
      <iframe
        id="invoice-frame"
        title="Invoice"
        className="h-screen w-full rounded-lg border border-border"
      />
    </div>
  );
}
