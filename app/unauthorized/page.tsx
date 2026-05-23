"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldAlert, ArrowLeft, LogIn } from "lucide-react";

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Shield Icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 dark:bg-amber-500/20">
          <ShieldAlert className="h-12 w-12 text-amber-500" />
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
            Access Denied
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Unauthorized
          </h1>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            You do not have permission to view this resource. Please sign in with an authorized account or contact your administrator.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-500 active:scale-95 transition"
          >
            <LogIn className="h-4 w-4" />
            Sign In
          </Link>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted active:scale-95 transition cursor-pointer"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
