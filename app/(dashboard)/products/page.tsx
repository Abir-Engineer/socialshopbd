import { Suspense } from "react";
import { ProductsContent } from "@/components/products/products-content";
import { ProductsSkeleton } from "@/components/products/products-skeleton";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ page?: string; query?: string; category?: string; brand?: string; stockStatus?: string }>;
};

export default async function ProductsPage({ searchParams }: Props) {
  const sp = await searchParams;
  return (
    <Suspense fallback={<ProductsSkeleton />}>
      <ProductsContent searchParams={sp} />
    </Suspense>
  );
}
