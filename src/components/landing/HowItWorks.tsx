import { Sliders, CalendarDays, Share2 } from "lucide-react";

const STEPS = [
  {
    icon: Sliders,
    step: "01",
    title: "Tell us your style",
    description:
      "Pick your interests — temples, street food, nightlife — and set a budget. Tokyo to start; more cities coming soon.",
  },
  {
    icon: CalendarDays,
    step: "02",
    title: "Get your itinerary",
    description:
      "We curate a day-by-day schedule with the best spots for your preferences, complete with estimated times.",
  },
  {
    icon: Share2,
    step: "03",
    title: "Share with anyone",
    description:
      "Copy your unique link and share it instantly. No login, no app download, no account ever needed.",
  },
];

export function HowItWorks() {
  return (
    <section className="bg-background py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto mb-16 max-w-xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
            How it works
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            From zero to itinerary in 60 seconds
          </h2>
        </div>

        {/* Steps grid */}
        <div className="grid gap-8 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.step} className="relative">
              {/* Connector line (hidden on last) */}
              {i < STEPS.length - 1 && (
                <div className="absolute left-[calc(50%+2.5rem)] top-8 hidden h-px w-[calc(100%-5rem)] bg-border md:block" />
              )}

              <div className="relative flex flex-col items-center text-center">
                {/* Icon circle */}
                <div className="relative mb-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/8 ring-1 ring-primary/15">
                    <s.icon className="h-7 w-7 text-primary" />
                  </div>
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                </div>

                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  {s.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {s.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
