import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import type { PaymentRecord, Coupon, CouponValidationResult, BillingInvoice, SubscriptionEvent } from "@/types/billing";
import type { OrgPlan } from "@/types/organization";

export async function fetchPaymentHistory(
  supabase: SupabaseClient<Database>,
  orgId: string,
): Promise<PaymentRecord[]> {
  const { data } = await supabase
    .from("payment_history")
    .select("*")
    .eq("organization_id", orgId)
    .order("paid_at", { ascending: false })
    .limit(50);

  return (data ?? []) as PaymentRecord[];
}

export async function fetchInvoices(
  supabase: SupabaseClient<Database>,
  orgId: string,
): Promise<BillingInvoice[]> {
  const { data } = await supabase
    .from("payment_history")
    .select("invoice_number, plan, amount_bdt, status, period_start, period_end, paid_at, invoice_pdf_url")
    .eq("organization_id", orgId)
    .not("invoice_number", "is", null)
    .order("paid_at", { ascending: false })
    .limit(50);

  return ((data ?? []) as any[]).map((r) => ({
    invoiceNumber: r.invoice_number ?? "",
    plan: r.plan,
    amountBdt: r.amount_bdt,
    status: r.status,
    periodStart: r.period_start,
    periodEnd: r.period_end,
    paidAt: r.paid_at,
    invoicePdfUrl: r.invoice_pdf_url,
  }));
}

export async function fetchSubscriptionHistory(
  supabase: SupabaseClient<Database>,
  orgId: string,
): Promise<SubscriptionEvent[]> {
  const { data } = await supabase
    .from("organization_subscriptions")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(50);

  return ((data ?? []) as any[]).map((r) => ({
    id: r.id,
    plan: r.plan,
    status: r.status,
    paymentProvider: r.payment_provider ?? "none",
    amountBdt: r.amount_bdt,
    periodStart: r.current_period_start,
    periodEnd: r.current_period_end,
    createdAt: r.created_at,
  }));
}

export async function validateCoupon(
  supabase: SupabaseClient<Database>,
  code: string,
  plan: string,
  orgId: string,
): Promise<CouponValidationResult> {
  const { data: globalCoupons } = await supabase
    .from("coupons")
    .select("*")
    .is("organization_id", null)
    .eq("code", code.toUpperCase())
    .eq("is_active", true);

  const { data: orgCoupons } = await supabase
    .from("coupons")
    .select("*")
    .eq("organization_id", orgId)
    .eq("code", code.toUpperCase())
    .eq("is_active", true);

  const allCoupons = [...(globalCoupons ?? []), ...(orgCoupons ?? [])] as Coupon[];

  if (allCoupons.length === 0) {
    return { valid: false, error: "This coupon code is invalid or has expired." };
  }

  const coupon = allCoupons[0];

  if (coupon.current_uses >= coupon.max_uses) {
    return { valid: false, error: "This coupon has reached its usage limit and is no longer available." };
  }

  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return { valid: false, error: "This coupon code has expired." };
  }

  if (coupon.min_plan) {
    const planOrder: Record<string, number> = { free: 0, free_trial: 0, pro: 1, enterprise: 2 };
    const minRank = planOrder[coupon.min_plan] ?? 0;
    const planRank = planOrder[plan] ?? 0;
    if (planRank < minRank) {
      return { valid: false, error: `This coupon requires a ${coupon.min_plan} plan or higher.` };
    }
  }

  const planPrices: Record<string, number> = { free: 0, free_trial: 0, pro: 999, enterprise: 4500 };
  const basePrice = planPrices[plan] ?? 999;

  let discountAmount: number;
  if (coupon.type === "percentage") {
    discountAmount = Math.round((basePrice * coupon.value) / 100);
  } else {
    discountAmount = Math.min(coupon.value, basePrice);
  }

  return { valid: true, coupon, discountAmount: Math.max(0, discountAmount) };
}

export async function fetchOrgCoupons(
  supabase: SupabaseClient<Database>,
  orgId: string,
): Promise<Coupon[]> {
  const { data: global } = await supabase
    .from("coupons")
    .select("*")
    .is("organization_id", null)
    .eq("is_active", true);

  const { data: org } = await supabase
    .from("coupons")
    .select("*")
    .eq("organization_id", orgId)
    .eq("is_active", true);

  return [...(global ?? []), ...(org ?? [])] as Coupon[];
}

export function generateInvoiceHtml(invoice: BillingInvoice, orgName: string): string {
  const statusColors: Record<string, string> = {
    succeeded: "#10b981",
    failed: "#ef4444",
    refunded: "#f59e0b",
    pending: "#6b7280",
  };

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Invoice ${invoice.invoiceNumber}</title>
<style>
  body { font-family: Arial, sans-serif; padding: 40px; color: #222; }
  .header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 32px; }
  .invoice-title { font-size: 24px; font-weight: 700; color: #111; }
  .status { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; color: white; }
  table { width: 100%; border-collapse: collapse; margin-top: 24px; }
  th { background: #f9fafb; padding: 10px 16px; border: 1px solid #e5e7eb; text-align: left; font-size: 13px; }
  td { padding: 10px 16px; border: 1px solid #e5e7eb; font-size: 13px; }
  .total { font-size: 18px; font-weight: 700; text-align: right; margin-top: 16px; }
  .footer { margin-top: 32px; font-size: 12px; color: #9ca3af; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 16px; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="invoice-title">Invoice</h1>
      <p style="color:#6b7280;font-size:14px;margin-top:4px">${orgName}</p>
    </div>
    <div style="text-align:right">
      <p style="font-size:14px;font-weight:600">${invoice.invoiceNumber}</p>
      <p style="color:#6b7280;font-size:13px">${invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString("en-BD", { day: "numeric", month: "long", year: "numeric" }) : "—"}</p>
      <span class="status" style="background:${statusColors[invoice.status] ?? "#6b7280"}">${invoice.status}</span>
    </div>
  </div>

  <table>
    <thead><tr><th>Description</th><th>Period</th><th>Amount</th></tr></thead>
    <tbody>
      <tr>
        <td>${invoice.plan.charAt(0).toUpperCase() + invoice.plan.slice(1)} Plan</td>
        <td>${invoice.periodStart ? new Date(invoice.periodStart).toLocaleDateString("en-BD") : "—"} — ${invoice.periodEnd ? new Date(invoice.periodEnd).toLocaleDateString("en-BD") : "—"}</td>
        <td style="text-align:right;font-weight:600">৳${invoice.amountBdt.toLocaleString("en-BD")}</td>
      </tr>
    </tbody>
  </table>

  <div class="total">Total: ৳${invoice.amountBdt.toLocaleString("en-BD")}</div>

  <div class="footer">Generated by SocialShopBD</div>
</body>
</html>`;
}
