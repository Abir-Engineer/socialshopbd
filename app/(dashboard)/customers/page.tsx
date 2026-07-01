import { Suspense } from "react";
import { CustomersContent } from "@/components/customers/customers-content";
import { CustomersSkeleton } from "@/components/customers/customers-skeleton";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ page?: string; query?: string; tag?: string; isRepeat?: string; sortBy?: string; sortOrder?: string }>;
};

export default async function CustomersPage({ searchParams }: Props) {
  const sp = await searchParams;
  return (
    <Suspense fallback={<CustomersSkeleton />}>
      <CustomersContent searchParams={sp} />
    </Suspense>
  );
}
