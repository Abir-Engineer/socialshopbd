const features = [
  { title: "Product Management", description: "Organize SKUs, stock, pricing and product variants in one place.", icon: "M4 6h16M4 12h16M4 18h16" },
  { title: "Order Tracking", description: "Track new orders, shipping status and fulfillment updates with ease.", icon: "M5 12h14M12 5v14" },
  { title: "Customer CRM", description: "Save customer profiles, emails, phones and order history automatically.", icon: "M12 14c3.314 0 6-1.79 6-4v-1c0-2.21-2.686-4-6-4s-6 1.79-6 4v1c0 2.21 2.686 4 6 4zm0 2c-4.418 0-8 1.79-8 4v1h16v-1c0-2.21-3.582-4-8-4z" },
  { title: "Analytics Dashboard", description: "See revenue, product performance and growth in one elegant view.", icon: "M5 12h14M12 5v14" },
  { title: "Multi-shop Support", description: "Manage multiple storefronts and seller channels from one dashboard.", icon: "M4 7h16M4 12h10M4 17h7" },
  { title: "Staff Management", description: "Add team members, assign roles, and control permissions quickly.", icon: "M6 8h12M6 12h8M6 16h6" },
];

function FeatureCard({ title, description, icon }: { title: string; description: string; icon: string }) {
  return (
    <div className="rounded-[2rem] border border-slate-800/80 bg-slate-900/85 p-6 shadow-2xl shadow-slate-950/20 transition hover:border-sky-500/60">
      <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-slate-800 text-sky-400">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
          <path d={icon} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
    </div>
  );
}

export function FeaturesSection() {
  return (
    <section id="features" className="mt-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-sky-400">Key features</p>
          <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Everything your online shop needs</h2>
        </div>
        <p className="max-w-xl text-sm leading-7 text-slate-400 sm:text-base">
          Social Shop BD helps small brands manage inventory, orders, customers and analytics with the speed and clarity of modern SaaS.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {features.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </div>
    </section>
  );
}
