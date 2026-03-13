"use client";

// Leaflet CSS must live here (inside the ssr:false boundary) so it never
// reaches the static-generation phase where `document` is unavailable.
import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { useEffect, useRef } from "react";
import type { Place, City } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type MapLanguage = "en" | "jp";

// ─── Tile configuration ───────────────────────────────────────────────────────

const TILE_CONFIGS: Record<MapLanguage, { url: string; attribution: string }> = {
  // OSM Japan osm-bright style uses name:en as its primary label field,
  // rendering romanised/English names for Japanese places.
  // No subdomain rotation — single host.
  en: {
    url: "https://tile.openstreetmap.jp/styles/osm-bright/512/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors, &copy; <a href="https://openstreetmap.jp" target="_blank" rel="noreferrer">OpenStreetMap Japan</a>',
  },
  // Standard OSM tiles use the native `name` field — kanji/kana for Japanese POIs.
  jp: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
  },
};

// ─── City centers ─────────────────────────────────────────────────────────────
// Used as the initial map position before fitBounds fires on the first places render.

const CITY_CENTERS: Record<City, L.LatLngTuple> = {
  tokyo: [35.6762, 139.6503],
  kyoto: [35.0116, 135.7681],
};

// ─── Marker ───────────────────────────────────────────────────────────────────

// Hex equivalent of --primary: hsl(22 87% 47%) ≈ rgb(224, 92, 16)
const PRIMARY_HEX = "#E05C10";

// DivIcon avoids the webpack asset-hashing problem that breaks Leaflet's
// default PNG markers in Next.js (no _getIconUrl patch needed).
function createNumberedIcon(index: number): L.DivIcon {
  return L.divIcon({
    className: "", // suppress Leaflet's default white square background
    html: `<div style="
      width:28px;height:28px;border-radius:50%;
      background:${PRIMARY_HEX};color:#fff;
      display:flex;align-items:center;justify-content:center;
      font-size:12px;font-weight:700;font-family:system-ui,sans-serif;
      border:2.5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.28);
    ">${index + 1}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],  // centre of the circle
    popupAnchor: [0, -16], // open popup above the marker
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export interface LeafletMapProps {
  places: Place[];
  mapLanguage: MapLanguage;
  city: City;
}

export default function LeafletMap({ places, mapLanguage, city }: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  // Tracks the active tile layer so we can swap it on language change
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  // Tracks the day-specific layers (markers + polyline) so we can swap them
  // when the active day changes without touching the base tile layer.
  const dayLayersRef = useRef<L.Layer[]>([]);

  // ── Initialize map once ────────────────────────────────────────────────────
  // The `if (mapRef.current) return` guard prevents "Map container is already
  // initialized" when React Strict Mode runs effects twice in development.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: CITY_CENTERS[city],
      zoom: 12,
      scrollWheelZoom: true,
    });

    mapRef.current = map;

    return () => {
      tileLayerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [city]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Swap tile layer when language changes ──────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const { url, attribution } = TILE_CONFIGS[mapLanguage];
    const tile = L.tileLayer(url, { attribution }).addTo(map);
    tileLayerRef.current = tile;
  }, [mapLanguage]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Update markers + polyline when places change ───────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove previous day's markers and route line
    dayLayersRef.current.forEach((layer) => map.removeLayer(layer));
    dayLayersRef.current = [];

    if (places.length === 0) return;

    // Numbered place markers with popup
    places.forEach((place, idx) => {
      const marker = L.marker([place.lat, place.lng], {
        icon: createNumberedIcon(idx),
      }).bindPopup(
        `<div style="font-family:system-ui,sans-serif;min-width:130px">` +
          `<p style="font-weight:700;margin:0 0 3px;font-size:13px">${place.name}</p>` +
          `<p style="color:#888;font-size:11px;margin:0">${place.area}</p>` +
          `</div>`
      );
      marker.addTo(map);
      dayLayersRef.current.push(marker);
    });

    // Dashed polyline connecting stops in order
    if (places.length > 1) {
      const line = L.polyline(
        places.map((p): L.LatLngTuple => [p.lat, p.lng]),
        { color: PRIMARY_HEX, weight: 2.5, opacity: 0.65, dashArray: "7 5" }
      ).addTo(map);
      dayLayersRef.current.push(line);
    }

    // Auto-fit bounds to the day's markers
    const bounds = L.latLngBounds(
      places.map((p): L.LatLngTuple => [p.lat, p.lng])
    );
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 });
  }, [places]);

  return <div ref={containerRef} className="h-full w-full" />;
}
