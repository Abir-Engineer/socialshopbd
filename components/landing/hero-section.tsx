import Link from "next/link";

const bullets = [
  "F-commerce store and orders in one place",
  "Customer CRM with fast lookup",
  "Analytics built for small brands",
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-slate-800/70 bg-slate-900/95 px-6 py-12 shadow-2xl shadow-slate-950/30 sm:px-10 lg:flex lg:items-center lg:justify-between lg:px-12 lg:py-16">
      <div className="max-w-2xl">
        <p className="text-sm uppercase tracking-[0.3em] text-sky-400">Manage your business smartly</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Manage Your Online Business Smartly
        </h1>
        <p className="mt-6 max-w-xl text-base leading-8 text-slate-300">
          All-in-one platform for F-commerce, orders, products & customers — built to help growing merchants
          manage every sale with confidence.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-400"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-950 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-500"
          >
            Login
          </Link>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          {bullets.map((item) => (
            <div key={item} className="rounded-3xl border border-slate-800/80 bg-slate-950/80 p-4">
              <p className="text-sm text-slate-300">{item}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 flex justify-center lg:mt-0 lg:w-[45%]">
        <div className="relative aspect-[4/3] w-full max-w-xl overflow-hidden rounded-[1.75rem] border border-slate-800/80 bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-950 p-6 shadow-2xl shadow-slate-950/40">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.2),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.18),_transparent_26%)]" />
          <div className="relative flex h-full flex-col justify-between rounded-[1.5rem] border border-white/5 bg-slate-950/90 p-6 text-white">
            <div className="space-y-4">
              <div className="rounded-3xl bg-slate-800/90 p-4 text-slate-200">Dashboard preview</div>
              <div className="grid gap-3">
                <div className="h-4 w-24 rounded-full bg-slate-700/90" />
                <div className="h-4 w-32 rounded-full bg-slate-700/90" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="h-20 rounded-3xl bg-slate-800/80" />
                  <div className="h-20 rounded-3xl bg-slate-800/80" />
                </div>
              </div>
            </div>
            <div className="grid gap-3">
              <div className="h-14 rounded-3xl bg-slate-800/80" />
              <div className="h-14 rounded-3xl bg-slate-800/80" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
