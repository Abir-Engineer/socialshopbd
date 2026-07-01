"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createCustomer } from "@/app/(dashboard)/customers/actions";
import { CustomerForm } from "@/components/customers/customer-form";
import { ArrowLeft } from "lucide-react";

export default function NewCustomerPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await createCustomer(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/customers");
      router.refresh();
    });
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => router.push("/customers")} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Add Customer</h1>
          <p className="text-sm text-muted-foreground">Add a new customer to your CRM.</p>
        </div>
      </div>

      <div className="max-w-2xl rounded-xl border border-border bg-card p-6 shadow-sm">
        <CustomerForm error={error} disabled={isPending} onSubmit={handleSubmit} />
      </div>
    </section>
  );
}
