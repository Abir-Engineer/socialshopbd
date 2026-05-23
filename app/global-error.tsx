"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { parseError } from "@/utils/error-parser";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const parsed = parseError(error);

  useEffect(() => {
    console.error("Critical Global Error boundary caught error:", error);
  }, [error]);

  return (
    <html lang="en" className="h-full dark">
      <body className="flex min-h-screen flex-col items-center justify-center bg-slate-900 text-slate-100 px-4 py-12 sm:px-6 lg:px-8 font-sans">
        <div className="w-full max-w-md space-y-6 text-center">
          {/* Error Icon */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/20 text-rose-400">
            <AlertCircle className="h-9 w-9 animate-pulse" />
          </div>

          {/* Header */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              A Critical Error Occurred
            </h2>
            <p className="mx-auto max-w-sm text-sm text-slate-400">
              {parsed.message}
            </p>
          </div>

          {/* Expanded developer info */}
          {(parsed.code || parsed.details || parsed.hint) && (
            <div className="mx-auto rounded-lg border border-slate-700 bg-slate-800 p-3 text-left">
              <span className="text-xs font-semibold text-slate-400 select-none">
                Technical Details
              </span>
              <div className="mt-2 space-y-1.5 font-mono text-[11px] text-slate-400 border-t border-slate-700 pt-2 break-all overflow-x-auto">
                {parsed.code && <p><span className="font-semibold text-white">Code:</span> {parsed.code}</p>}
                {parsed.status && <p><span className="font-semibold text-white">Status:</span> {parsed.status}</p>}
                {parsed.details && <p><span className="font-semibold text-white">Details:</span> {parsed.details}</p>}
                {parsed.hint && <p><span className="font-semibold text-white">Hint:</span> {parsed.hint}</p>}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-center">
            <button
              onClick={() => reset()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-500 active:scale-95 transition"
            >
              <RotateCcw className="h-4 w-4" />
              Reset Application
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
