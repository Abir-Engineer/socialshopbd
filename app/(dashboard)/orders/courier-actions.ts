"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type CourierBookingResult = { ok: true; trackingCode: string; smsStatus: string } | { ok: false; error: string };

// Helper to simulate SMS Gateways in Bangladesh (e.g. Greenweb SMS, BulksmsBD)
export async function sendOrderSMS(phone: string, text: string): Promise<{ ok: boolean; status: string }> {
  console.log(`\n--- [SMS GATEWAY SIMULATION] ---`);
  console.log(`TO: ${phone}`);
  console.log(`MESSAGE: ${text}`);
  console.log(`STATUS: SUCCESS (DELIVERED via SocialShop BD gateway)`);
  console.log(`--------------------------------\n`);

  return { ok: true, status: "Sent successfully via GP/Robi gateway" };
}

export async function bookCourierParcel(
  orderId: string,
  courierName: "Steadfast" | "Pathao",
  shippingCost: number,
  weight: number,
  deliveryZone: string
): Promise<CourierBookingResult> {
  if (!orderId) return { ok: false, error: "Missing order ID." };
  if (!courierName) return { ok: false, error: "Missing courier selection." };

  const supabase = await getSupabaseServerClient();

  // 1. Fetch order details along with customer phone
  const { data: orderData, error: orderError } = await supabase
    .from("orders")
    .select("*, customer:customers(phone)")
    .eq("id", orderId)
    .single();

  if (orderError || !orderData) {
    return { ok: false, error: "Order not found." };
  }

  const order = orderData as any;

  if (order.status === "shipped" || order.tracking_code) {
    return { ok: false, error: "This order has already been booked to courier." };
  }

  // 2. Generate Tracking Code based on Courier API simulation
  let trackingCode = "";
  if (courierName === "Steadfast") {
    trackingCode = `STF-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
  } else {
    trackingCode = `PTH-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  // 3. Update Order status, courier_name, tracking_code in DB
  const { error: updateError } = await supabase
    .from("orders")
    .update({
      status: "shipped",
      courier_name: courierName,
      tracking_code: trackingCode,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (updateError) {
    return { ok: false, error: "Failed to update order courier status: " + updateError.message };
  }

  // 4. Send SMS to Customer
  const customerPhone = (order.customer as any)?.phone || "";
  let smsStatus = "No customer phone number available";

  if (customerPhone) {
    const smsMessage = `Dear ${order.customer_name}, your order ${order.order_number} has been shipped via ${courierName} Courier. Tracking code: ${trackingCode}. Thanks for shopping!`;
    const smsResult = await sendOrderSMS(customerPhone, smsMessage);
    if (smsResult.ok) {
      smsStatus = `SMS notification delivered to ${customerPhone}`;
    }
  }

  revalidatePath("/orders");
  return { ok: true, trackingCode, smsStatus };
}
