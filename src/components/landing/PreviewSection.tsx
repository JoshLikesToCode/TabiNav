/**
 * PreviewSection — product mockup used in the hero and as a standalone section.
 * Pure CSS; no real data dependencies.
 */

const SAMPLE_PLACES = [
  {
    n: 1,
    name: "Senso-ji Temple",
    sub: "Asakusa · 2 h",
    tags: ["Culture", "History"],
    time: "9:00 – 11:00 AM",
    emoji: "🏯",
  },
  {
    n: 2,
    name: "Tsukiji Outer Market",
    sub: "Tsukiji · 1.5 h",
    tags: ["Food"],
    time: "11:30 AM – 1:00 PM",
    emoji: "🐟",
  },
  {
    n: 3,
    name: "Shinjuku Gyoen",
    sub: "Shinjuku · 2 h",
    tags: ["Nature"],
    time: "1:30 – 3:30 PM",
    emoji: "🌸",
  },
  {
    n: 4,
    name: "Shimokitazawa",
    sub: "Shimokitazawa · 2.5 h",
    tags: ["Art", "Nightlife"],
    time: "4:00 – 6:30 PM",
    emoji: "🎸",
  },
];

export function AppMockup() {
  return (
    <div
      className="w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-card shadow-elevated"
      style={{ maxWidth: 380 }}
    >
      {/* Browser chrome */}
      <div className="flex items-center gap-1.5 border-b border-border bg-muted/50 px-3 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
        <div className="ml-2 flex-1 rounded bg-background/80 px-3 py-0.5 text-[10px] text-muted-foreground">
          tabinav.com/t#...
        </div>
      </div>

      {/* App top bar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="text-sm font-bold tracking-tight text-foreground">
          TabiNav
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Tokyo · Day 1</span>
          <span className="rounded-md bg-primary px-2 py-1 text-[10px] font-semibold text-primary-foreground">
            Share ↗
          </span>
        </div>
      </div>

      {/* Day tabs */}
      <div className="flex gap-1 border-b border-border bg-muted/30 px-4 py-2">
        {["Day 1", "Day 2", "Day 3"].map((d, i) => (
          <span
            key={d}
            className={
              i === 0
                ? "rounded-md bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                : "px-3 py-1 text-xs text-muted-foreground"
            }
          >
            {d}
          </span>
        ))}
      </div>

      {/* Place cards */}
      <div className="space-y-2 p-4">
        {SAMPLE_PLACES.map((p) => (
          <div
            key={p.n}
            className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 shadow-card"
          >
            {/* Number + emoji */}
            <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-full bg-primary/8 text-sm">
              <span>{p.emoji}</span>
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {p.name}
              </p>
              <p className="text-xs text-muted-foreground">{p.sub}</p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {p.time}
                </span>
                {p.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-primary/8 px-2 py-0.5 text-[10px] font-medium text-primary"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PreviewSection() {
  return (
    <section className="bg-muted/40 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Here&apos;s what your itinerary looks like
          </h2>
          <p className="text-lg text-muted-foreground">
            A clean, day-by-day view of your trip — drag to reorder any stop,
            with estimated times and a shareable link ready to go.
          </p>
        </div>
        <div className="flex justify-center">
          <div className="w-full max-w-sm">
            <AppMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
