import { Suspense } from "react";
import { InventoryContent } from "@/components/inventory/inventory-content";
import { InventorySkeleton } from "@/components/inventory/inventory-skeleton";

export const dynamic = "force-dynamic";

export default function InventoryPage() {
  return (
    <Suspense fallback={<InventorySkeleton />}>
      <InventoryContent />
    </Suspense>
  );
}
