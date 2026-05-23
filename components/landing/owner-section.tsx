import Image from "next/image";

export function OwnerSection() {
  return (
    <section id="owner" className="mt-24 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
      <div className="rounded-[2rem] border border-slate-800/70 bg-slate-950/95 p-6 shadow-2xl shadow-slate-950/40 sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_0.9fr] lg:items-center">
          <div className="space-y-6 rounded-[2rem] border border-slate-800/80 bg-slate-900/90 p-8 shadow-xl shadow-slate-950/40">
            <span className="inline-flex rounded-full bg-sky-500/10 px-4 py-2 text-xs uppercase tracking-[0.35em] text-sky-300">
              Founder
            </span>
            <div className="space-y-3">
              <h2 className="text-4xl font-semibold tracking-tight text-white">Shahin Alam Abir</h2>
              <p className="text-sm text-slate-400">Founder of Social Shop BD, building smart commerce tools for F-commerce sellers in Bangladesh.</p>
            </div>
            <div className="rounded-[1.75rem] border border-slate-800/80 bg-slate-950/90 p-6">
              <p className="text-sm leading-7 text-slate-300">
                Helping small businesses grow with smart tools, clear operations and elegant workflows that reduce daily friction.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <a
                href="https://www.facebook.com"
                target="_blank"
                rel="noreferrer"
                className="rounded-3xl border border-slate-700/90 bg-slate-950/90 px-4 py-3 text-sm font-medium text-slate-100 transition hover:border-slate-500"
              >
                Facebook
              </a>
              <a
                href="https://www.linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="rounded-3xl border border-slate-700/90 bg-slate-950/90 px-4 py-3 text-sm font-medium text-slate-100 transition hover:border-slate-500"
              >
                LinkedIn
              </a>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-800/70 bg-slate-900/90 p-4 shadow-xl shadow-slate-950/30">
            <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-800/80 bg-slate-950">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 opacity-80" />
              <div className="relative aspect-[3/4] w-full sm:aspect-[4/5]">
                <Image
                  src="/abir.jpeg"
                  alt="Abir, founder of Social Shop BD"
                  fill
                  className="object-cover"
                  sizes="(min-width: 768px) 45vw, 100vw"
                  priority
                />
              </div>
              <div className="absolute bottom-0 left-0 right-0 rounded-b-[1.75rem] bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent px-5 py-5 text-white">
                <p className="text-xs uppercase tracking-[0.35em] text-sky-300">Founder Portrait</p>
                <p className="mt-3 text-lg font-semibold">Shahin Alam Abir</p>
              </div>
            </div>
            <div className="mt-6 rounded-[1.75rem] border border-slate-800/80 bg-slate-950/90 p-5 text-slate-200">
              <p className="text-sm italic text-slate-300">“Success in business comes from consistency and smart systems.”</p>
            </div>
            <a
              href="https://aabir-cmo.netlify.app/"
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-400"
            >
              View Portfolio
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
