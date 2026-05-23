const testimonials = [
  {
    name: "Rina Akter",
    role: "F-commerce Seller",
    quote: "Social Shop BD helped me manage orders and customers in one place. It feels like a real business partner.",
  },
  {
    name: "Tanvir Hasan",
    role: "Store Manager",
    quote: "The platform keeps my products organized and the analytics make every decision easier.",
  },
  {
    name: "Nazia Sultana",
    role: "Digital Shop Owner",
    quote: "I love the clean workflow. Managing multiple shops has never been simpler.",
  },
];

export function TestimonialsSection() {
  return (
    <section className="mt-24">
      <div className="text-center">
        <p className="text-sm uppercase tracking-[0.35em] text-sky-400">Testimonials</p>
        <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">What Social Shop BD customers say</h2>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {testimonials.map((item) => (
          <blockquote key={item.name} className="rounded-[2rem] border border-slate-800/70 bg-slate-900/90 p-6 shadow-2xl shadow-slate-950/20">
            <p className="text-sm leading-7 text-slate-300">“{item.quote}”</p>
            <footer className="mt-6 text-sm text-slate-400">
              <p className="font-semibold text-white">{item.name}</p>
              <p>{item.role}</p>
            </footer>
          </blockquote>
        ))}
      </div>
    </section>
  );
}
