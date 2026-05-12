import { Suspense } from "react";
import { CustomersContent } from "@/components/customers/customers-content";
import { CustomersSkeleton } from "@/components/customers/customers-skeleton";

export const dynamic = "force-dynamic";

export default function CustomersPage() {
  return (
    <Suspense fallback={<CustomersSkeleton />}>
      <CustomersContent />
    </Suspense>
  );
}
