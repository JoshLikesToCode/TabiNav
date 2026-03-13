"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateItinerary } from "@/lib/itinerary";
import { encodeTripToHash } from "@/lib/hash";
import { cn, BUDGET_LABELS, BUDGET_DESCRIPTIONS } from "@/lib/utils";
import type { BudgetLevel, InterestTag, City } from "@/lib/types";

// ─── Config ──────────────────────────────────────────────────────────────────

const CITIES: { id: City; label: string }[] = [
  { id: "tokyo", label: "Tokyo" },
  { id: "kyoto", label: "Kyoto" },
];

// Cities that are planned but not yet supported — shown as disabled chips.
const CITIES_SOON: string[] = ["Osaka"];

const INTERESTS: { id: InterestTag; label: string; emoji: string }[] = [
  { id: "culture", label: "Culture", emoji: "🏯" },
  { id: "food", label: "Food", emoji: "🍜" },
  { id: "nature", label: "Nature", emoji: "🌸" },
  { id: "shopping", label: "Shopping", emoji: "🛍️" },
  { id: "nightlife", label: "Nightlife", emoji: "🌙" },
  { id: "art", label: "Art", emoji: "🎨" },
  { id: "history", label: "History", emoji: "📜" },
  { id: "anime", label: "Anime", emoji: "🎌" },
  { id: "architecture", label: "Architecture", emoji: "🏗️" },
];

const BUDGETS: BudgetLevel[] = ["$", "$$", "$$$"];

// ─── Component ───────────────────────────────────────────────────────────────

export function TripWizard() {
  const [city, setCity] = useState<City>("tokyo");
  const [days, setDays] = useState(3);
  const [tags, setTags] = useState<InterestTag[]>([]);
  const [budget, setBudget] = useState<BudgetLevel>("$$");
  const [generating, setGenerating] = useState(false);

  function toggleTag(tag: InterestTag) {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function handleGenerate() {
    setGenerating(true);
    // Give the UI a frame to show the loading state before the sync work
    requestAnimationFrame(() => {
      try {
        const trip = generateItinerary(city, days, tags, budget);
        const hash = encodeTripToHash(trip);
        window.location.href = `/t#${hash}`;
      } catch {
        setGenerating(false);
      }
    });
  }

  const canGenerate = days > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Nav ── */}
      <header className="border-b border-border bg-card px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <Image
            src="/images/tabinav-logo.png"
            alt="TabiNav"
            height={80}
            width={120}
            className="h-20 w-auto"
            priority
          />
          <div className="w-16" aria-hidden />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        {/* Headline */}
        <div className="mb-10">
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground">
            Build your trip
          </h1>
          <p className="text-muted-foreground">
            Answer three questions and we&apos;ll craft your itinerary.
          </p>
        </div>

        <div className="space-y-8">
          {/* ── Section 1: City ── */}
          <Section
            number="01"
            title="Where are you going?"
            hint="Osaka coming soon"
          >
            <div className="flex flex-wrap gap-2">
              {CITIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCity(c.id)}
                  className={cn(
                    "rounded-xl border px-5 py-3 text-sm font-semibold transition-all",
                    c.id === city
                      ? "border-primary bg-primary/8 text-primary ring-1 ring-primary/20"
                      : "border-border bg-card text-foreground hover:border-primary/30 hover:bg-primary/5"
                  )}
                >
                  {c.label}
                </button>
              ))}
              {CITIES_SOON.map((label) => (
                <div key={label} className="relative">
                  <button
                    disabled
                    className="cursor-not-allowed rounded-xl border border-border bg-muted/40 px-5 py-3 text-sm font-semibold text-muted-foreground opacity-50"
                  >
                    {label}
                  </button>
                  <span className="absolute -right-1 -top-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-bold uppercase text-muted-foreground">
                    Soon
                  </span>
                </div>
              ))}
            </div>
          </Section>

          {/* ── Section 2: Days ── */}
          <Section number="02" title="How many days?">
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={cn(
                    "h-11 w-11 rounded-xl border text-sm font-semibold transition-all",
                    d === days
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/5"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {days} day{days !== 1 ? "s" : ""} · up to 8 hours of activity per day
            </p>
          </Section>

          {/* ── Section 3: Interests ── */}
          <Section
            number="03"
            title="What are you into?"
            hint="Pick as many as you like — or none for a balanced mix"
          >
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((interest) => {
                const selected = tags.includes(interest.id);
                return (
                  <button
                    key={interest.id}
                    onClick={() => toggleTag(interest.id)}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all",
                      selected
                        ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/25"
                        : "border-border bg-card text-foreground hover:border-primary/30 hover:bg-primary/5"
                    )}
                  >
                    <span>{interest.emoji}</span>
                    {interest.label}
                  </button>
                );
              })}
            </div>
            {tags.length > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                {tags.length} selected
              </p>
            )}
          </Section>

          {/* ── Section 4: Budget ── */}
          <Section number="04" title="What's your budget?">
            <div className="grid grid-cols-3 gap-3">
              {BUDGETS.map((b) => (
                <button
                  key={b}
                  onClick={() => setBudget(b)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl border p-4 text-center transition-all",
                    b === budget
                      ? "border-primary bg-primary/8 ring-1 ring-primary/25"
                      : "border-border bg-card hover:border-primary/30 hover:bg-primary/5"
                  )}
                >
                  <span
                    className={cn(
                      "text-xl font-bold",
                      b === budget ? "text-primary" : "text-foreground"
                    )}
                  >
                    {b}
                  </span>
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      b === budget ? "text-primary" : "text-foreground"
                    )}
                  >
                    {BUDGET_LABELS[b]}
                  </span>
                  <span className="text-[10px] leading-tight text-muted-foreground">
                    {BUDGET_DESCRIPTIONS[b]}
                  </span>
                </button>
              ))}
            </div>
          </Section>

          {/* ── Generate CTA ── */}
          <div className="pt-2">
            <Button
              size="xl"
              disabled={!canGenerate || generating}
              onClick={handleGenerate}
              className="w-full"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Building your trip…
                </>
              ) : (
                <>
                  Build my itinerary
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Generates a shareable link · No account needed
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── Section wrapper ─────────────────────────────────────────────────────────

function Section({
  number,
  title,
  hint,
  children,
}: {
  number: string;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
          {number}
        </span>
        <div>
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {hint && (
            <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}
