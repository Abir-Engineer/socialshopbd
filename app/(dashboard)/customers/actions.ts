"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requireOrgId } from "@/lib/auth/organization";
import type { Database } from "@/types/supabase";

type CustomerInsert = Database["public"]["Tables"]["customers"]["Insert"];
type CustomerUpdate = Database["public"]["Tables"]["customers"]["Update"];

export type CustomerActionResult = { ok: true } | { ok: false; error: string };
export type CustomerBulkActionResult = { ok: true; count: number } | { ok: false; error: string };
export type CustomerExportResult = { ok: true; csv: string } | { ok: false; error: string };

function safeString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  return "";
}

function safeNullable(value: unknown): string | null {
  const s = safeString(value);
  return s || null;
}

export async function createCustomer(formData: FormData): Promise<CustomerActionResult> {
  const name = safeString(formData.get("name"));
  const phone = safeString(formData.get("phone"));

  if (!name) return { ok: false, error: "Name is required." };
  if (!phone) return { ok: false, error: "Phone is required." };

  let organizationId: string;
  try {
    organizationId = await requireOrgId();
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }

  const supabase = await getSupabaseServerClient();

  const tagsRaw = formData.get("tags");
  let tags: string[] = [];
  if (typeof tagsRaw === "string") {
    try { tags = JSON.parse(tagsRaw); } catch { tags = []; }
  }

  const addressesRaw = formData.get("addresses");
  let addresses: any[] = [];
  if (typeof addressesRaw === "string") {
    try { addresses = JSON.parse(addressesRaw); } catch { addresses = []; }
  }

  const phonesRaw = formData.get("phones");
  let phones: any[] = [];
  if (typeof phonesRaw === "string") {
    try { phones = JSON.parse(phonesRaw); } catch { phones = []; }
  }

  const row: CustomerInsert = {
    organization_id: organizationId,
    name,
    phone,
    email: safeNullable(formData.get("email")),
    business_name: safeString(formData.get("business_name")),
    notes: safeString(formData.get("notes")),
    avatar_url: safeNullable(formData.get("avatar_url")),
    tags,
    addresses,
    phones,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("customers").insert(row);

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "That phone number is already in use." };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/customers");
  revalidatePath("/analytics");
  return { ok: true };
}

export async function updateCustomer(formData: FormData): Promise<CustomerActionResult> {
  const id = safeString(formData.get("id"));
  if (!id) return { ok: false, error: "Missing customer id." };

  const name = safeString(formData.get("name"));
  const phone = safeString(formData.get("phone"));

  if (!name) return { ok: false, error: "Name is required." };
  if (!phone) return { ok: false, error: "Phone is required." };

  const patch: CustomerUpdate = {
    name,
    phone,
    email: safeNullable(formData.get("email")),
    business_name: safeString(formData.get("business_name")),
    notes: safeString(formData.get("notes")),
    avatar_url: safeNullable(formData.get("avatar_url")),
    updated_at: new Date().toISOString(),
  };

  const tagsRaw = formData.get("tags");
  if (typeof tagsRaw === "string") {
    try { patch.tags = JSON.parse(tagsRaw); } catch { patch.tags = []; }
  }

  const addressesRaw = formData.get("addresses");
  if (typeof addressesRaw === "string") {
    try { patch.addresses = JSON.parse(addressesRaw); } catch { patch.addresses = []; }
  }

  const phonesRaw = formData.get("phones");
  if (typeof phonesRaw === "string") {
    try { patch.phones = JSON.parse(phonesRaw); } catch { patch.phones = []; }
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from("customers").update(patch).eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "That phone number is already in use." };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
  revalidatePath("/analytics");
  return { ok: true };
}

export async function deleteCustomer(id: string): Promise<CustomerActionResult> {
  if (!id?.trim()) return { ok: false, error: "Missing customer id." };

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from("customers").delete().eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/customers");
  revalidatePath("/analytics");
  return { ok: true };
}

export async function bulkDeleteCustomers(ids: string[]): Promise<CustomerBulkActionResult> {
  if (!ids.length) return { ok: false, error: "No customers selected." };

  const supabase = await getSupabaseServerClient();
  const { error, count } = await supabase.from("customers").delete().in("id", ids);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/customers");
  revalidatePath("/analytics");
  return { ok: true, count: count ?? ids.length };
}

export async function exportCustomersCsv(): Promise<CustomerExportResult> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return { ok: false, error: error.message };
  }

  if (!data || data.length === 0) {
    return { ok: false, error: "No customers to export." };
  }

  const headers = [
    "Name", "Phone", "Email", "Business Name", "Tags", "Notes",
    "Avatar URL", "Order Count", "Total Spent (BDT)",
  ];

  const rows = data.map((c) => {
    const tags = Array.isArray(c.tags) ? (c.tags as string[]).join("; ") : "";
    const phones = Array.isArray(c.phones) ? (c.phones as any[]).map((p: any) => p.number).join("; ") : c.phone;
    return [
      escapeCsv(c.name),
      escapeCsv(phones),
      escapeCsv(c.email ?? ""),
      escapeCsv(c.business_name ?? ""),
      escapeCsv(tags),
      escapeCsv(c.notes ?? ""),
      escapeCsv(c.avatar_url ?? ""),
      0, // order count — would need a separate query for accurate count
      0, // total spent
    ].join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");
  return { ok: true, csv };
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
