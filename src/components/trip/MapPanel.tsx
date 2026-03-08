"use client";

import dynamic from "next/dynamic";
import type { LeafletMapProps } from "./LeafletMap";

// ssr: false is mandatory — Leaflet references `window` at module load,
// which crashes during Next.js static generation even inside a client component.
const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-muted/20">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 animate-bounce rounded-full bg-primary"
            style={{ animationDelay: `${i * 120}ms` }}
          />
        ))}
      </div>
    </div>
  ),
});

export function MapPanel({ places, activeDay }: LeafletMapProps) {
  return (
    <div className="h-full overflow-hidden rounded-xl border border-border bg-card shadow-card">
      <LeafletMap places={places} activeDay={activeDay} />
    </div>
  );
}
