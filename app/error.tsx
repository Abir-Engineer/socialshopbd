"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, RotateCcw, Home, LogIn } from "lucide-react";
import { parseError } from "@/utils/error-parser";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const parsed = parseError(error);

  useEffect(() => {
    console.error("Global boundary caught error:", error);
  }, [error]);

  const handleLoginRedirect = () => {
    router.push("/login?expired=true");
  };

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10 text-rose-500 dark:bg-rose-500/20">
          <AlertCircle className="h-9 w-9 animate-pulse" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {parsed.isSessionExpired ? "Session Expired" : "Something went wrong"}
          </h2>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            {parsed.message}
          </p>
        </div>

        {(parsed.code || parsed.details || parsed.hint) && (
          <details className="group mx-auto rounded-lg border border-border bg-card p-3 text-left transition-all">
            <summary className="flex cursor-pointer items-center justify-between text-xs font-semibold text-muted-foreground select-none">
              <span>Technical Details</span>
              <span className="text-[10px] transition-transform group-open:rotate-180">▼</span>
            </summary>
            <div className="mt-2 space-y-1.5 font-mono text-[11px] text-muted-foreground border-t border-border/40 pt-2 break-all overflow-x-auto">
              {parsed.code && <p><span className="font-semibold text-foreground">Code:</span> {parsed.code}</p>}
              {parsed.status && <p><span className="font-semibold text-foreground">Status:</span> {parsed.status}</p>}
              {parsed.details && <p><span className="font-semibold text-foreground">Details:</span> {parsed.details}</p>}
              {parsed.hint && <p><span className="font-semibold text-foreground">Hint:</span> {parsed.hint}</p>}
            </div>
          </details>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          {parsed.isSessionExpired ? (
            <button
              onClick={handleLoginRedirect}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-500 active:scale-95 transition"
            >
              <LogIn className="h-4 w-4" />
              Sign In Again
            </button>
          ) : (
            <>
              <button
                onClick={() => reset()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-500 active:scale-95 transition"
              >
                <RotateCcw className="h-4 w-4" />
                Try Again
              </button>
              <button
                onClick={() => router.push("/")}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted active:scale-95 transition"
              >
                <Home className="h-4 w-4" />
                Go Home
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
