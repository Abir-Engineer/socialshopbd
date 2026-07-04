"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requireOrgId } from "@/lib/auth/organization";
import type { Database } from "@/types/supabase";

type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];
type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];

export type ProductActionResult =
  | { ok: true }
  | { ok: false; error: string };

export type ProductBulkActionResult =
  | { ok: true; count: number }
  | { ok: false; error: string };

export type ProductExportResult =
  | { ok: true; csv: string }
  | { ok: false; error: string };

function parsePositiveInt(
  value: unknown,
  label: string,
): { ok: true; n: number } | { ok: false; error: string } {
  const raw = typeof value === "string" ? value.trim() : String(value ?? "");
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0) {
    return { ok: false, error: `${label} must be zero or a positive whole number.` };
  }
  return { ok: true, n };
}

function safeString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  return "";
}

function safeNullable(value: unknown): string | null {
  const s = safeString(value);
  return s || null;
}

async function validateOrg(): Promise<string> {
  try {
    return await requireOrgId();
  } catch {
    throw new Error("You don't have permission to perform this action.");
  }
}

export async function createProduct(formData: FormData): Promise<ProductActionResult> {
  const name = safeString(formData.get("name"));
  const sku = safeString(formData.get("sku")).toUpperCase();

  if (!name) return { ok: false, error: "Name is required." };
  if (!sku) return { ok: false, error: "SKU is required." };

  const stockParsed = parsePositiveInt(formData.get("stock"), "Stock");
  if (!stockParsed.ok) return stockParsed;

  const priceParsed = parsePositiveInt(formData.get("price_bdt"), "Price (BDT)");
  if (!priceParsed.ok) return priceParsed;

  const costParsed = parsePositiveInt(formData.get("cost_price_bdt"), "Cost Price (BDT)");
  if (!costParsed.ok) return costParsed;

  let organizationId: string;
  try {
    organizationId = await validateOrg();
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }

  const supabase = await getSupabaseServerClient();

  const row: ProductInsert = {
    organization_id: organizationId,
    name,
    sku,
    stock: stockParsed.n,
    price_bdt: priceParsed.n,
    cost_price_bdt: costParsed.n,
    barcode: safeNullable(formData.get("barcode")),
    brand: safeNullable(formData.get("brand")),
    category: safeNullable(formData.get("category")),
    color: safeNullable(formData.get("color")),
    size: safeNullable(formData.get("size")),
    image_url: safeNullable(formData.get("image_url")),
    updated_at: new Date().toISOString(),
  };

  const imagesRaw = formData.get("images");
  if (typeof imagesRaw === "string") {
    try {
      row.images = JSON.parse(imagesRaw);
    } catch {
      row.images = [];
    }
  }

  const variantsRaw = formData.get("variants");
  if (typeof variantsRaw === "string") {
    try {
      row.variants = JSON.parse(variantsRaw);
    } catch {
      row.variants = [];
    }
  }

  const { error } = await supabase.from("products").insert(row);

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "This SKU is already in use. Please choose another." };
    }
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  revalidatePath("/products");
  revalidatePath("/analytics");
  revalidatePath("/inventory");
  return { ok: true };
}

export async function updateProduct(formData: FormData): Promise<ProductActionResult> {
  const id = safeString(formData.get("id"));
  if (!id) return { ok: false, error: "Something went wrong. Please try again." };

  const name = safeString(formData.get("name"));
  const sku = safeString(formData.get("sku")).toUpperCase();

  if (!name) return { ok: false, error: "Please enter a product name." };
  if (!sku) return { ok: false, error: "Please enter a SKU." };

  const stockParsed = parsePositiveInt(formData.get("stock"), "Stock");
  if (!stockParsed.ok) return stockParsed;

  const priceParsed = parsePositiveInt(formData.get("price_bdt"), "Price (BDT)");
  if (!priceParsed.ok) return priceParsed;

  const costParsed = parsePositiveInt(formData.get("cost_price_bdt"), "Cost Price (BDT)");
  if (!costParsed.ok) return costParsed;

  const patch: ProductUpdate = {
    name,
    sku,
    stock: stockParsed.n,
    price_bdt: priceParsed.n,
    cost_price_bdt: costParsed.n,
    barcode: safeNullable(formData.get("barcode")),
    brand: safeNullable(formData.get("brand")),
    category: safeNullable(formData.get("category")),
    color: safeNullable(formData.get("color")),
    size: safeNullable(formData.get("size")),
    image_url: safeNullable(formData.get("image_url")),
    updated_at: new Date().toISOString(),
  };

  const imagesRaw = formData.get("images");
  if (typeof imagesRaw === "string") {
    try {
      patch.images = JSON.parse(imagesRaw);
    } catch {
      patch.images = [];
    }
  }

  const variantsRaw = formData.get("variants");
  if (typeof variantsRaw === "string") {
    try {
      patch.variants = JSON.parse(variantsRaw);
    } catch {
      patch.variants = [];
    }
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from("products").update(patch).eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "This SKU is already in use. Please choose another." };
    }
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  revalidatePath("/products");
  revalidatePath("/analytics");
  revalidatePath("/inventory");
  return { ok: true };
}

