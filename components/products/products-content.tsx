import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/auth/organization";
import { ProductsView } from "@/components/products/products-view";

export async function ProductsContent() {
  const context = await getWorkspaceContext();
  const role = context?.role ?? "viewer";

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });

  if (error) {
    return (
      <section className="space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">পণ্য</h1>
            <p className="text-sm text-muted-foreground">পণ্যের ইনভেন্টরি ও লিস্টিং স্বাস্থ্য পর্যবেক্ষণ করুন।</p>
          </div>
        </header>
        <div className="rounded-xl border border-rose-200 bg-card p-5 text-sm text-rose-700 shadow-sm dark:border-rose-900 dark:text-rose-300">
          <p className="font-medium">পণ্য লোড করা যায়নি</p>
          <p className="mt-1 text-rose-600/90 dark:text-rose-400/90">{error.message}</p>
          <p className="mt-3 text-muted-foreground">
            যদি টেবিলটি এখনও না থাকে, তাহলে SQL চালান{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">supabase/migrations/20260511000000_create_products.sql</code>{" "}
            Supabase SQL এডিটরে, তারপর রিলোড করুন।
          </p>
        </div>
      </section>
    );
  }

  return <ProductsView initialProducts={data ?? []} role={role} />;
}
