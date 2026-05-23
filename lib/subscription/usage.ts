import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { OrgUsage } from "@/types/organization";

export interface OrgUsageRaw {
  orders_count: number;
  products_count: number;
  customers_count: number;
  staff_count: number;
  orders_this_month: number;
}

export async function getOrgUsage(orgId: string): Promise<OrgUsage> {
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase.rpc("get_org_subscription_context", {
    org_id: orgId,
  });

  if (error || !data || data.length === 0) {
    return {
      ordersTotal: 0,
      productsTotal: 0,
      customersTotal: 0,
      staffTotal: 0,
      ordersThisMonth: 0,
    };
  }

  const row = data[0];
  return {
    ordersTotal:      Number(row.orders_count)   || 0,
    productsTotal:    Number(row.products_count)  || 0,
    customersTotal:   Number(row.customers_count) || 0,
    staffTotal:       Number(row.staff_count)     || 0,
    ordersThisMonth:  Number(row.orders_this_month) || 0,
  };
}
