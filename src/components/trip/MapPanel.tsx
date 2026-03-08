"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { Place } from "@/lib/types";
import type { MapLanguage } from "./LeafletMap";

const STORAGE_KEY = "tabinav-map-lang";

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

export interface MapPanelProps {
  places: Place[];
}

export function MapPanel({ places }: MapPanelProps) {
  const [mapLanguage, setMapLanguage] = useState<MapLanguage>("en");

  // Clear any stale persisted preference so the map always starts on English.
  // The toggle still writes to localStorage so a JP preference is remembered
  // within the same browser tab, but a fresh page load always resets to EN.
  useEffect(() => {
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  function toggleLanguage(lang: MapLanguage) {
    setMapLanguage(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card">
      {/* Language toggle */}
      <div className="flex shrink-0 items-center justify-end border-b border-border px-3 py-1.5">
        <div className="flex overflow-hidden rounded-md border border-border text-xs font-medium">
          <button
            onClick={() => toggleLanguage("en")}
            className={`px-2.5 py-1 transition-colors ${
              mapLanguage === "en"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            EN
          </button>
          <button
            onClick={() => toggleLanguage("jp")}
            className={`border-l border-border px-2.5 py-1 transition-colors ${
              mapLanguage === "jp"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            日本語
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 overflow-hidden">
        <LeafletMap places={places} mapLanguage={mapLanguage} />
      </div>
    </div>
  );
}
