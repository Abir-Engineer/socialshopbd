"use client";

import type { BillingInvoice } from "@/types/billing";
import { paymentStatusBadgeClass, paymentStatusLabelBn, formatBdt } from "@/lib/billing/display";
import { generateInvoiceHtml } from "@/lib/billing/service";

type InvoiceListProps = {
  invoices: BillingInvoice[];
  orgName: string;
};

export function InvoiceList({ invoices, orgName }: InvoiceListProps) {
  const handlePrint = (invoice: BillingInvoice) => {
    const html = generateInvoiceHtml(invoice, orgName);
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  };

  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center">
        <p className="text-sm font-medium text-foreground">No invoices yet</p>
        <p className="mt-1 text-xs text-muted-foreground">Invoices will be generated automatically after each payment.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs font-semibold text-muted-foreground">
            <th className="pb-3 font-medium">Invoice #</th>
            <th className="pb-3 font-medium">Plan</th>
            <th className="pb-3 font-medium">Period</th>
            <th className="pb-3 font-medium">Amount</th>
            <th className="pb-3 font-medium">Status</th>
            <th className="pb-3 font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv, i) => (
            <tr key={inv.invoiceNumber} className="border-b border-border/40 last:border-0 hover:bg-muted/10 transition">
              <td className="py-3 font-mono text-xs text-card-foreground">{inv.invoiceNumber}</td>
              <td className="py-3 capitalize text-card-foreground">{inv.plan}</td>
              <td className="py-3 text-xs text-muted-foreground">
                {inv.periodStart ? new Date(inv.periodStart).toLocaleDateString("en-BD") : "—"}
                {" — "}
                {inv.periodEnd ? new Date(inv.periodEnd).toLocaleDateString("en-BD") : "—"}
              </td>
              <td className="py-3 font-mono font-medium text-card-foreground">{formatBdt(inv.amountBdt)}</td>
              <td className="py-3">
                <span className={paymentStatusBadgeClass(inv.status)}>{paymentStatusLabelBn(inv.status)}</span>
              </td>
              <td className="py-3">
                <button
                  type="button"
                  onClick={() => handlePrint(inv)}
                  className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                  Print
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
