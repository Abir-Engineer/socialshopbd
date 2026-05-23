"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

export type CheckoutResult = { ok: true; orderNumber: string } | { ok: false; error: string };

export async function submitCheckoutOrder(formData: FormData): Promise<CheckoutResult> {
  const shopSlug = String(formData.get("shop_slug") ?? "").trim();
  const customerName = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const productId = String(formData.get("product_id") ?? "").trim();
  const quantity = Number(formData.get("quantity") ?? 1);

  if (!shopSlug) return { ok: false, error: "Invalid shop slug." };
  if (!customerName) return { ok: false, error: "Full name is required." };
  if (!phone) return { ok: false, error: "Phone number is required." };
  if (!address) return { ok: false, error: "Shipping address is required." };
  if (!productId) return { ok: false, error: "Please select a product." };
  if (Number.isNaN(quantity) || quantity <= 0) return { ok: false, error: "Quantity must be greater than 0." };

  const supabase = await getSupabaseServerClient();

  // 1. Fetch shop owner info
  const { data: shop, error: shopError } = await supabase
    .from("shops")
    .select("user_id, shop_name")
    .eq("slug", shopSlug)
    .single();

  if (shopError || !shop) {
    return { ok: false, error: "Shop not found." };
  }

  const shopOwnerId = shop.user_id;

  // 2. Fetch product info & check stock
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, name, price_bdt, stock")
    .eq("id", productId)
    .eq("user_id", shopOwnerId)
    .single();

  if (productError || !product) {
    return { ok: false, error: "Product not found." };
  }

  if (product.stock < quantity) {
    return { ok: false, error: `Sorry, only ${product.stock} units of ${product.name} are in stock.` };
  }

  // 3. Find or Create Customer under this Shop Owner
  let customerId = "";
  const { data: existingCustomer } = await supabase
    .from("customers")
    .select("id")
    .eq("phone", phone)
    .eq("user_id", shopOwnerId)
    .maybeSingle();

  if (existingCustomer) {
    customerId = existingCustomer.id;
  } else {
    const { data: newCustomer, error: insertCustError } = await supabase
      .from("customers")
      .insert({
        user_id: shopOwnerId,
        name: customerName,
        phone,
        email: email || null,
        notes: `Auto-created via checkout. Address: ${address}`,
      })
      .select("id")
      .single();

    if (insertCustError || !newCustomer) {
      return { ok: false, error: "Failed to process customer profile: " + insertCustError?.message };
    }
    customerId = newCustomer.id;
  }

  // 4. Create Order
  const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
  const totalAmount = product.price_bdt * quantity;

  const { data: newOrder, error: insertOrderError } = await supabase
    .from("orders")
    .insert({
      user_id: shopOwnerId,
      order_number: orderNumber,
      customer_name: customerName,
      customer_id: customerId,
      amount_bdt: totalAmount,
      status: "pending",
    })
    .select("id")
    .single();

  if (insertOrderError || !newOrder) {
    return { ok: false, error: "Failed to place order: " + insertOrderError?.message };
  }

  // 5. Add Order Item
  const { error: insertItemError } = await supabase
    .from("order_items")
    .insert({
      order_id: newOrder.id,
      product_id: product.id,
      quantity,
      line_total_bdt: totalAmount,
    });

  if (insertItemError) {
    return { ok: false, error: "Failed to associate products to order." };
  }

  // 6. Deduct stock
  const { error: stockError } = await supabase
    .from("products")
    .update({ stock: product.stock - quantity })
    .eq("id", product.id);

  if (stockError) {
    // Keep going but log it - stock tracking is soft
    console.error("Failed to update stock:", stockError.message);
  }

  return { ok: true, orderNumber };
}
