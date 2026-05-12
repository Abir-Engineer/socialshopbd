import type { CustomerListItem, CustomerRow } from "@/types/customers";
import { formatOrderDate } from "@/lib/orders/map-row";

export function buildCustomerOrderStats(
  orderRows: { customer_id: string | null; amount_bdt: number }[],
): Map<string, { orderCount: number; totalSpentBdt: number }> {
  const map = new Map<string, { orderCount: number; totalSpentBdt: number }>();

  for (const row of orderRows) {
    if (!row.customer_id) continue;
    const cur = map.get(row.customer_id) ?? { orderCount: 0, totalSpentBdt: 0 };
    cur.orderCount += 1;
    cur.totalSpentBdt += row.amount_bdt;
    map.set(row.customer_id, cur);
  }

  return map;
}

export function mapCustomerToListItem(
  row: CustomerRow,
  stats: { orderCount: number; totalSpentBdt: number } | undefined,
): CustomerListItem {
  const orderCount = stats?.orderCount ?? 0;
  const totalSpentBdt = stats?.totalSpentBdt ?? 0;

  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    email: row.email,
    notes: row.notes ?? "",
    orderCount,
    totalSpentBdt,
    totalSpentLabel: `BDT ${totalSpentBdt.toLocaleString("en-BD")}`,
    createdAtLabel: formatOrderDate(row.created_at),
    updatedAtLabel: formatOrderDate(row.updated_at),
    isRepeat: orderCount >= 2,
  };
}
