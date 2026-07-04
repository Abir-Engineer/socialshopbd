"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Package, Star, Phone, MapPin, Mail, Building2, Tag, ShoppingBag, ChevronRight } from "lucide-react";
import type { CustomerRow, CustomerAddress, CustomerPhone } from "@/types/customers";
import { parseAddresses, parsePhones } from "@/types/customers";
import { formatLtvFull, formatAddress, tagBadgeClass } from "@/lib/customers/display";
import { updateCustomer, deleteCustomer } from "@/app/(dashboard)/customers/actions";
import { CustomerForm } from "@/components/customers/customer-form";
import { formatPriceBdt, getStockStatus, statusBadgeClass } from "@/lib/products/display";
import { formatOrderDate } from "@/lib/orders/map-row";

type CustomerProfileProps = {
  customer: CustomerRow;
  orders: { id: string; order_number: string; amount_bdt: number; status: string; created_at: string; item_count?: number }[];
  role: string;
};

export function CustomerProfile({ customer, orders, role }: CustomerProfileProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [tab, setTab] = useState<"info" | "orders">("info");

  const isViewer = role === "viewer";
  const tags = Array.isArray(customer.tags) ? (customer.tags as string[]) : [];
  const phones = parsePhones(customer.phones ?? []);
  const addresses = parseAddresses(customer.addresses ?? []);
  const totalSpent = orders.reduce((sum, o) => sum + o.amount_bdt, 0);
  const orderCount = orders.length;
  const avgOrderValue = orderCount > 0 ? Math.round(totalSpent / orderCount) : 0;
  const isRepeat = orderCount >= 2;

  const handleUpdate = (formData: FormData) => {
    setFormError(null);
    startTransition(async () => {
      const result = await updateCustomer(formData);
      if (!result.ok) { setFormError(result.error); return; }
      setEditOpen(false);
      setFormError(null);
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (!window.confirm(`Delete "${customer.name}"? This cannot be undone.`)) return;
    startTransition(async () => {
      const result = await deleteCustomer(customer.id);
      if (!result.ok) { setFormError(result.error); return; }
      router.push("/customers");
    });
  };

  return (
    <section className={`space-y-6 ${isPending ? "pointer-events-none opacity-60" : ""}`}>
      <button type="button" onClick={() => router.push("/customers")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Customers
      </button>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-start gap-5">
          <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-full border-2 border-border bg-muted/30">
            {customer.avatar_url ? (
              <img src={customer.avatar_url} alt={customer.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-xl font-bold text-white">
                {customer.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold text-card-foreground">{customer.name}</h1>
              {isRepeat && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                  <Star className="h-3 w-3 fill-current" /> Repeat Buyer
                </span>
              )}
            </div>
            {customer.business_name && (
              <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                <Building2 className="h-3.5 w-3.5" /> {customer.business_name}
              </p>
            )}
            <div className="mt-1 flex flex-wrap gap-2">
              {phones.filter((p) => p.is_primary).map((p) => (
                <span key={p.number} className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" /> {p.number}
                </span>
              ))}
              {!phones.some((p) => p.is_primary) && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" /> {customer.phone}
                </span>
              )}
              {customer.email && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" /> {customer.email}
                </span>
              )}
            </div>
            {tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <span key={t} className={tagBadgeClass(t)}>{t}</span>
                ))}
              </div>
            )}
          </div>
          {!isViewer && (
            <div className="flex gap-2">
              <button type="button" onClick={() => { setFormError(null); setEditOpen(true); }} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Edit Customer</button>
              <button type="button" onClick={handleDelete} className="rounded-lg border border-rose-300 px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950">Delete Customer</button>
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatBox label="Total Orders" value={String(orderCount)} />
          <StatBox label="Lifetime Value" value={formatLtvFull(totalSpent)} />
          <StatBox label="Avg Order Value" value={formatLtvFull(avgOrderValue)} />
          <StatBox label="Customer Since" value={formatOrderDate(customer.created_at)} />
        </div>
      </div>

      <div className="flex gap-1 rounded-xl border border-border bg-card p-1">
        <button type="button" onClick={() => setTab("info")} className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${tab === "info" ? "bg-blue-600 text-white" : "text-muted-foreground hover:text-foreground"}`}>
          <Tag className="mr-1.5 inline h-4 w-4" /> Info
        </button>
        <button type="button" onClick={() => setTab("orders")} className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${tab === "orders" ? "bg-blue-600 text-white" : "text-muted-foreground hover:text-foreground"}`}>
          <ShoppingBag className="mr-1.5 inline h-4 w-4" /> Orders ({orderCount})
        </button>
      </div>

      {tab === "info" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-card-foreground"><Phone className="h-4 w-4" /> Phone Numbers</h3>
            {phones.length === 0 ? (
              <p className="text-sm text-muted-foreground">{customer.phone} (primary)</p>
            ) : (
              <ul className="space-y-2">
                {phones.map((p) => (
                  <li key={p.number} className="flex items-center justify-between text-sm">
                    <span className="text-card-foreground">{p.number}</span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">{p.label} {p.is_primary && <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] text-blue-700 dark:bg-blue-950 dark:text-blue-300">Primary</span>}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-card-foreground"><MapPin className="h-4 w-4" /> Addresses</h3>
            {addresses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No addresses saved yet.</p>
            ) : (
              <ul className="space-y-2">
                {addresses.map((a, i) => (
                  <li key={i} className="text-sm">
                    <span className="flex items-center gap-1 font-medium text-card-foreground">{a.label || `Address ${i + 1}`} {a.is_default && <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">Default</span>}</span>
                    <span className="text-muted-foreground">{formatAddress(a)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {customer.notes && (
            <div className="col-span-full rounded-xl border border-border bg-card p-5 shadow-sm">
              <h3 className="mb-2 text-sm font-semibold text-card-foreground">Notes</h3>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{customer.notes}</p>
            </div>
          )}
        </div>
      )}

      {tab === "orders" && (
        <div className="rounded-xl border border-border bg-card shadow-sm">
          {orders.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <Package className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No orders yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="px-5 py-3 font-medium">Order</th>
                    <th className="px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 font-medium">Items</th>
                    <th className="px-5 py-3 font-medium">Amount</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="border-b border-border/70 last:border-b-0 hover:bg-muted/50 transition-colors">
                      <td className="px-5 py-3 font-medium text-card-foreground">#{o.order_number}</td>
                      <td className="px-5 py-3 text-muted-foreground">{formatOrderDate(o.created_at)}</td>
                      <td className="px-5 py-3 text-card-foreground">{o.item_count ?? "-"}</td>
                      <td className="px-5 py-3 text-card-foreground">{formatPriceBdt(o.amount_bdt)}</td>
                      <td className="px-5 py-3">
                        <span className={statusBadgeClass(getStockStatus(o.status as any))}>{o.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-8" onMouseDown={(e) => { if (e.target === e.currentTarget) setEditOpen(false); }}>
          <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-card-foreground">Edit Customer</h2>
              <button type="button" onClick={() => setEditOpen(false)} className="text-muted-foreground hover:text-foreground"><XIcon className="h-5 w-5" /></button>
            </div>
            <CustomerForm initial={customer} error={formError} disabled={isPending} onSubmit={handleUpdate} />
          </div>
        </div>
      )}
    </section>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold text-card-foreground">{value}</p>
    </div>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
  );
}