export async function deleteProduct(id: string): Promise<ProductActionResult> {
  if (!id?.trim()) return { ok: false, error: "Something went wrong. Please try again." };

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) {
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  revalidatePath("/products");
  revalidatePath("/analytics");
  revalidatePath("/inventory");
  return { ok: true };
}

export async function bulkDeleteProducts(ids: string[]): Promise<ProductBulkActionResult> {
  if (!ids.length) return { ok: false, error: "Please select at least one product." };

  const supabase = await getSupabaseServerClient();
  const { error, count } = await supabase
    .from("products")
    .delete()
    .in("id", ids);

  if (error) {
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  revalidatePath("/products");
  revalidatePath("/analytics");
  revalidatePath("/inventory");
  return { ok: true, count: count ?? ids.length };
}

export async function bulkUpdateProducts(
  ids: string[],
  updates: { category?: string; brand?: string; stock?: number; price_bdt?: number },
): Promise<ProductBulkActionResult> {
  if (!ids.length) return { ok: false, error: "Please select at least one product." };

  const patch: ProductUpdate = {
    updated_at: new Date().toISOString(),
  };
  if (updates.category !== undefined) patch.category = updates.category || null;
  if (updates.brand !== undefined) patch.brand = updates.brand || null;
  if (updates.stock !== undefined) patch.stock = updates.stock;
  if (updates.price_bdt !== undefined) patch.price_bdt = updates.price_bdt;

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from("products").update(patch).in("id", ids);

  if (error) {
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  revalidatePath("/products");
  revalidatePath("/analytics");
  revalidatePath("/inventory");
  return { ok: true, count: ids.length };
}

export async function exportProductsCsv(): Promise<ProductExportResult> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  if (!data || data.length === 0) {
    return { ok: false, error: "No products available to export." };
  }

  const headers = [
    "Name",
    "SKU",
    "Barcode",
    "Brand",
    "Category",
    "Color",
    "Size",
    "Stock",
    "Price (BDT)",
    "Cost Price (BDT)",
    "Image URL",
  ];

  const rows = data.map((p) =>
    [
      escapeCsvField(p.name),
      escapeCsvField(p.sku),
      escapeCsvField(p.barcode ?? ""),
      escapeCsvField(p.brand ?? ""),
      escapeCsvField(p.category ?? ""),
      escapeCsvField(p.color ?? ""),
      escapeCsvField(p.size ?? ""),
      p.stock.toString(),
      p.price_bdt.toString(),
      p.cost_price_bdt.toString(),
      escapeCsvField(p.image_url ?? ""),
    ].join(","),
  );

  const csv = [headers.join(","), ...rows].join("\n");
  return { ok: true, csv };
}

export async function importProductsCsv(csvContent: string): Promise<ProductBulkActionResult> {
  let organizationId: string;
  try {
    organizationId = await validateOrg();
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }

  const lines = csvContent
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    return { ok: false, error: "CSV file must have a header row and at least one data row." };
  }

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const nameIdx = headers.indexOf("name");
  const skuIdx = headers.indexOf("sku");
  const barcodeIdx = headers.indexOf("barcode");
  const brandIdx = headers.indexOf("brand");
  const categoryIdx = headers.indexOf("category");
  const colorIdx = headers.indexOf("color");
  const sizeIdx = headers.indexOf("size");
  const stockIdx = headers.indexOf("stock");
  const priceIdx = headers.indexOf("price (bdt)");
  const costIdx = headers.indexOf("cost price (bdt)");
  const imageIdx = headers.indexOf("image url");

  if (nameIdx === -1 || skuIdx === -1) {
    return { ok: false, error: "CSV file must include 'Name' and 'SKU' columns." };
  }

  const supabase = await getSupabaseServerClient();
  let imported = 0;
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);

    const name = (cols[nameIdx] ?? "").trim();
    const sku = (cols[skuIdx] ?? "").trim().toUpperCase();

    if (!name || !sku) {
      errors.push(`Row ${i}: missing name or SKU.`);
      continue;
    }

    const row: ProductInsert = {
      organization_id: organizationId,
      name,
      sku,
      stock: Number.parseInt(cols[stockIdx] ?? "0", 10) || 0,
      price_bdt: Number.parseInt(cols[priceIdx] ?? "0", 10) || 0,
      cost_price_bdt: Number.parseInt(cols[costIdx] ?? "0", 10) || 0,
      barcode: cols[barcodeIdx]?.trim() || null,
      brand: cols[brandIdx]?.trim() || null,
      category: cols[categoryIdx]?.trim() || null,
      color: cols[colorIdx]?.trim() || null,
      size: cols[sizeIdx]?.trim() || null,
      image_url: cols[imageIdx]?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("products").insert(row);
    if (error) {
      if (error.code === "23505") {
        errors.push(`Row ${i}: SKU "${sku}" already exists.`);
      } else {
        errors.push(`Row ${i}: something went wrong.`);
      }
    } else {
      imported++;
    }
  }

  revalidatePath("/products");
  revalidatePath("/analytics");
  revalidatePath("/inventory");

  if (errors.length > 0 && imported === 0) {
    return { ok: false, error: `Import failed: ${errors[0].replace(/\.$/, "")}. Please review your CSV file.` };
  }

  return { ok: true, count: imported };
}

function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
