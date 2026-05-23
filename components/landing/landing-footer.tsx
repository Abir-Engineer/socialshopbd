import Link from "next/link";

const footerLinks = [
  { label: "About", href: "#owner" },
  { label: "Contact", href: "#footer" },
  { label: "Privacy", href: "#" },
];

export function LandingFooter() {
  return (
    <footer id="footer" className="border-t border-slate-800/70 bg-slate-950/95 py-10 text-slate-400">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 sm:px-8 lg:px-10 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-lg font-semibold text-white">Social Shop BD</p>
          <p className="mt-2 text-sm text-slate-500">Modern SaaS tools for F-commerce sellers.</p>
        </div>

        <div className="flex flex-wrap items-center gap-5 text-sm sm:gap-8">
          <div className="flex gap-4">
            {footerLinks.map((link) => (
              <Link key={link.label} href={link.href} className="transition hover:text-white">
                {link.label}
              </Link>
            ))}
          </div>
          <div className="flex gap-4 text-slate-400">
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="transition hover:text-white">
              Facebook
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="transition hover:text-white">
              LinkedIn
            </a>
            <a href="https://aabir-cmo.netlify.app/" target="_blank" rel="noreferrer" className="transition hover:text-white">
              Portfolio
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
