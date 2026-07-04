"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function CTASection() {
  const [dashboardHref, setDashboardHref] = useState("/signup");

  useEffect(() => {
    getSupabaseBrowserClient()
      .auth.getSession()
      .then(({ data }) => {
        if (data.session) setDashboardHref("/dashboard");
      });
  }, []);

  return (
    <section className="relative mt-20 overflow-hidden rounded-3xl border border-slate-800/60 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 px-6 py-12 text-center shadow-2xl shadow-slate-950/50 sm:mt-32 sm:px-12 sm:py-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.1),transparent_60%)]" />

      <div className="relative">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1.5 text-xs font-medium text-violet-300">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
          Get Started Today
        </div>

        <h2 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Ready to Scale Your Business?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-slate-400">
          Join 500+ business owners already scaling with SocialShopBD.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href={dashboardHref}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 transition hover:opacity-90"
          >
            Start Free →
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path d="M13 7l5 5m0 0l-5 5m5-5H6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-8 py-3.5 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
          >
            Sign In
          </Link>
        </div>
      </div>
    </section>
  );
}
