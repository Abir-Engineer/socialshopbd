import { notFound } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/auth/organization";
import { OrderDetailPage } from "@/components/orders/order-detail";

type Props = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function OrderDetail({ params }: Props) {
  const { id } = await params;
  const supabase = await getSupabaseServerClient();
  const context = await getWorkspaceContext();
  const role = context?.role ?? "viewer";

  const { data: order, error } = await supabase.from("orders").select("*").eq("id", id).single();
  if (error || !order) notFound();

  const { data: items } = await supabase.from("order_items").select("*").eq("order_id", id);
  const { data: timeline } = await supabase.from("order_timeline").select("*").eq("order_id", id).order("created_at", { ascending: false });
  const { data: comments } = await supabase.from("order_comments").select("*").eq("order_id", id).order("created_at", { ascending: false });

  return (
    <OrderDetailPage
      order={order}
      items={items ?? []}
      timeline={timeline ?? []}
      comments={comments ?? []}
      role={role}
    />
  );
}
