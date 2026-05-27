import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { OnboardingForm } from "@/app/onboarding/onboarding-form";
import { Store } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("organization_members")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (membership) redirect("/");

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
            <Store className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Set Up Your Shop</h1>
          <p className="text-sm text-muted-foreground">
            Create your organization to start managing orders, products, and team members.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <OnboardingForm />
        </div>
      </div>
    </main>
  );
}
