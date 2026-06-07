const testimonials = [
  {
    name: "Fatima Begum",
    role: "Facebook Shop Owner, Dhaka",
    quote:
      "Social Shop BD transformed how I manage my Facebook shop. Orders, customers, everything in one place. I can finally focus on growing my business instead of juggling spreadsheets.",
    initials: "FB",
  },
  {
    name: "Rafiq Hasan",
    role: "E-commerce Store Manager, Chattogram",
    quote:
      "The analytics dashboard alone is worth it. I can see exactly what&apos;s selling, track revenue trends, and make data-driven decisions. My team loves how simple it is.",
    initials: "RH",
  },
  {
    name: "Nusrat Jahan",
    role: "Small Business Owner, Sylhet",
    quote:
      "I tried several platforms before Social Shop BD. Nothing comes close to the ease of use and the support team is incredibly responsive. Highly recommended for any growing business.",
    initials: "NJ",
  },
];

export function TestimonialsSection() {
  return (
    <section className="mt-20 sm:mt-32">
      <div className="text-center">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-violet-400">
          Testimonials
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Trusted by business owners
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base text-slate-400">
          Hear from the entrepreneurs who use Social Shop BD every day.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {testimonials.map((t) => (
          <div
            key={t.name}
            className="group rounded-2xl border border-slate-800/60 bg-slate-900/50 p-6 transition hover:border-violet-500/30 hover:bg-slate-900/80"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 text-sm font-bold text-violet-400">
                {t.initials}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{t.name}</p>
                <p className="text-xs text-slate-500">{t.role}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              &ldquo;{t.quote}&rdquo;
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
