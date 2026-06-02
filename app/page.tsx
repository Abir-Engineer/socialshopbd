import type { Metadata } from "next";
import { LandingHeader } from "@/components/landing/landing-header";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HowItWorksSection } from "@/components/landing/how-it-works";
import { OwnerSection } from "@/components/landing/owner-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { CTASection } from "@/components/landing/cta-section";
import { LandingFooter } from "@/components/landing/landing-footer";

export const metadata: Metadata = {
  title: "Social Shop BD - Smart Commerce Management Platform",
  description:
    "Products, Orders, Customers, Analytics and Team Management — everything in one platform for Facebook Sellers, Online Shops & Growing Businesses.",
  openGraph: {
    title: "Social Shop BD - Smart Commerce Management Platform",
    description:
      "Manage your business from one powerful dashboard. Built for Facebook sellers and growing businesses.",
  },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <LandingHeader />
      <main className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <OwnerSection />
        <PricingSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <LandingFooter />
    </div>
  );
}
