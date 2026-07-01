"use client";

import type { PaymentRecord } from "@/types/billing";
import { paymentStatusBadgeClass, paymentStatusLabelBn, providerLabel, formatBdt } from "@/lib/billing/display";

type PaymentHistoryProps = {
  payments: PaymentRecord[];
};

export function PaymentHistory({ payments }: PaymentHistoryProps) {
  if (payments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center">
        <p className="text-sm font-medium text-foreground">No payment history yet</p>
        <p className="mt-1 text-xs text-muted-foreground">Payments will appear here after your first subscription payment.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs font-semibold text-muted-foreground">
            <th className="pb-3 font-medium">Date</th>
            <th className="pb-3 font-medium">Plan</th>
            <th className="pb-3 font-medium">Amount</th>
            <th className="pb-3 font-medium">Provider</th>
            <th className="pb-3 font-medium">Status</th>
            <th className="pb-3 font-medium">Invoice</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => (
            <tr key={p.id} className="border-b border-border/40 last:border-0 hover:bg-muted/10 transition">
              <td className="py-3 text-card-foreground">
                {p.paid_at ? new Date(p.paid_at).toLocaleDateString("en-BD", { day: "numeric", month: "short", year: "numeric" }) : "—"}
              </td>
              <td className="py-3 capitalize text-card-foreground">{p.plan}</td>
              <td className="py-3 font-mono font-medium text-card-foreground">{formatBdt(p.amount_bdt)}</td>
              <td className="py-3 text-card-foreground">{providerLabel(p.payment_provider)}</td>
              <td className="py-3">
                <span className={paymentStatusBadgeClass(p.status)}>{paymentStatusLabelBn(p.status)}</span>
              </td>
              <td className="py-3">
                {p.invoice_number ? (
                  <span className="text-xs text-muted-foreground font-mono">{p.invoice_number}</span>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
