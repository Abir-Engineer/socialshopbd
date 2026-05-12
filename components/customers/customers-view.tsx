"use client";

import { useRouter } from "next/navigation";
import { useCallback, useId, useMemo, useRef, useState, useTransition } from "react";
import { createCustomer, updateCustomer } from "@/app/(dashboard)/customers/actions";
import { digitsOnly } from "@/lib/customers/phone";
import type { CustomerListItem } from "@/types/customers";

type CustomersViewProps = {
  initialCustomers: CustomerListItem[];
};

type ToastItem = { id: number; message: string; variant: "success" | "error" };

export function CustomersView({ initialCustomers }: CustomersViewProps) {
  const router = useRouter();
  const phoneSearchId = useId();
  const [phoneQuery, setPhoneQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [profileCustomer, setProfileCustomer] = useState<CustomerListItem | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastSeq = useRef(0);

  const showToast = useCallback((message: string, variant: ToastItem["variant"]) => {
    const id = ++toastSeq.current;
    setToasts((prev) => [...prev, { id, message, variant }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const filteredCustomers = useMemo(() => {
    const q = digitsOnly(phoneQuery);
    if (!q) return initialCustomers;
    return initialCustomers.filter((c) => digitsOnly(c.phone).includes(q));
  }, [initialCustomers, phoneQuery]);

  const emptyIsDatabase = initialCustomers.length === 0;
  const emptyMessage = emptyIsDatabase
    ? "No customers yet. Add a customer to start your CRM."
    : "No customers match this phone search.";

  const handleCreate = (formData: FormData) => {
    setCreateError(null);
    startTransition(async () => {
      const result = await createCustomer(formData);
      if (!result.ok) {
        setCreateError(result.error);
        return;
      }
      setCreateOpen(false);
      showToast("Customer created successfully.", "success");
      router.refresh();
    });
  };

  const handleProfileUpdate = (formData: FormData) => {
    setProfileError(null);
    startTransition(async () => {
      const result = await updateCustomer(formData);
      if (!result.ok) {
        setProfileError(result.error);
        return;
      }
      setProfileCustomer(null);
      showToast("Customer profile saved.", "success");
      router.refresh();
    });
  };

  return (
    <section className="space-y-6" aria-busy={isPending}>
      <ToastStack toasts={toasts} onDismiss={dismissToast} />

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Customers</h1>
          <p className="text-sm text-muted-foreground">CRM profiles, notes, and order history in one place.</p>
          {isPending && (
            <p className="mt-1 text-xs text-muted-foreground" aria-live="polite">
              Saving…
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            setCreateError(null);
            setCreateOpen(true);
          }}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          Add Customer
        </button>
      </header>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="space-y-3 border-b border-border px-4 py-4 sm:px-5">
          <p className="text-sm text-muted-foreground">
            Showing {filteredCustomers.length} customer{filteredCustomers.length === 1 ? "" : "s"}
            {phoneQuery.trim() !== "" ? " (phone filter)" : ""}
          </p>
          <div className="max-w-sm">
            <label htmlFor={phoneSearchId} className="text-xs font-medium text-muted-foreground">
              Search by phone
            </label>
            <div className="relative mt-1.5">
              <input
                id={phoneSearchId}
                type="search"
                value={phoneQuery}
                onChange={(e) => setPhoneQuery(e.target.value)}
                placeholder="Digits only, e.g. 01712…"
                className="w-full rounded-lg border border-border bg-background py-2 pl-3 pr-9 text-sm text-foreground outline-none transition focus:border-blue-500"
                autoComplete="off"
              />
              {phoneQuery.trim() !== "" && (
                <button
                  type="button"
                  onClick={() => setPhoneQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Clear phone search"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="relative overflow-x-auto">
          {isPending && (
            <div
              className="pointer-events-none absolute inset-0 z-10 flex items-start justify-center bg-background/55 pt-14"
              aria-hidden
            >
              <span className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-sm">
                Loading…
              </span>
            </div>
          )}
          <table className="min-w-[720px] w-full text-left text-sm">
            <thead className="text-muted-foreground">
              <tr className="border-b border-border">
                <th className="px-3 py-3 font-medium sm:px-5">Customer</th>
                <th className="whitespace-nowrap px-3 py-3 font-medium sm:px-5">Phone</th>
                <th className="min-w-[6rem] px-3 py-3 font-medium sm:px-5">Email</th>
                <th className="whitespace-nowrap px-3 py-3 font-medium sm:px-5">Orders</th>
                <th className="whitespace-nowrap px-3 py-3 font-medium sm:px-5">Total spent</th>
                <th className="whitespace-nowrap px-3 py-3 font-medium sm:px-5">Type</th>
                <th className="whitespace-nowrap px-3 py-3 font-medium sm:px-5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((c) => (
                <tr key={c.id} className="border-b border-border/70 last:border-b-0">
                  <td className="px-3 py-4 font-medium text-card-foreground sm:px-5">{c.fullName}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-muted-foreground sm:px-5">{c.phone}</td>
                  <td className="max-w-[10rem] truncate px-3 py-4 text-muted-foreground sm:max-w-none sm:px-5">
                    {c.email ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-card-foreground sm:px-5">{c.orderCount}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-card-foreground sm:px-5">{c.totalSpentLabel}</td>
                  <td className="px-3 py-4 sm:px-5">
                    {c.isRepeat ? (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
                        Repeat
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        New
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 sm:px-5">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileError(null);
                        setProfileCustomer(c);
                      }}
                      className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center">
                    <div className="mx-auto max-w-sm space-y-2">
                      <p className="text-base font-medium text-foreground">
                        {emptyIsDatabase ? "No customers yet" : "No matching customers"}
                      </p>
                      <p className="text-sm text-muted-foreground">{emptyMessage}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {createOpen && (
        <CustomerFormModal
          title="Add customer"
          submitLabel="Create customer"
          onClose={() => {
            setCreateOpen(false);
            setCreateError(null);
          }}
          onSubmit={handleCreate}
          error={createError}
          disabled={isPending}
        />
      )}

      {profileCustomer && (
        <CustomerProfileModal
          key={profileCustomer.id}
          customer={profileCustomer}
          onClose={() => {
            setProfileCustomer(null);
            setProfileError(null);
          }}
          onSubmit={handleProfileUpdate}
          error={profileError}
          disabled={isPending}
        />
      )}
    </section>
  );
}

function ToastStack({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: number) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[60] flex max-w-sm flex-col gap-2 sm:max-w-md"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={
            t.variant === "success"
              ? "flex items-start justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900 shadow-md dark:border-emerald-900 dark:bg-emerald-950/90 dark:text-emerald-100"
              : "flex items-start justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-900 shadow-md dark:border-rose-900 dark:bg-rose-950/90 dark:text-rose-100"
          }
        >
          <span>{t.message}</span>
          <button
            type="button"
            onClick={() => onDismiss(t.id)}
            className="shrink-0 rounded p-0.5 opacity-70 hover:opacity-100"
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

type CustomerFormModalProps = {
  title: string;
  submitLabel: string;
  initial?: CustomerListItem;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
  error: string | null;
  disabled: boolean;
};

function CustomerFormModal({ title, submitLabel, initial, onClose, onSubmit, error, disabled }: CustomerFormModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="customer-form-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !disabled) onClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-lg">
        <h2 id="customer-form-title" className="text-lg font-semibold text-card-foreground">
          {title}
        </h2>
        <form
          className="mt-4 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(new FormData(e.currentTarget));
          }}
        >
          {initial && <input type="hidden" name="id" value={initial.id} />}
          <label className="block space-y-2">
            <span className="text-sm font-medium text-card-foreground">Full name</span>
            <input
              name="full_name"
              required
              defaultValue={initial?.fullName}
              disabled={disabled}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-500 disabled:opacity-60"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-card-foreground">Phone</span>
            <input
              name="phone"
              type="tel"
              required
              defaultValue={initial?.phone}
              disabled={disabled}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-500 disabled:opacity-60"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-card-foreground">Email (optional)</span>
            <input
              name="email"
              type="email"
              defaultValue={initial?.email ?? ""}
              disabled={disabled}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-500 disabled:opacity-60"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-card-foreground">Notes</span>
            <textarea
              name="notes"
              rows={4}
              defaultValue={initial?.notes ?? ""}
              disabled={disabled}
              placeholder="Preferences, follow-ups, support history…"
              className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-500 disabled:opacity-60"
            />
          </label>
          {error && <p className="rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-700">{error}</p>}
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <button
              type="button"
              disabled={disabled}
              onClick={onClose}
              className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={disabled}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-70"
            >
              {disabled ? "Please wait…" : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type CustomerProfileModalProps = {
  customer: CustomerListItem;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
  error: string | null;
  disabled: boolean;
};

function CustomerProfileModal({ customer, onClose, onSubmit, error, disabled }: CustomerProfileModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="customer-profile-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !disabled) onClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="customer-profile-title" className="text-lg font-semibold text-card-foreground">
              Customer profile
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{customer.fullName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={disabled}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-muted/30 px-3 py-3">
            <p className="text-xs text-muted-foreground">Total orders</p>
            <p className="mt-1 text-lg font-semibold text-card-foreground">{customer.orderCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">Linked orders only</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 px-3 py-3">
            <p className="text-xs text-muted-foreground">Total spent</p>
            <p className="mt-1 text-lg font-semibold text-card-foreground">{customer.totalSpentLabel}</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 px-3 py-3">
            <p className="text-xs text-muted-foreground">Repeat customer</p>
            <p className="mt-1 text-lg font-semibold text-card-foreground">{customer.isRepeat ? "Yes" : "No"}</p>
            <p className="mt-1 text-xs text-muted-foreground">{customer.isRepeat ? "2+ linked orders" : "0–1 orders"}</p>
          </div>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Created {customer.createdAtLabel} · Updated {customer.updatedAtLabel}
        </p>

        <form
          className="mt-6 space-y-4 border-t border-border pt-6"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(new FormData(e.currentTarget));
          }}
        >
          <input type="hidden" name="id" value={customer.id} />
          <label className="block space-y-2">
            <span className="text-sm font-medium text-card-foreground">Full name</span>
            <input
              name="full_name"
              required
              defaultValue={customer.fullName}
              disabled={disabled}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-500 disabled:opacity-60"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-card-foreground">Phone</span>
            <input
              name="phone"
              type="tel"
              required
              defaultValue={customer.phone}
              disabled={disabled}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-500 disabled:opacity-60"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-card-foreground">Email (optional)</span>
            <input
              name="email"
              type="email"
              defaultValue={customer.email ?? ""}
              disabled={disabled}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-500 disabled:opacity-60"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-card-foreground">Notes</span>
            <textarea
              name="notes"
              rows={5}
              defaultValue={customer.notes}
              disabled={disabled}
              placeholder="CRM notes…"
              className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-500 disabled:opacity-60"
            />
          </label>
          {error && <p className="rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-700">{error}</p>}
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              disabled={disabled}
              onClick={onClose}
              className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-60"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={disabled}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-70"
            >
              {disabled ? "Saving…" : "Save profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
