/**
 * MapPanel — Week 1 placeholder.
 *
 * Layout matches the final Leaflet panel dimensions so the shell can be
 * dropped in during Week 2 without touching the parent layout.
 *
 * Week 2 TODO:
 *  1. npm install leaflet react-leaflet @types/leaflet
 *  2. Replace the inner div with <MapContainer> + <TileLayer> + <Marker> components.
 *  3. Import leaflet CSS in layout.tsx.
 */

import { Map } from "lucide-react";
import type { Place } from "@/lib/types";

interface MapPanelProps {
  places: Place[];
  activeDay?: number;
}

export function MapPanel({ places, activeDay }: MapPanelProps) {
  return (
    <div className="relative flex h-full min-h-[400px] flex-col overflow-hidden rounded-xl border border-border map-placeholder">
      {/* Placeholder content */}
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/60 shadow-card">
          <Map className="h-8 w-8 text-slate-400" />
        </div>
        <div>
          <p className="font-semibold text-slate-600">
            Interactive map
          </p>
          <p className="mt-1 text-sm text-slate-400">Coming in Week 2</p>
        </div>
      </div>

      {/* Coordinates list — useful reference for when Leaflet is wired up */}
      {places.length > 0 && (
        <div className="border-t border-white/50 bg-white/40 px-4 py-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            {activeDay != null ? `Day ${activeDay} · ` : ""}
            {places.length} location{places.length !== 1 ? "s" : ""}
          </p>
          <ul className="space-y-1">
            {places.slice(0, 6).map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between text-[11px] text-slate-500"
              >
                <span className="truncate font-medium">{p.name}</span>
                <span className="ml-3 shrink-0 font-mono text-slate-400">
                  {p.lat.toFixed(4)}, {p.lng.toFixed(4)}
                </span>
              </li>
            ))}
            {places.length > 6 && (
              <li className="text-[11px] text-slate-400">
                +{places.length - 6} more
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Week 2 badge */}
      <div className="absolute right-3 top-3 rounded-full bg-white/70 px-2.5 py-1 text-[10px] font-semibold text-slate-500 shadow-sm">
        Leaflet ready
      </div>
    </div>
  );
}
