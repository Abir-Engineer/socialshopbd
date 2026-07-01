import { notFound } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { CustomerProfile } from "@/components/customers/customer-profile";
import { getWorkspaceContext } from "@/lib/auth/organization";

type Props = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await getSupabaseServerClient();
  const context = await getWorkspaceContext();
  const role = context?.role ?? "viewer";

  const { data: customer, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !customer) {
    notFound();
  }

  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_number, amount_bdt, status, created_at")
    .eq("customer_id", id)
    .order("created_at", { ascending: false });

  return (
    <CustomerProfile customer={customer} orders={orders ?? []} role={role} />
  );
}
