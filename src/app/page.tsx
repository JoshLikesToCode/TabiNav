import Link from "next/link";
import Image from "next/image";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { PreviewSection } from "@/components/landing/PreviewSection";
import { CTABanner } from "@/components/landing/CTAButtons";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* ── Global nav ── */}
      <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" aria-label="TabiNav home">
            <Image
              src="/images/tabinav-logo.png"
              alt="TabiNav"
              height={96}
              width={144}
              className="h-24 w-auto"
              priority
            />
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-2">
            <Link
              href="/t#demo"
              className="hidden rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:block"
            >
              Try demo
            </Link>
            <Link
              href="/build"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Build my trip →
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Sections ── */}
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <PreviewSection />
        <CTABanner />
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm font-semibold text-foreground">
              TabiNav
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                Japan trip planner
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              Week 1 MVP · Tokyo only · No auth · No database
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
