const steps = [
  {
    step: 1,
    title: "Create Your Account",
    description:
      "Sign up. No credit card required. Start your free trial now.",
  },
  {
    step: 2,
    title: "Add Products & Orders",
    description:
      "Import your catalog, add products, and start recording orders right away.",
  },
  {
    step: 3,
    title: "Grow Your Business",
    description:
      "Use analytics, CRM, and team tools to scale your operations seamlessly.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="mt-20 scroll-mt-24 sm:mt-32">
      <div className="text-center">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-violet-400">
          How It Works
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Get Started in 3 Simple Steps
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base text-slate-400">
          No credit card. No hassle. Start free.
        </p>
      </div>

      <div className="relative mt-16">
        <div className="absolute left-8 top-0 hidden h-full w-px bg-gradient-to-b from-violet-500/50 via-fuchsia-500/30 to-transparent md:block" />

        <div className="space-y-12">
          {steps.map((step, i) => (
            <div key={step.step} className="relative md:flex md:items-start md:gap-8">
              <div className="hidden md:flex md:w-16 md:shrink-0 md:justify-center">
                <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-sm font-bold text-white shadow-lg shadow-violet-500/25">
                  {step.step}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-6 backdrop-blur-sm md:flex-1">
                <div className="mb-3 flex items-center gap-3 md:hidden">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 text-xs font-bold text-white">
                    {step.step}
                  </div>
                  <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                </div>
                <h3 className="hidden text-lg font-semibold text-white md:block">{step.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-400">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
