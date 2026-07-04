import { notFound } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { OrderInvoice } from "@/components/orders/order-invoice";

type Props = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function OrderInvoicePage({ params }: Props) {
  const { id } = await params;
  const supabase = await getSupabaseServerClient();

  const { data: order, error } = await supabase.from("orders").select("*").eq("id", id).single();
  if (error || !order) notFound();

  const { data: items } = await supabase.from("order_items").select("*").eq("order_id", id);

  return (
    <OrderInvoice
      order={order}
      items={items ?? []}
      shopName="SocialShopBD"
      shopAddress="Dhaka, Bangladesh"
    />
  );
}
