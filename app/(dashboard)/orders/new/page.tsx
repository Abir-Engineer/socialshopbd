"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createOrder } from "@/app/(dashboard)/orders/actions";
import { OrderFormModal } from "@/components/orders/orders-view";
import { ArrowLeft } from "lucide-react";

export default function NewOrderPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await createOrder(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(result.ok ? `/orders/${result.id}` : "/orders");
      router.refresh();
    });
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => router.push("/orders")} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">New Order</h1>
          <p className="text-sm text-muted-foreground">Create a new order with multiple products.</p>
        </div>
      </div>

      <div className="max-w-3xl">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <OrderFormModal
            inline
            title=""
            onClose={() => {}}
            onSubmit={handleSubmit}
            error={error}
            disabled={isPending}
          />
        </div>
      </div>
    </section>
  );
}
