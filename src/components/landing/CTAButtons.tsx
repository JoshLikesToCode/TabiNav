/**
 * Bottom-of-page CTA banner.
 */
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTABanner() {
  return (
    <section className="relative overflow-hidden bg-primary py-24 text-primary-foreground">
      {/* Subtle pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "radial-gradient(white 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
          Ready to plan your Tokyo adventure?
        </h2>
        <p className="mb-8 text-lg text-primary-foreground/75">
          It only takes a minute. No sign-up, no credit card, no hassle.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            size="xl"
            className="bg-white text-primary hover:bg-white/90"
            asChild
          >
            <Link href="/build">
              Build my trip
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            size="xl"
            variant="outline"
            className="border-white/30 bg-transparent text-white hover:bg-white/10"
            asChild
          >
            <Link href="/t#demo">Try a demo</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
