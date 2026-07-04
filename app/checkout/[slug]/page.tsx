import { notFound } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import Link from "next/link";

interface CheckoutPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { slug } = await params;
  const supabase = await getSupabaseServerClient();

  // 1. Fetch shop profile
  const { data: shop, error: shopError } = await supabase
    .from("shops")
    .select("*")
    .eq("slug", slug)
    .single();

  if (shopError || !shop) {
    notFound();
  }

  // 2. Fetch products for this shop owner
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("*")
    .eq("user_id", shop.user_id)
    .order("name", { ascending: true });

  if (productsError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-semibold text-rose-500">Failed to load checkout catalog</h2>
        <p className="mt-2 text-sm text-muted-foreground">Please try reloading this page.</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-muted/20 py-10 sm:py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* Shop Branding Header */}
        <div className="mb-8 text-center sm:mb-12">
          <Link href={`/checkout/${slug}`} className="inline-block">
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Welcome to Checkout of</span>
            <h1 className="mt-2 text-3xl font-extrabold text-foreground sm:text-4xl">
              {shop.shop_name}
            </h1>
          </Link>
          {shop.address && (
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
              📍 {shop.address}
            </p>
          )}
        </div>

        {/* Dynamic checkout container */}
        <CheckoutForm shop={shop} products={products ?? []} />

        <div className="mt-12 text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} {shop.shop_name}. Powered by SocialShopBD.</p>
        </div>
      </div>
    </main>
  );
}
