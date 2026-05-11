import { Suspense } from "react";
import { ProductsContent } from "@/components/products/products-content";
import { ProductsSkeleton } from "@/components/products/products-skeleton";

export const dynamic = "force-dynamic";

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsSkeleton />}>
      <ProductsContent />
    </Suspense>
  );
}
