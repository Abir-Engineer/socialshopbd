const features = [
  {
    title: "Product Management",
    description: "Track inventory, pricing, and stock.",
    icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
  },
  {
    title: "Order Management",
    description: "Manage all orders from one place.",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  },
  {
    title: "Customer CRM",
    description: "Track repeat customers and customer history.",
    icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z",
  },
  {
    title: "Analytics Dashboard",
    description: "Revenue, sales, and business insights.",
    icon: "M4 19V5m6 14V9m6 10V3m4 16H2",
  },
  {
    title: "Team Management",
    description: "Manage teams and permissions.",
    icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2m8-10a4 4 0 100-8 4 4 0 000 8z",
  },
  {
    title: "Multi Shop Ready",
    description: "Scale multiple businesses.",
    icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  },
];

function FeatureCard({
  title,
  description,
  icon,
  index,
}: {
  title: string;
  description: string;
  icon: string;
  index: number;
}) {
  return (
    <div className="group rounded-2xl border border-slate-800/60 bg-slate-900/50 p-6 transition hover:border-violet-500/30 hover:bg-slate-900/80 hover:shadow-lg hover:shadow-violet-500/5">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 text-violet-400 transition group-hover:from-violet-500/30 group-hover:to-fuchsia-500/30">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
          <path d={icon} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
    </div>
  );
}

export function FeaturesSection() {
  return (
    <section id="features" className="mt-20 scroll-mt-24 sm:mt-32">
      <div className="text-center">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-violet-400">
          Features
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Everything You Need to Scale
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base text-slate-400">
          Built for Facebook sellers, Instagram shops, and growing brands in Bangladesh.
        </p>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, i) => (
          <FeatureCard key={feature.title} {...feature} index={i} />
        ))}
      </div>
    </section>
  );
}
