import Link from "next/link";

export function OwnerSection() {
  return (
    <section id="owner" className="mt-32 scroll-mt-24">
      <div className="text-center">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-violet-400">
          Meet The Founder
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Built by an entrepreneur for entrepreneurs
        </h2>
      </div>

      <div className="mt-12 overflow-hidden rounded-3xl border border-slate-800/60 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 shadow-2xl shadow-slate-950/50">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(139,92,246,0.08),transparent_50%)]" />

        <div className="relative grid gap-8 p-8 lg:grid-cols-5 lg:items-center lg:p-12">
          <div className="lg:col-span-3 lg:pr-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1.5 text-xs font-medium text-violet-300">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
              Shahin Alam Abir
            </div>

            <p className="mt-4 text-sm font-medium uppercase tracking-widest text-slate-500">
              Digital Marketer, SaaS Builder &amp; Entrepreneur
            </p>

            <div className="mt-6 space-y-4 rounded-2xl border border-slate-800/50 bg-slate-950/80 p-6">
              <p className="text-base leading-8 text-slate-300">
                I built Social Shop BD to help small businesses manage products,
                orders and customers from one place without complicated software.
              </p>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-800/40 bg-slate-950/50 p-5">
              <p className="text-lg italic leading-relaxed text-slate-400">
                &ldquo;Success comes from systems, consistency and execution.&rdquo;
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="https://aabir-cmo.netlify.app/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:opacity-90"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                  <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Portfolio
              </Link>
              <a
                href="https://www.linkedin.com/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-5 py-2.5 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:text-white"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                LinkedIn
              </a>
              <a
                href="https://www.facebook.com/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-5 py-2.5 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:text-white"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </a>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="relative overflow-hidden rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-800 to-slate-900">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.1),transparent_60%)]" />
              <div className="relative flex aspect-[3/4] items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 text-3xl font-bold text-white shadow-2xl shadow-violet-500/30">
                    SA
                  </div>
                  <p className="mt-4 text-lg font-semibold text-white">Shahin Alam Abir</p>
                  <p className="text-sm text-slate-400">Founder</p>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent p-6">
                <p className="text-center text-xs text-slate-500">
                  Social Shop BD &mdash; Est. 2025
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
