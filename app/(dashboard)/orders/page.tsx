import { Suspense } from "react";
import { OrdersContent } from "@/components/orders/orders-content";
import { OrdersSkeleton } from "@/components/orders/orders-skeleton";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ page?: string; query?: string; status?: string; paymentStatus?: string; sortBy?: string; sortOrder?: string }>;
};

export default async function OrdersPage({ searchParams }: Props) {
  const sp = await searchParams;
  return (
    <Suspense fallback={<OrdersSkeleton />}>
      <OrdersContent searchParams={sp} />
    </Suspense>
  );
}
