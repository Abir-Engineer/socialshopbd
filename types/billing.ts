export type PaymentStatus = "succeeded" | "failed" | "refunded" | "pending";
export type CouponType = "percentage" | "fixed";
export type PaymentProvider = "stripe" | "sslcommerz" | "bkash" | "manual";

export type PaymentRecord = {
  id: string;
  organization_id: string;
  plan: string;
  amount_bdt: number;
  currency: string;
  payment_provider: PaymentProvider;
  provider_payment_id: string | null;
  status: PaymentStatus;
  invoice_number: string | null;
  invoice_pdf_url: string | null;
  period_start: string | null;
  period_end: string | null;
  paid_at: string | null;
  created_at: string;
};

export type Coupon = {
  id: string;
  organization_id: string | null;
  code: string;
  type: CouponType;
  value: number;
  max_uses: number;
  current_uses: number;
  min_plan: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
};

export type CouponValidationResult =
  | { valid: true; coupon: Coupon; discountAmount: number }
  | { valid: false; error: string };

export type BillingInvoice = {
  invoiceNumber: string;
  plan: string;
  amountBdt: number;
  status: PaymentStatus;
  periodStart: string | null;
  periodEnd: string | null;
  paidAt: string | null;
  invoicePdfUrl: string | null;
};

export type SubscriptionEvent = {
  id: string;
  plan: string;
  status: string;
  paymentProvider: string;
  amountBdt: number | null;
  periodStart: string | null;
  periodEnd: string | null;
  createdAt: string;
};
