"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";
import { ORDER_STATUSES, type OrderStatus } from "@/types/orders";

type OrderInsert = Database["public"]["Tables"]["orders"]["Insert"];
type OrderUpdate = Database["public"]["Tables"]["orders"]["Update"];

export type OrderActionResult = { ok: true } | { ok: false; error: string };

function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

function parseAmount(value: unknown): { ok: true; n: number } | { ok: false; error: string } {
  const raw = typeof value === "string" ? value.trim() : String(value ?? "");
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0) {
    return { ok: false, error: "Amount must be a whole number zero or greater (BDT)." };
  }
  return { ok: true, n };
}

export async function createOrder(formData: FormData): Promise<OrderActionResult> {
  const orderNumber = String(formData.get("order_number") ?? "").trim();
  const customerName = String(formData.get("customer_name") ?? "").trim();
  const statusRaw = String(formData.get("status") ?? "pending").trim().toLowerCase();

  if (!orderNumber) return { ok: false, error: "Order number is required." };
  if (!customerName) return { ok: false, error: "Customer name is required." };
  if (!isOrderStatus(statusRaw)) return { ok: false, error: "Invalid status." };

  const amountParsed = parseAmount(formData.get("amount_bdt"));
  if (!amountParsed.ok) return amountParsed;

  const row: OrderInsert = {
    order_number: orderNumber,
    customer_name: customerName,
    amount_bdt: amountParsed.n,
    status: statusRaw,
    updated_at: new Date().toISOString(),
  };

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from("orders").insert(row);

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "That order number is already in use." };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/orders");
  return { ok: true };
}

export async function updateOrder(formData: FormData): Promise<OrderActionResult> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { ok: false, error: "Missing order id." };

  const orderNumber = String(formData.get("order_number") ?? "").trim();
  const customerName = String(formData.get("customer_name") ?? "").trim();
  const statusRaw = String(formData.get("status") ?? "").trim().toLowerCase();

  if (!orderNumber) return { ok: false, error: "Order number is required." };
  if (!customerName) return { ok: false, error: "Customer name is required." };
  if (!isOrderStatus(statusRaw)) return { ok: false, error: "Invalid status." };

  const amountParsed = parseAmount(formData.get("amount_bdt"));
  if (!amountParsed.ok) return amountParsed;

  const patch: OrderUpdate = {
    order_number: orderNumber,
    customer_name: customerName,
    amount_bdt: amountParsed.n,
    status: statusRaw,
    updated_at: new Date().toISOString(),
  };

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from("orders").update(patch).eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "That order number is already in use." };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/orders");
  return { ok: true };
}

export async function updateOrderStatus(id: string, status: string): Promise<OrderActionResult> {
  if (!id?.trim()) return { ok: false, error: "Missing order id." };
  const s = status.trim().toLowerCase();
  if (!isOrderStatus(s)) return { ok: false, error: "Invalid status." };

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from("orders")
    .update({ status: s, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/orders");
  return { ok: true };
}

export async function deleteOrder(id: string): Promise<OrderActionResult> {
  if (!id?.trim()) return { ok: false, error: "Missing order id." };

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from("orders").delete().eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/orders");
  return { ok: true };
}
