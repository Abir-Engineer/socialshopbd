"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];
type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];

export type ProductActionResult =
  | { ok: true }
  | { ok: false; error: string };

function parsePositiveInt(value: unknown, label: string): { ok: true; n: number } | { ok: false; error: string } {
  const raw = typeof value === "string" ? value.trim() : String(value ?? "");
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0) {
    return { ok: false, error: `${label} must be a whole number zero or greater.` };
  }
  return { ok: true, n };
}

export async function createProduct(formData: FormData): Promise<ProductActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  const sku = String(formData.get("sku") ?? "").trim().toUpperCase();

  if (!name) return { ok: false, error: "Name is required." };
  if (!sku) return { ok: false, error: "SKU is required." };

  const stockParsed = parsePositiveInt(formData.get("stock"), "Stock");
  if (!stockParsed.ok) return stockParsed;

  const priceParsed = parsePositiveInt(formData.get("price_bdt"), "Price (BDT)");
  if (!priceParsed.ok) return priceParsed;

  const row: ProductInsert = {
    name,
    sku,
    stock: stockParsed.n,
    price_bdt: priceParsed.n,
    updated_at: new Date().toISOString(),
  };

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from("products").insert(row);

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "That SKU is already in use. Choose another SKU." };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/products");
  return { ok: true };
}

export async function updateProduct(formData: FormData): Promise<ProductActionResult> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { ok: false, error: "Missing product id." };

  const name = String(formData.get("name") ?? "").trim();
  const sku = String(formData.get("sku") ?? "").trim().toUpperCase();

  if (!name) return { ok: false, error: "Name is required." };
  if (!sku) return { ok: false, error: "SKU is required." };

  const stockParsed = parsePositiveInt(formData.get("stock"), "Stock");
  if (!stockParsed.ok) return stockParsed;

  const priceParsed = parsePositiveInt(formData.get("price_bdt"), "Price (BDT)");
  if (!priceParsed.ok) return priceParsed;

  const patch: ProductUpdate = {
    name,
    sku,
    stock: stockParsed.n,
    price_bdt: priceParsed.n,
    updated_at: new Date().toISOString(),
  };

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from("products").update(patch).eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "That SKU is already in use. Choose another SKU." };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/products");
  return { ok: true };
}

export async function deleteProduct(id: string): Promise<ProductActionResult> {
  if (!id?.trim()) return { ok: false, error: "Missing product id." };

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/products");
  return { ok: true };
}
