"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const stats = [
  { value: "500+", label: "Businesses" },
  { value: "10K+", label: "Orders Managed" },
  { value: "99.9%", label: "Uptime" },
];

export function HeroSection() {
  const [dashboardHref, setDashboardHref] = useState("/signup");

  useEffect(() => {
    getSupabaseBrowserClient()
      .auth.getSession()
      .then(({ data }) => {
        if (data.session) setDashboardHref("/dashboard");
      });
  }, []);

  return (
    <section className="relative mt-6 overflow-hidden rounded-3xl border border-slate-800/60 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 px-6 py-12 shadow-2xl shadow-slate-950/50 sm:mt-8 sm:px-12 sm:py-20 lg:px-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.12),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(236,72,153,0.08),transparent_50%)]" />

      <div className="relative mx-auto max-w-4xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1.5 text-xs font-medium text-violet-300">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
          Smart Commerce Management Platform
        </div>

        <h1 className="mt-6 text-3xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
          Manage Your Business
          <br />
          <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
            From One Powerful Dashboard
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
          Products, Orders, Customers, Analytics and Team Management &mdash;
          everything in one platform.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href={dashboardHref}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 transition hover:opacity-90 hover:shadow-violet-500/40"
          >
            Start Free
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <a
            href="#features"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-8 py-3.5 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Watch Demo
          </a>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-5 backdrop-blur-sm"
            >
              <p className="text-2xl font-bold text-white sm:text-3xl">{stat.value}</p>
              <p className="mt-1 text-sm text-slate-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="relative mx-auto mt-16 max-w-5xl">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-pink-500/10 blur-3xl" />
        <div className="relative overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/90 shadow-2xl">
          <div className="flex items-center gap-2 border-b border-slate-700/60 px-5 py-3">
            <div className="h-3 w-3 rounded-full bg-red-500/80" />
            <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
            <div className="h-3 w-3 rounded-full bg-green-500/80" />
            <div className="ml-4 text-xs text-slate-500">Dashboard Preview</div>
          </div>
          <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4 sm:gap-4 sm:p-6">
            <div className="rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/5 p-4">
              <p className="text-xs text-slate-400">Total Revenue</p>
              <p className="mt-1 text-xl font-bold text-white sm:text-2xl">৳45,200</p>
              <p className="mt-1 text-xs text-emerald-400">+12.5%</p>
            </div>
            <div className="rounded-xl border border-sky-500/20 bg-gradient-to-br from-sky-500/10 to-blue-500/5 p-4">
              <p className="text-xs text-slate-400">Orders</p>
              <p className="mt-1 text-xl font-bold text-white sm:text-2xl">342</p>
              <p className="mt-1 text-xs text-emerald-400">+8.2%</p>
            </div>
            <div className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-orange-500/5 p-4">
              <p className="text-xs text-slate-400">Products</p>
              <p className="mt-1 text-xl font-bold text-white sm:text-2xl">1,280</p>
              <p className="mt-1 text-xs text-slate-400">Active</p>
            </div>
            <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 p-4">
              <p className="text-xs text-slate-400">Customers</p>
              <p className="mt-1 text-xl font-bold text-white sm:text-2xl">892</p>
              <p className="mt-1 text-xs text-emerald-400">+5.7%</p>
            </div>
          </div>
          <div className="border-t border-slate-700/60 p-4 sm:p-6">
            <div className="flex items-center justify-between rounded-xl bg-slate-800/50 p-4 sm:p-6">
              <div className="space-y-2">
                <p className="text-xs text-slate-400">Weekly Sales</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-white sm:text-3xl">৳8,450</span>
                  <span className="text-xs text-emerald-400">+18.3%</span>
                </div>
              </div>
              <div className="hidden items-end gap-1 sm:flex">
                <div className="h-8 w-6 rounded-t bg-violet-500/60" />
                <div className="h-12 w-6 rounded-t bg-violet-500/80" />
                <div className="h-16 w-6 rounded-t bg-violet-500" />
                <div className="h-10 w-6 rounded-t bg-violet-500/80" />
                <div className="h-20 w-6 rounded-t bg-gradient-to-t from-violet-500 to-fuchsia-500" />
                <div className="h-14 w-6 rounded-t bg-violet-500/80" />
                <div className="h-9 w-6 rounded-t bg-violet-500/60" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
