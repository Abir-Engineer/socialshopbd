"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

type CustomerInsert = Database["public"]["Tables"]["customers"]["Insert"];
type CustomerUpdate = Database["public"]["Tables"]["customers"]["Update"];

export type CustomerActionResult = { ok: true } | { ok: false; error: string };

export async function createCustomer(formData: FormData): Promise<CustomerActionResult> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const emailRaw = String(formData.get("email") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!fullName) return { ok: false, error: "Full name is required." };
  if (!phone) return { ok: false, error: "Phone is required." };

  const row: CustomerInsert = {
    full_name: fullName,
    phone,
    email: emailRaw ? emailRaw : null,
    notes,
    updated_at: new Date().toISOString(),
  };

  const supabase = await getSupabaseServerClient();
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

  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const emailRaw = String(formData.get("email") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!fullName) return { ok: false, error: "Full name is required." };
  if (!phone) return { ok: false, error: "Phone is required." };

  const patch: CustomerUpdate = {
    full_name: fullName,
    phone,
    email: emailRaw ? emailRaw : null,
    notes,
    updated_at: new Date().toISOString(),
  };

  const supabase = await getSupabaseServerClient();
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
