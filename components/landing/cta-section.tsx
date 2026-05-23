import Link from "next/link";

export function CTASection() {
  return (
    <section className="mt-24 rounded-[2rem] border border-slate-800/70 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 p-10 shadow-2xl shadow-slate-950/30 text-center">
      <p className="text-sm uppercase tracking-[0.35em] text-sky-400">Ready to grow?</p>
      <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">Start your business journey today</h2>
      <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
        Join Social Shop BD and manage every part of your online commerce workflow from one intuitive dashboard.
      </p>
      <Link
        href="/signup"
        className="mt-8 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:opacity-95"
      >
        Create Account
      </Link>
    </section>
  );
}
