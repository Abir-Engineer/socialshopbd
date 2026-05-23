const steps = [
  { title: "Create account", description: "Sign up fast and connect your storefronts with zero complexity." },
  { title: "Add products & orders", description: "Import your catalog, add SKUs and record every order instantly." },
  { title: "Manage & grow business", description: "Use CRM, analytics and automation to scale daily operations." },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="mt-24 rounded-[2rem] border border-slate-800/70 bg-slate-900/90 p-8 shadow-2xl shadow-slate-950/30 sm:p-10">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm uppercase tracking-[0.35em] text-sky-400">How it works</p>
        <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">Run your business in three simple steps</h2>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {steps.map((step, index) => (
          <div key={step.title} className="rounded-[2rem] border border-slate-800/80 bg-slate-950/90 p-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sky-500 text-lg font-semibold text-white">
              {index + 1}
            </div>
            <h3 className="mt-6 text-xl font-semibold text-white">{step.title}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-400">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
