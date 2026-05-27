"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createOrganization } from "@/app/onboarding/actions";

export function OnboardingForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createOrganization(new FormData(e.currentTarget));
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.replace("/");
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block space-y-2">
        <span className="text-sm font-medium text-card-foreground">Organization / Shop Name</span>
        <input
          name="name"
          type="text"
          required
          disabled={isPending}
          placeholder="e.g. My Fashion Store"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-500 disabled:opacity-60"
        />
      </label>

      {error && (
        <p className="rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-70 cursor-pointer"
      >
        {isPending ? "Creating…" : "Create Organization"}
      </button>
    </form>
  );
}
