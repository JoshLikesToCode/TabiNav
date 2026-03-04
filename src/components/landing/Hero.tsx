import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppMockup } from "./PreviewSection";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-background">
      {/* Dot-grid texture */}
      <div className="hero-dot-grid absolute inset-0 opacity-60" />

      {/* Radial glow */}
      <div
        className="pointer-events-none absolute -top-32 right-0 h-[600px] w-[600px] rounded-full opacity-20"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 py-20 lg:grid-cols-2 lg:py-28">
          {/* ── Left: copy ── */}
          <div className="max-w-xl animate-fade-up">
            {/* Eyebrow */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Tokyo itineraries — instant &amp; free
            </div>

            {/* Headline */}
            <h1 className="mb-5 text-5xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-6xl lg:text-[4rem]">
              Your Japan trip,
              <br />
              <span className="text-primary">planned</span> in minutes.
            </h1>

            {/* Sub-copy */}
            <p className="mb-8 text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Tell us your style — culture, food, nightlife — and get a
              personalised day-by-day Tokyo itinerary you can share with a
              single link.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3">
              <Button size="xl" asChild>
                <Link href="/build">
                  Build my trip
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="xl" variant="outline" asChild>
                <Link href="/t#demo">Try a demo</Link>
              </Button>
            </div>

            {/* Trust line */}
            <p className="mt-5 text-sm text-muted-foreground">
              No account needed · 100% free · Shareable link
            </p>
          </div>

          {/* ── Right: app mockup ── */}
          <div
            className="animate-fade-up hidden lg:flex lg:justify-end"
            style={{ animationDelay: "120ms" }}
          >
            <AppMockup />
          </div>
        </div>

        {/* Mobile mockup below copy */}
        <div className="pb-20 lg:hidden">
          <AppMockup />
        </div>
      </div>
    </section>
  );
}
