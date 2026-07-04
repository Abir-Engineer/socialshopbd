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
  title: "SocialShopBD — The All-in-One Commerce OS for Bangladesh",
  description:
    "Products, Orders, Customers, Analytics & Team — all in one platform built for Facebook sellers, Instagram shops & growing brands in Bangladesh.",
  openGraph: {
    title: "SocialShopBD — The All-in-One Commerce OS for Bangladesh",
    description:
      "Your entire business. One dashboard. Built for Bangladeshi sellers.",
  },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <LandingHeader />
      <main className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-10">
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
