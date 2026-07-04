"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requireOrgId } from "@/lib/auth/organization";
import type { Database } from "@/types/supabase";
import { ORDER_STATUSES, type OrderStatus, PAYMENT_STATUSES, type PaymentStatus } from "@/types/orders";

type OrderInsert = Database["public"]["Tables"]["orders"]["Insert"];
type OrderUpdate = Database["public"]["Tables"]["orders"]["Update"];
type OrderItemInsert = Database["public"]["Tables"]["order_items"]["Insert"];

export type OrderActionResult = { ok: true } | { ok: false; error: string };
export type OrderBulkActionResult = { ok: true; count: number } | { ok: false; error: string };
export type OrderExportResult = { ok: true; csv: string } | { ok: false; error: string };
export type OrderCreateResult = { ok: true; id: string } | { ok: false; error: string };

function safeString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  return "";
}

function safeNullable(value: unknown): string | null {
  const s = safeString(value);
  return s || null;
}

function parseIntValue(value: unknown, fallback = 0): number {
  const n = Number(safeString(value));
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : fallback;
}

function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

function isPaymentStatus(value: string): value is PaymentStatus {
  return (PAYMENT_STATUSES as readonly string[]).includes(value);
}

export async function createOrder(formData: FormData): Promise<OrderCreateResult> {
  const orderNumber = safeString(formData.get("order_number"));
  const customerName = safeString(formData.get("customer_name"));

  if (!orderNumber) return { ok: false, error: "Please enter an order number." };
  if (!customerName) return { ok: false, error: "Please enter a customer name." };

  let organizationId: string;
  try { organizationId = await requireOrgId(); }
  catch { return { ok: false, error: "You don't have permission to perform this action." }; }

  const supabase = await getSupabaseServerClient();

  const itemsRaw = formData.get("items");
  let items: OrderItemInsert[] = [];
  if (typeof itemsRaw === "string") {
    try {
      items = JSON.parse(itemsRaw);
    } catch { items = []; }
  }

  const status = isOrderStatus(safeString(formData.get("status"))) ? safeString(formData.get("status")) : "pending";
  const paymentStatus = isPaymentStatus(safeString(formData.get("payment_status"))) ? safeString(formData.get("payment_status")) : "unpaid";
  const advanceBdt = parseIntValue(formData.get("advance_bdt"));
  const deliveryChargeBdt = parseIntValue(formData.get("delivery_charge_bdt"));
  const discountBdt = parseIntValue(formData.get("discount_bdt"));
  const couponCode = safeNullable(formData.get("coupon_code"));
  const couponDiscountBdt = parseIntValue(formData.get("coupon_discount_bdt"));
  const notes = safeString(formData.get("notes"));
  const orderPhone = safeNullable(formData.get("order_phone"));
  const orderAddress = safeNullable(formData.get("order_address"));

  const subtotal = items.reduce((s, i) => s + (i.line_total_bdt ?? 0), 0);
  const totalBdt = Math.max(0, subtotal + deliveryChargeBdt - discountBdt - couponDiscountBdt);

  const now = new Date().toISOString();

  const row: OrderInsert = {
    organization_id: organizationId,
    order_number: orderNumber,
    customer_name: customerName,
    customer_id: safeNullable(formData.get("customer_id")),
    amount_bdt: totalBdt,
    status,
    payment_status: paymentStatus,
    advance_bdt: advanceBdt,
    delivery_charge_bdt: deliveryChargeBdt,
    discount_bdt: discountBdt,
    coupon_code: couponCode,
    coupon_discount_bdt: couponDiscountBdt,
    notes,
    order_phone: orderPhone,
    order_address: orderAddress,
    created_at: now,
    updated_at: now,
  };

  const { data: orderData, error: insertError } = await supabase
    .from("orders")
    .insert(row)
    .select("id")
    .single();

  if (insertError) {
    if (insertError.code === "23505") return { ok: false, error: "This order number is already taken." };
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  const orderId = orderData.id;

  // Insert items
  if (items.length > 0) {
    const itemsWithOrder = items.map((item) => ({ ...item, order_id: orderId }));
    const { error: itemsError } = await supabase.from("order_items").insert(itemsWithOrder);
    if (itemsError) {
      await supabase.from("orders").delete().eq("id", orderId);
      return { ok: false, error: "Something went wrong saving the items. Please try again." };
    }
  }

  // Timeline entry
  await supabase.from("order_timeline").insert({
    order_id: orderId,
    status,
    note: "Order created",
    created_by: "System",
    created_at: now,
  });

  revalidatePath("/orders");
  revalidatePath("/customers");
  revalidatePath("/analytics");
  return { ok: true, id: orderId };
}

export async function updateOrder(formData: FormData): Promise<OrderActionResult> {
  const id = safeString(formData.get("id"));
  if (!id) return { ok: false, error: "Something went wrong. Please try again." };

  const orderNumber = safeString(formData.get("order_number"));
  const customerName = safeString(formData.get("customer_name"));
  if (!orderNumber) return { ok: false, error: "Please enter an order number." };

  const supabase = await getSupabaseServerClient();

  const itemsRaw = formData.get("items");
  let items: OrderItemInsert[] = [];
  if (typeof itemsRaw === "string") {
    try { items = JSON.parse(itemsRaw); } catch { items = []; }
  }

  const status = isOrderStatus(safeString(formData.get("status"))) ? safeString(formData.get("status")) : "pending";
  const paymentStatus = isPaymentStatus(safeString(formData.get("payment_status"))) ? safeString(formData.get("payment_status")) : "unpaid";
  const advanceBdt = parseIntValue(formData.get("advance_bdt"));
  const deliveryChargeBdt = parseIntValue(formData.get("delivery_charge_bdt"));
  const discountBdt = parseIntValue(formData.get("discount_bdt"));
  const couponCode = safeNullable(formData.get("coupon_code"));
  const couponDiscountBdt = parseIntValue(formData.get("coupon_discount_bdt"));
  const notes = safeString(formData.get("notes"));
  const orderPhone = safeNullable(formData.get("order_phone"));
  const orderAddress = safeNullable(formData.get("order_address"));

  const subtotal = items.reduce((s, i) => s + (i.line_total_bdt ?? 0), 0);
  const totalBdt = Math.max(0, subtotal + deliveryChargeBdt - discountBdt - couponDiscountBdt);
  const now = new Date().toISOString();

  const patch: OrderUpdate = {
    order_number: orderNumber,
    customer_name: customerName,
    customer_id: safeNullable(formData.get("customer_id")),
    amount_bdt: totalBdt,
    status,
    payment_status: paymentStatus,
    advance_bdt: advanceBdt,
    delivery_charge_bdt: deliveryChargeBdt,
    discount_bdt: discountBdt,
    coupon_code: couponCode,
    coupon_discount_bdt: couponDiscountBdt,
    notes,
    order_phone: orderPhone,
    order_address: orderAddress,
    updated_at: now,
  };

  const { error: updateError } = await supabase.from("orders").update(patch).eq("id", id);
  if (updateError) {
    if (updateError.code === "23505") return { ok: false, error: "This order number is already taken." };
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  // Replace items
  if (items.length > 0) {
    await supabase.from("order_items").delete().eq("order_id", id);
    const itemsWithOrder = items.map((item) => ({ ...item, order_id: id }));
    const { error: itemsError } = await supabase.from("order_items").insert(itemsWithOrder);
    if (itemsError) {
      return { ok: false, error: "Something went wrong saving the items. Please try again." };
    }
  }

  // Timeline for status change
  await supabase.from("order_timeline").insert({
    order_id: id,
    status,
    note: "Order updated",
    created_by: "System",
    created_at: now,
  });

  revalidatePath("/orders");
  revalidatePath(`/orders/${id}`);
  revalidatePath("/customers");
  revalidatePath("/analytics");
  return { ok: true };
}

export async function updateOrderStatus(
  id: string,
  status: string,
  note?: string,
): Promise<OrderActionResult> {
  if (!id?.trim()) return { ok: false, error: "Something went wrong. Please try again." };
  const s = status.trim().toLowerCase();
  if (!isOrderStatus(s)) return { ok: false, error: "Please select a valid status." };

  const now = new Date().toISOString();
  const supabase = await getSupabaseServerClient();

  const { error } = await supabase
    .from("orders")
    .update({ status: s, updated_at: now })
    .eq("id", id);

  if (error) return { ok: false, error: "Something went wrong. Please try again." };

  await supabase.from("order_timeline").insert({
    order_id: id,
    status: s,
    note: note || `Status changed to ${s}`,
    created_by: "System",
    created_at: now,
  });

  revalidatePath("/orders");
  revalidatePath(`/orders/${id}`);
  revalidatePath("/analytics");
  return { ok: true };
}

export async function deleteOrder(id: string): Promise<OrderActionResult> {
  if (!id?.trim()) return { ok: false, error: "Something went wrong. Please try again." };

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from("orders").delete().eq("id", id);

  if (error) return { ok: false, error: "Something went wrong. Please try again." };

  revalidatePath("/orders");
  revalidatePath("/analytics");
  return { ok: true };
}

export async function duplicateOrder(id: string): Promise<OrderCreateResult> {
  if (!id?.trim()) return { ok: false, error: "Something went wrong. Please try again." };

  const supabase = await getSupabaseServerClient();

  const { data: original, error: fetchError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !original) return { ok: false, error: "Order not found." };

  const { data: originalItems } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", id);

  const now = new Date();
  const dupeNumber = `${original.order_number}-COPY-${now.getTime().toString().slice(-4)}`;
  const nowIso = now.toISOString();

  const newRow: OrderInsert = {
    organization_id: original.organization_id,
    order_number: dupeNumber,
    customer_name: original.customer_name,
    customer_id: original.customer_id,
    amount_bdt: original.amount_bdt,
    status: "pending",
    payment_status: "unpaid",
    advance_bdt: 0,
    delivery_charge_bdt: original.delivery_charge_bdt,
    discount_bdt: original.discount_bdt,
    coupon_code: null,
    coupon_discount_bdt: 0,
    notes: `Duplicated from #${original.order_number}`,
    order_phone: original.order_phone,
    order_address: original.order_address,
    created_at: nowIso,
    updated_at: nowIso,
  };

  const { data: newOrder, error: insertError } = await supabase
    .from("orders")
    .insert(newRow)
    .select("id")
    .single();

  if (insertError) return { ok: false, error: "Something went wrong. Please try again." };

  if (originalItems && originalItems.length > 0) {
    const dupeItems = originalItems.map((item) => ({
      order_id: newOrder.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price_bdt: item.unit_price_bdt,
      discount_bdt: item.discount_bdt,
      line_total_bdt: item.line_total_bdt,
      product_name: item.product_name,
      product_sku: item.product_sku,
    }));
    await supabase.from("order_items").insert(dupeItems);
  }

  await supabase.from("order_timeline").insert({
    order_id: newOrder.id,
    status: "pending",
    note: `Duplicated from order #${original.order_number}`,
    created_by: "System",
    created_at: nowIso,
  });

  revalidatePath("/orders");
  revalidatePath("/analytics");
  return { ok: true, id: newOrder.id };
}

export async function bulkDeleteOrders(ids: string[]): Promise<OrderBulkActionResult> {
  if (!ids.length) return { ok: false, error: "Please select at least one order." };

  const supabase = await getSupabaseServerClient();
  const { count, error } = await supabase.from("orders").delete().in("id", ids);

  if (error) return { ok: false, error: "Something went wrong. Please try again." };

  revalidatePath("/orders");
  revalidatePath("/analytics");
  return { ok: true, count: count ?? ids.length };
}

export async function bulkUpdateOrderStatus(
  ids: string[],
  status: string,
): Promise<OrderBulkActionResult> {
  if (!ids.length) return { ok: false, error: "Please select at least one order." };
  const s = status.trim().toLowerCase();
  if (!isOrderStatus(s)) return { ok: false, error: "Please select a valid status." };

  const now = new Date().toISOString();
  const supabase = await getSupabaseServerClient();

  const { error } = await supabase
    .from("orders")
    .update({ status: s, updated_at: now })
    .in("id", ids);

  if (error) return { ok: false, error: "Something went wrong. Please try again." };

  // Add timeline entries
  const timelineEntries = ids.map((orderId) => ({
    order_id: orderId,
    status: s,
    note: `Bulk status change to ${s}`,
    created_by: "System",
    created_at: now,
  }));
  await supabase.from("order_timeline").insert(timelineEntries);

  revalidatePath("/orders");
  revalidatePath("/analytics");
  return { ok: true, count: ids.length };
}

export async function exportOrdersCsv(): Promise<OrderExportResult> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false });

  if (error) return { ok: false, error: "Something went wrong. Please try again." };
  if (!data || data.length === 0) return { ok: false, error: "No orders available to export." };

  const headers = [
    "Order #", "Customer", "Phone", "Status", "Payment Status",
    "Items", "Subtotal", "Delivery", "Discount", "Total",
    "Advance Paid", "Courier", "Tracking", "Date",
  ];

  const rows = data.map((o: any) => {
    const items = Array.isArray(o.order_items) ? o.order_items : [];
    const subtotal = items.reduce((s: number, i: any) => s + (i.line_total_bdt ?? 0), 0);
    const total = subtotal + (o.delivery_charge_bdt ?? 0) - (o.discount_bdt ?? 0) - (o.coupon_discount_bdt ?? 0);
    return [
      escapeCsv(o.order_number),
      escapeCsv(o.customer_name),
      escapeCsv(o.order_phone ?? ""),
      o.status,
      o.payment_status ?? "unpaid",
      items.length.toString(),
      subtotal.toString(),
      (o.delivery_charge_bdt ?? 0).toString(),
      ((o.discount_bdt ?? 0) + (o.coupon_discount_bdt ?? 0)).toString(),
      total.toString(),
      (o.advance_bdt ?? 0).toString(),
      escapeCsv(o.courier_name ?? ""),
      escapeCsv(o.tracking_code ?? ""),
      o.created_at,
    ].join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");
  return { ok: true, csv };
}

export async function addOrderComment(
  orderId: string,
  author: string,
  content: string,
  isInternal: boolean,
): Promise<OrderActionResult> {
  if (!orderId) return { ok: false, error: "Something went wrong. Please try again." };
  if (!content.trim()) return { ok: false, error: "Please enter a comment." };

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from("order_comments").insert({
    order_id: orderId,
    author,
    content: content.trim(),
    is_internal: isInternal,
  });

  if (error) return { ok: false, error: "Something went wrong. Please try again." };

  revalidatePath(`/orders/${orderId}`);
  return { ok: true };
}

export type CourierBookingResult =
  | { ok: true; trackingCode: string; smsStatus: string }
  | { ok: false; error: string };

export async function bookCourierParcel(
  orderId: string,
  courierName: "Steadfast" | "Pathao",
  shippingCost: number,
  weight: number,
  deliveryZone: string,
): Promise<CourierBookingResult> {
  if (!orderId) return { ok: false, error: "Something went wrong. Please try again." };

  const supabase = await getSupabaseServerClient();

  const { data: orderData, error: orderError } = await supabase
    .from("orders")
    .select("*, customer:customers(phone)")
    .eq("id", orderId)
    .single();

  if (orderError || !orderData) return { ok: false, error: "Order not found." };

  const order = orderData as any;
  if (order.status === "shipped" || order.tracking_code) {
    return { ok: false, error: "This order has already been dispatched to a courier." };
  }

  const trackingCode = `${courierName === "Steadfast" ? "STF" : "PTH"}-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("orders")
    .update({ status: "shipped", courier_name: courierName, tracking_code: trackingCode, shipping_cost_bdt: Math.round(shippingCost), updated_at: now })
    .eq("id", orderId);

  if (updateError) return { ok: false, error: "Something went wrong. Please try again." };

  await supabase.from("order_timeline").insert({
    order_id: orderId,
    status: "shipped",
    note: `Booked via ${courierName} courier. Tracking: ${trackingCode}`,
    created_by: "System",
    created_at: now,
  });

  const customerPhone = orderData.order_phone || order.customer?.phone || "";
  let smsStatus = "No phone available";
  if (customerPhone) {
    const smsMessage = `Your order ${orderData.order_number} has been shipped via ${courierName}. Tracking: ${trackingCode}`;
    const smsResult = await sendOrderSms(customerPhone, smsMessage);
    smsStatus = smsResult.ok ? `SMS sent to ${customerPhone}` : "SMS failed";
  }

  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  return { ok: true, trackingCode, smsStatus };
}

async function sendOrderSms(phone: string, text: string): Promise<{ ok: boolean }> {
  console.log(`--- SMS --- TO: ${phone}, MSG: ${text}`);
  return { ok: true };
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
