"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requireOrgId } from "@/lib/auth/organization";
import type { Database } from "@/types/supabase";

type CustomerInsert = Database["public"]["Tables"]["customers"]["Insert"];
type CustomerUpdate = Database["public"]["Tables"]["customers"]["Update"];

export type CustomerActionResult = { ok: true } | { ok: false; error: string };

export async function createCustomer(formData: FormData): Promise<CustomerActionResult> {
  const fullName = String(formData.get("name")  ?? "").trim();
  const phone    = String(formData.get("phone") ?? "").trim();
  const emailRaw = String(formData.get("email") ?? "").trim();
  const notes    = String(formData.get("notes") ?? "").trim();

  if (!fullName) return { ok: false, error: "Full name is required." };
  if (!phone)    return { ok: false, error: "Phone is required." };

  let organizationId: string;
  try {
    organizationId = await requireOrgId();
  } catch {
    return { ok: false, error: "Unauthorized. Your workspace could not be found." };
  }

  const supabase = await getSupabaseServerClient();

  const row: CustomerInsert = {
    organization_id: organizationId,
    name:       fullName,
    phone,
    email:      emailRaw || null,
    notes,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("customers").insert(row);

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "A customer with this phone number already exists." };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/customers");
  revalidatePath("/orders");
  return { ok: true };
}

export async function updateCustomer(formData: FormData): Promise<CustomerActionResult> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { ok: false, error: "Missing customer id." };

  const fullName = String(formData.get("name")  ?? "").trim();
  const phone    = String(formData.get("phone") ?? "").trim();
  const emailRaw = String(formData.get("email") ?? "").trim();
  const notes    = String(formData.get("notes") ?? "").trim();

  if (!fullName) return { ok: false, error: "Full name is required." };
  if (!phone)    return { ok: false, error: "Phone is required." };

  const patch: CustomerUpdate = {
    name:       fullName,
    phone,
    email:      emailRaw || null,
    notes,
    updated_at: new Date().toISOString(),
  };

  const supabase = await getSupabaseServerClient();
  // RLS automatically restricts update to current org's customers
  const { error } = await supabase.from("customers").update(patch).eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "A customer with this phone number already exists." };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/customers");
  revalidatePath("/orders");
  return { ok: true };
}
