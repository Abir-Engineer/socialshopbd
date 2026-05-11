import { Suspense } from "react";
import { OrdersContent } from "@/components/orders/orders-content";
import { OrdersSkeleton } from "@/components/orders/orders-skeleton";

export const dynamic = "force-dynamic";

export default function OrdersPage() {
  return (
    <Suspense fallback={<OrdersSkeleton />}>
      <OrdersContent />
    </Suspense>
  );
}
