import Link from "next/link";

const plans = [
  {
    name: "Starter",
    price: "৳499",
    period: "/month",
    description: "Perfect for small shops getting started.",
    features: ["Products", "Orders", "CRM", "Analytics"],
    href: "/signup",
    highlighted: false,
  },
  {
    name: "Business",
    price: "৳999",
    period: "/month",
    description: "For growing teams that need more power.",
    features: [
      "Everything in Starter",
      "Staff Management",
      "Advanced Analytics",
      "Priority Support",
    ],
    href: "/signup",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large operations with custom needs.",
    features: [
      "Multi Shop",
      "Dedicated Support",
      "Custom Features",
      "SLA Guarantee",
    ],
    href: "/contact",
    highlighted: false,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="mt-32 scroll-mt-24">
      <div className="text-center">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-violet-400">
          Pricing
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Simple, transparent pricing
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base text-slate-400">
          Choose the plan that fits your business. No hidden fees.
        </p>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative rounded-2xl border p-8 ${
              plan.highlighted
                ? "border-violet-500/50 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 shadow-xl shadow-violet-500/10"
                : "border-slate-800/60 bg-slate-900/50"
            }`}
          >
            {plan.highlighted && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="inline-flex rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-1 text-xs font-semibold text-white shadow-lg">
                  Most Popular
                </span>
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">{plan.price}</span>
                <span className="text-sm text-slate-400">{plan.period}</span>
              </div>
              <p className="mt-2 text-sm text-slate-400">{plan.description}</p>
            </div>

            <ul className="mb-8 space-y-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm text-slate-300">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="h-4 w-4 shrink-0 text-violet-400"
                  >
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            <Link
              href={plan.href}
              className={`block w-full rounded-xl py-3 text-center text-sm font-semibold transition ${
                plan.highlighted
                  ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25 hover:opacity-90"
                  : "border border-slate-700 bg-slate-800/50 text-slate-200 hover:border-slate-500 hover:text-white"
              }`}
            >
              {plan.name === "Enterprise" ? "Contact Us" : "Get Started"}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
