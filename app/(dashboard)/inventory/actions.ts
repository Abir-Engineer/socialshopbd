"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requireOrgId } from "@/lib/auth/organization";

export type InventoryActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function updateStock(
  productId: string,
  newStock: number,
): Promise<InventoryActionResult> {
  if (!productId?.trim()) {
    return { ok: false, error: "Missing product id." };
  }

  if (!Number.isFinite(newStock) || newStock < 0) {
    return { ok: false, error: "Stock must be a whole number zero or greater." };
  }

  let organizationId: string;
  try {
    organizationId = await requireOrgId();
  } catch {
    return { ok: false, error: "Unauthorized. Your workspace could not be found." };
  }

  const supabase = await getSupabaseServerClient();

  const { error } = await supabase
    .from("products")
    .update({ stock: newStock, updated_at: new Date().toISOString() })
    .eq("id", productId)
    .eq("organization_id", organizationId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/inventory");
  revalidatePath("/products");
  revalidatePath("/analytics");
  return { ok: true };
}
