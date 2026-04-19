# CLAUDE.md — TabiNav Project Context

## Project Vision

**TabiNav** (tabinav.com) is a modern, intelligent Japan trip planner designed to:

- Reduce wasted transit time
- Organize itineraries by proximity and interest
- Generate shareable trip links with no authentication
- Operate without a database in v1
- Be visually polished and product-grade
- Be cheap to host (Azure Static Web Apps)
- Be demoable within 30 seconds

> This is **NOT** a toy project. This is a portfolio-quality product.

**Primary differentiator:** Proximity-aware itinerary generation — smarter Japan trip planning by clustering destinations intelligently and minimizing backtracking.

---

## Secondary Features (Week 1)

- Interest-based filtering: anime, food, history, nature, art, culture, shopping, nightlife, architecture
- Budget preference (Budget / Moderate / Premium)
- Shareable link persistence via URL hash — no auth required
- Local JSON dataset bundled with frontend

## Not in Scope for Week 1

- Real transit APIs
- Accounts or database persistence
- Advanced clustering algorithms (K-means, etc.)
- Drag-and-drop UI
- Short links backed by storage

---

## Osaka — Planned Places (add when city is enabled)

The following places are queued for `places.osaka.v1.json` once Osaka is added as a supported `City`. Enable the city by: adding `"osaka"` to `City` in `types.ts`, `VALID_CITIES` in `hash.ts`, `VALID_PLACE_CITIES` and `CITY_PLACES` in `itinerary.ts`, `CITY_CENTERS` in `LeafletMap.tsx`, moving Osaka from `CITIES_SOON` to `CITIES` in `TripWizard.tsx`, and adding an entry to `CITY_TAG_SUGGESTIONS` in `TripViewer.tsx`.

| id | Name | Area | Category | Tags | Cost | Duration | Popularity |
|---|---|---|---|---|---|---|---|
| `osaka-castle` | Osaka Castle | Chuo | landmark | history, culture, architecture | $ | 120 | 90 |
| `dotonbori` | Dotonbori & Glico Sign | Namba | district | food, nightlife, entertainment | $ | 120 | 95 |
| `namba` | Namba District | Namba | district | shopping, food, entertainment | $ | 120 | 85 |
| `kuromon-market` | Kuromon Ichiba Market | Chuo | food | food, culture | $ | 90 | 78 |
| `shinsekai` | Shinsekai | Naniwa | district | food, history, culture | $ | 90 | 72 |
| `shitennoji` | Shitennoji Temple | Tennoji | temple | history, culture | $ | 90 | 68 |
| `umeda-sky-building` | Umeda Sky Building | Kita | landmark | architecture | $$ | 90 | 80 |
| `sumiyoshi-taisha` | Sumiyoshi Grand Shrine | Sumiyoshi | shrine | culture, history, architecture | $ | 60 | 65 |
| `kaiyukan` | Osaka Aquarium Kaiyukan | Minato | entertainment | nature | $$ | 150 | 82 |
| `edion-arena-osaka` | EDION Arena Osaka (sumo) | Namba | entertainment | culture, history | $$ | 120 | 55 |
| `america-mura` | Amerika Mura | Chuo | district | shopping, art, culture | $ | 90 | 62 |
| `harukas300` | Abeno Harukas 300 | Abeno | landmark | architecture | $$ | 60 | 75 |

**Notes:**
- Dotonbori description should prominently feature the Glico Running Man sign and the neon-lit canal.
- EDION Arena Osaka (大阪府立体育会館) hosts the Haru Basho (spring sumo tournament) each March.
- Don Quijote Dotonbori (with the iconic rooftop Ferris wheel) can be folded into the Dotonbori entry or given its own `donki-dotonbori` shopping entry.
- Osaka Castle city center: lat `34.6937`, lng `135.5023`.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router), `output: "export"` |
| Language | TypeScript (strict) |
| Styles | Tailwind CSS v3, custom design tokens |
| Components | shadcn/ui pattern, CVA variants |
| Icons | lucide-react |
| Toasts | sonner |
| Drag-and-drop | @dnd-kit/core + @dnd-kit/sortable |
| Hosting | Azure Static Web Apps |

**Persistence:** Trip encoded into URL hash (v=1 schema, base64url). Local dataset JSON bundled with frontend. No backend.

---

## Architecture Rules

- Keep data models strongly typed — no loose `string` where a union type exists.
- Keep components modular and reusable.
- Avoid premature complexity.
- Favor deterministic algorithms over clever hacks.
- Maintain consistent spacing, typography, and layout hierarchy.
- Do **not** introduce authentication unless explicitly requested.
- Do **not** use paid APIs.
- Do **not** add features outside the current milestone.
- Validate external data at boundaries (URL hash decode, future API calls) — do not use `as X` casts to paper over missing validation.

---

## Data Models (Authoritative)

```typescript
export type City = "tokyo"; // | "kyoto" | "osaka" — Week 2+

export type BudgetLevel = "$" | "$$" | "$$$";

export type InterestTag =
  | "culture" | "food" | "nature" | "shopping"
  | "nightlife" | "art" | "history" | "anime" | "architecture";

export type PlaceCategory =
  | "temple" | "shrine" | "garden" | "food" | "shopping"
  | "museum" | "entertainment" | "park" | "district" | "landmark";

export interface Place {
  id: string;
  name: string;
  nameJa: string;
  city: City;
  category: PlaceCategory;
  tags: InterestTag[];
  cost: BudgetLevel;
  durationMins: number;
  popularity: number;   // 0–100, used for sort ordering
  description: string;
  area: string;
  lat: number;
  lng: number;
}

export interface DayPlan {
  day: number; // 1-indexed
  placeIds: string[];
}

export interface Trip {
  v: 1;
  city: City;              // single city per trip — multi-city is Week 2+
  days: number;
  selectedTags: InterestTag[];
  budget: BudgetLevel;
  dayPlans: DayPlan[];
}
```

> **This schema must remain stable unless explicitly versioned.** Bump `v` and update `hash.ts` decode logic for any breaking change.

### URL Hash Payload (compact keys)

```json
{ "v": 1, "c": "tokyo", "d": 3, "b": "$$", "t": ["culture","food"], "i": [["id1","id2"], ...] }
```

---

## Dataset Rules

- `id` values: short, lowercase, hyphenated, stable.
- `tags`: values from the `InterestTag` union only.
- `cost`: values from `BudgetLevel` only.
- `popularity`: integer 0–100. Higher values surface first in the itinerary generator.
- `area` names: match the UI — avoid typos.

---

## Itinerary Generation Strategy

1. Filter places where `cost` ≤ selected `budget` tier.
2. Filter to places sharing at least one tag with `selectedTags` (skip if no tags chosen).
3. **Sort by `popularity` descending.**
4. Greedily fill each day with up to **480 minutes** (8 hours) of activity, using each place's `durationMins` plus a **30-minute travel buffer** between stops. Roll over to the next day when the limit is reached.
5. Return stable, deterministic results — same inputs → same output.

Constants: `MAX_DAY_MINUTES = 480`, `TRAVEL_BUFFER_MINS = 30`. No `PLACES_PER_DAY` constant — place count per day is determined by duration.

Do **not** implement K-means or advanced clustering yet.

---

## UI Requirements

- Feel like a polished SaaS product — avoid generic template look.
- Use consistent spacing and typography.
- Be responsive (mobile-first).
- Be demo-ready at all times.

### Component Map

| Component | Responsibility |
|---|---|
| `Hero` | Landing headline + CTA |
| `TripWizard` | Multi-step form: city / days / interests / budget |
| `TripViewer` | Day-tabs + place list + map panel |
| `DayColumn` | Ordered place cards for one day |
| `PlaceCard` | Single destination card with schedule time |
| `ShareButton` | Copy-to-clipboard with toast feedback |
| `MapPanel` | Leaflet/OSM map with EN/JP tile toggle and localStorage persistence |
| `SortablePlaceCard` | `useSortable` wrapper around PlaceCard with GripVertical drag handle |

---

## Share Link Requirements

- Encode `Trip` as compact JSON → base64url → store in `window.location.hash`.
- Validate enum fields (`city`, `budget`, `tags`) on decode — reject unknown values by returning `null`.
- Fail gracefully to an error state in `TripViewer`.
- No backend persistence in v1.

---

## Copy & Spelling Conventions

- **American English** throughout: `personalized`, `customize` (not British `-ised`/`-ise`).
- Primary CTA: **"Build my trip"** (landing) / **"Build my itinerary"** (wizard submit button).
- Demo link label: **"Try a demo"** (with article, consistent).
- No-auth value prop: **"No account needed"** (short) or **"No sign-up required"** (long).

---

## Code Quality Expectations

When generating code:

- Provide full working files — no pseudocode.
- Ensure all imports are correct and used.
- Avoid unused variables.
- Avoid `as X` type casts that bypass validation — validate at system boundaries instead.
- Avoid breaking Next.js App Router conventions.
- Provide copy-paste ready output.

After generating code, always review for:

- Missing imports
- Potential runtime errors
- Obvious UI inconsistencies

Provide a **Fix Pass** section if issues are found.

---

## Workflow Discipline

- Stay within the current milestone.
- Do not introduce new features without being asked.
- Suggest improvements only if relevant to current scope.
- Keep solutions simple unless complexity is explicitly requested.

---

## Incidents and What We Learned From Them

### Incident #001 — `bg-primary/8` silently dropped by Tailwind

**Issue:** `bg-primary/8` was used across 6 components for tinted backgrounds but generated no CSS.
**Root cause:** Tailwind v3's default opacity scale is `0, 5, 10, 20, 25…` — the value `8` is a gap. Out-of-scale integers are silently ignored.
**Fix:** Added `opacity: { 8: "0.08" }` to `theme.extend` in `tailwind.config.ts`.
**Lesson:** When using non-standard opacity values, use arbitrary syntax `bg-primary/[0.08]` or extend the opacity scale explicitly.
**Preventive guideline:** After adding Tailwind opacity modifiers, grep the compiled CSS for the expected value.

---

### Incident #002 — Prop removed from interface without fixing call-site

**Issue:** Removed unused `dayNumber` from `DayColumnProps` without removing the prop from `TripViewer.tsx` where it was passed — build failed with a TS type error.
**Root cause:** Interface change without searching all usages first.
**Fix:** Removed `dayNumber` from both the interface and the call-site.
**Lesson:** When removing a prop from a shared interface, always grep for every usage before making the change.

---

### Incident #003 — `ring-primary/15` silently dropped (same root cause as #001)

**Issue:** `ring-primary/15` in `PlaceCard.tsx` used `/15` which is not in the default Tailwind opacity scale.
**Root cause:** Same as Incident #001 — non-default integer opacity values are silently ignored.
**Fix:** Changed to `ring-primary/20` (in the default scale).
**Lesson:** The opacity scale gap issue applies to all Tailwind color modifier classes — not just `bg-*`. Check `ring-*`, `text-*`, `border-*` as well.

---

### Incident #004 — react-leaflet peer dep conflict with React 19

**Issue:** `react-leaflet@^4.2.1` declares `peerDependencies: { "react": "^17.0 || ^18.0" }`. Installing it into a React 19 project causes `npm install` to fail with a peer dependency conflict.
**Root cause:** react-leaflet v4 was released before React 19 and its peer dep range wasn't updated. The library works fine at runtime with React 19; the conflict is only a version-range check.
**Fix:** Added an `"overrides"` block to `package.json` pointing react-leaflet's peer dep at the project's own `$react` and `$react-dom` versions:
```json
"overrides": { "react-leaflet": { "react": "$react", "react-dom": "$react-dom" } }
```
**Lesson:** When adding libraries with outdated peer dep ranges to a bleeding-edge React project, use `overrides` (npm) rather than `--legacy-peer-deps` or `--force`, which are per-install flags that vanish from the project record.
**Preventive guideline:** Before `npm install` of any UI library, check its `peerDependencies` against the project's React version. If stale, add `overrides` to `package.json` so the fix is committed with the project.

---

### Incident #005 — Leaflet default markers broken in Next.js (webpack asset hashing)

**Issue:** Leaflet's default `L.Icon.Default` attempts to resolve its PNG assets via a `_getIconUrl` method at module load time. Webpack's content-hash renaming of image files breaks this URL lookup, producing broken marker icons or a runtime error.
**Root cause:** Leaflet uses a CommonJS `require()` call inside `_getIconUrl` to locate the images. Webpack renames those assets and the relative path no longer resolves.
**Fix:** Used `L.divIcon()` (custom HTML marker) for all markers instead of the default icon. No PNG assets are referenced, no `_getIconUrl` patch needed.
**Lesson:** In any Next.js/webpack project, prefer `L.divIcon()` for Leaflet markers. It avoids the asset pipeline problem entirely, renders faster (no PNG fetch), and gives full design control.
**Preventive guideline:** Never use `L.Icon.Default` in a Next.js project. Always define markers with `L.divIcon()` or supply explicit absolute icon URLs.

---

### Incident #006 — Leaflet `window` reference crashes static generation

**Issue:** Importing Leaflet (even inside a `"use client"` component) caused the Next.js static export build to crash because Leaflet touches `window` at module evaluation time, before any React lifecycle runs.
**Root cause:** `output: "export"` still runs a Node.js SSR pass to generate static HTML. `"use client"` marks a component as client-only at *runtime*, but the module is still imported and evaluated during the SSR/build phase.
**Fix:** Used `next/dynamic` with `{ ssr: false }` to defer the entire Leaflet import to the browser. The `dynamic()` wrapper lives in `MapPanel.tsx`; the actual Leaflet code lives in `LeafletMap.tsx`.
**Lesson:** `"use client"` alone is not sufficient to exclude browser-only libraries from the build phase. Any module that references `window`, `document`, or `navigator` at module load (not just inside component code) must be loaded via `dynamic({ ssr: false })`.
**Preventive guideline:** For any third-party library that is known to use browser globals at load time (Leaflet, certain charting libs, etc.), always wrap it in a `dynamic` import with `ssr: false` regardless of whether the consumer already has `"use client"`.

---

### Incident #007 — react-leaflet `MapContainer` crashes with "Map container is already initialized"

**Issue:** Using `react-leaflet`'s `<MapContainer>` in a Next.js project with React Strict Mode caused a runtime error: `"Map container is already initialized"`. The map worked on first load but threw on every subsequent mount.
**Root cause:** React Strict Mode deliberately mounts effects twice in development to detect side effects. `react-leaflet` v4's `MapContainer` sets `_leaflet_id` on the container DOM element but does not reliably remove it in its cleanup — so the second mount attempt finds `_leaflet_id` already set and Leaflet throws.
**Fix:** Replaced `react-leaflet`'s declarative `<MapContainer>` / `<TileLayer>` / `<Marker>` components with a fully imperative implementation using raw `useEffect` + `useRef`. The guard `if (mapRef.current) return` at the top of the initialization effect prevents double-init entirely — the second Strict Mode invocation is a no-op.
**Lesson:** `react-leaflet`'s component API has a known, unfixed Strict Mode bug in v4. When using Leaflet in any React 18+ project (including Next.js dev mode), use the imperative `L.map()` / `useRef` pattern directly. This also removes the `react-leaflet` peer dep conflict with React 19.
**Preventive guideline:** Do not use `react-leaflet`'s `MapContainer` in Next.js projects. Use `leaflet` directly with `useRef<L.Map>` + `useEffect` lifecycle management.

---

### Incident #008 — Trailing comma left in `package.json` after `overrides` block removal

**Issue:** Editing `package.json` to remove the `"overrides"` block left a trailing comma after the `"devDependencies"` closing brace, making the file invalid JSON. `npm install` failed immediately.
**Root cause:** JSON does not allow trailing commas. The edit removed the content of the block but left the comma separating it from the preceding block.
**Fix:** Removed the trailing comma manually.
**Lesson:** When deleting a JSON block, always check that the preceding entry's trailing comma is also removed.
**Preventive guideline:** After any JSON file edit that removes a top-level key, re-read the file and verify the surrounding commas are consistent before running any command that parses it.

---

### Incident #009 — Map language toggle was inverted: wrong tile URLs assigned to wrong keys

**Issue:** The EN button showed Japanese kanji labels; the 日本語 button showed English/romanized labels. Three rounds of debugging were required.
**Root cause — what the tile servers actually render:**
- `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` (standard OSM) renders the OSM `name` field, which for Japanese POIs is in kanji/kana. This is the **Japanese** tile.
- `https://tile.openstreetmap.jp/styles/osm-bright/512/{z}/{x}/{y}.png` (OSM Japan osm-bright style) explicitly prioritises `name:en` as its primary label field, rendering romanised/English place names. This is the **English** tile.
- CartoDB Voyager (`basemaps.cartocdn.com/rastertiles/voyager`) was attempted as an English alternative; it uses `name:latin` which is sparsely populated in Tokyo OSM data, resulting in all-Japanese labels in practice. **Do not use CartoDB as an English tile source for Japan.**
**Fix:** Assigned the correct URL to each key: `en → tile.openstreetmap.jp/styles/osm-bright`, `jp → tile.openstreetmap.org`.
**Additional fix:** Removed localStorage restoration on mount so the map always opens on EN regardless of any stale stored preference from previous sessions.
**Lesson:** Never assume a tile server's language behaviour — verify empirically in-browser. The standard OSM tile server renders in the local script of the data, not in English. The OSM Japan osm-bright style is the confirmed working source for English-readable Tokyo maps.
**Preventive guideline:** When adding tile sources for language variants, note which OSM field each server uses (`name` vs `name:en` vs `name:latin`) as a code comment, and verify the rendered output before shipping.

---

### Incident #010 — Dead `activeDay` prop persisted across three components



**Issue:** `LeafletMapProps` included `activeDay: number` which was accepted by `LeafletMap.tsx` but never used. `MapPanel.tsx` forwarded it blindly. `TripViewer.tsx` passed it at both call-sites. The prop carried zero information — the day filter was already applied upstream before passing `places`.
**Root cause:** The prop was added during initial scaffold "just in case", then the component evolved to receive pre-filtered `places` and `activeDay` became dead weight. No type error surfaced because TypeScript has no "unused prop" warning for components.
**Fix:** Removed `activeDay` from `LeafletMapProps`, added own `MapPanelProps`, and removed the prop from both `<MapPanel>` call-sites in `TripViewer.tsx`.
**Lesson:** "Just in case" props accumulate coupling debt. A prop that is not read inside a component is a contract obligation with no return.
**Preventive guideline:** When adding a prop to a component, use it immediately or don't add it. Audit prop interfaces when refactoring — treat unused props the same as unused variables.

---

### Incident #011 — `"entertainment"` used as a place tag but missing from `InterestTag` union

**Issue:** Six entries in `places.tokyo.v1.json` and one in `places.kyoto.v1.json` used `"entertainment"` as a tag. `loadPlaces()` validates every tag against `VALID_PLACE_TAGS` using `.every()` — a single invalid tag causes the entire entry to be silently dropped. All seven places were being excluded from itinerary generation.
**Root cause:** `"entertainment"` is a valid `PlaceCategory` value but was never added to the `InterestTag` union. The dataset author used category names as tags, which is plausible but requires keeping both sets in sync.
**Fix:** Added `"entertainment"` to `InterestTag` in `types.ts`, to `VALID_TAGS` in `hash.ts`, to `VALID_PLACE_TAGS` in `itinerary.ts`, to `TAG_COLORS` in `PlaceCard.tsx` (`bg-rose-50 text-rose-700`), and to the `INTERESTS` array in `TripWizard.tsx`.
**Lesson:** Dataset tags must be validated against the type system at write time, not just at load time. Silent drops in `loadPlaces()` are intentional for malformed data but should never be caused by valid semantic categories missing from the type.
**Preventive guideline:** When adding a new tag value to any dataset entry, first check it exists in `InterestTag`. If it doesn't, add it to all five locations: `types.ts`, `hash.ts`, `itinerary.ts`, `PlaceCard.tsx` (`TAG_COLORS`), `TripWizard.tsx` (`INTERESTS`).

---

### Incident #012 — `createPortal` inside a dnd-kit sortable caused sheet to never open

**Issue:** `PlaceDetailSheet` was rendered via `createPortal(…, document.body)` from inside `SortablePlaceCard`. Clicking place cards did nothing — the sheet never appeared. The Leaflet map received the click instead (user saw "the map area highlights").
**Root cause:** `createPortal` escapes the DOM tree for *rendering* but does NOT escape the React fiber/event tree. `SortablePlaceCard` is a descendant of `DndContext` in the React tree. dnd-kit processes pointer events for its managed draggables through that same fiber subtree. The click event was consumed within the dnd-kit tree before React could commit the portal to the DOM; the raw DOM click then fell through to the Leaflet map underneath.
**Fix:** Lifted `selectedPlaceInfo` state to `TripViewer`. Threaded an `onPlaceClick` callback down through `DayColumn` → `SortablePlaceCard`. Portal rendered once in `TripViewer`, as a sibling of `DndContext` (outside it entirely), so dnd-kit's event handling has no path to the sheet.
**Lesson:** A portal rendered from inside `DndContext` is still a React child of dnd-kit's context and subject to its synthetic event processing. `createPortal` only moves DOM placement — it does not move the component out of its React ancestor's event scope.
**Preventive guideline:** Never render `createPortal` from inside a dnd-kit sortable or draggable component. Lift modal/sheet/drawer state to a common ancestor that is a sibling of (or above) `DndContext`, and render the portal from there.

---

### Incident #013 — Leaflet z-index panes escaped their stacking context and covered the detail sheet

**Issue:** The `PlaceDetailSheet` portal rendered briefly, then the Leaflet map immediately covered it. The sheet was behind the map.
**Root cause:** Leaflet's `.leaflet-top` / `.leaflet-bottom` panes are `position: absolute; z-index: 1000`. The Leaflet container div has `position: relative` (set by Leaflet's JS) but **no explicit `z-index`**, so it has `z-index: auto` and does NOT create a stacking context. Without a stacking context, Leaflet's children escape into the root stacking context and their z-index 1000 is compared directly against the sheet portal's `z-50` (= 50). 1000 > 50 — map wins.
**Fix:** Added `isolate` (`isolation: isolate`) to the Leaflet container div in `LeafletMap.tsx`. This forces the container to create its own stacking context, trapping all Leaflet panes inside it. The container itself has no explicit z-index (auto = 0 in the root), so the portal at z-50 is now above the entire map.
**Lesson:** A `position: relative` element with no z-index does NOT create a stacking context — its absolutely-positioned children with explicit z-indexes participate in the parent stacking context, not a local one. Any library (like Leaflet) that uses high internal z-indexes must be wrapped in a stacking context to prevent bleeding into the page.
**Preventive guideline:** Wrap any third-party component that uses high internal z-indexes (Leaflet, charting libs, video players) in `isolation: isolate` (`isolate` in Tailwind). Never assume a container with `position: relative` contains its children's z-indexes — it only does if it also has a non-auto z-index (or other stacking-context-forming properties like `isolate`, `transform`, `filter`).

---

### Incident #014 — Vitest JSX transform conflict with Next.js `tsconfig.json`

**Issue:** Integration tests using `.tsx` files failed with: _"Failed to parse source for import analysis because the content contains invalid JS syntax. If you use tsconfig.json, make sure to not set jsx to preserve."_
**Root cause:** `tsconfig.json` sets `"jsx": "preserve"` — required by Next.js's SWC compiler. Vitest 4 uses `oxc` as its default transformer. Neither oxc nor Vite's `vite:import-analysis` plugin can process raw JSX without an explicit JSX transform step. The first fix attempt (`esbuild.jsx: "automatic"`) was silently ignored because Vitest 4's oxc transformer takes precedence over the `esbuild` config key.
**Fix:** Installed `@vitejs/plugin-react` as a dev dependency and added `plugins: [react()]` to `vitest.config.ts`. This plugin transforms JSX to standard JS *before* `vite:import-analysis` runs, resolving the conflict without touching `tsconfig.json`.
**Lesson:** Never try to resolve a JSX transform mismatch by editing `tsconfig.json` in a Next.js project — that will break the production build. In Vitest 4+, the `esbuild` config key is ignored when oxc is active; `@vitejs/plugin-react` is the correct override.
**Preventive guideline:** When setting up Vitest in a Next.js project, always install and configure `@vitejs/plugin-react` in `vitest.config.ts` from the start. Do not rely on `esbuild` config keys — they are silently ignored in Vitest 4+.

---

> Whenever Claude makes a structural mistake, breaks a build, introduces invalid imports, creates broken logic, causes a deployment failure, or suggests over-engineered solutions, it **must**:
> 1. Acknowledge the mistake clearly.
> 2. Explain why it happened.
> 3. Provide the corrected solution.
> 4. Add a short entry to this section.

---

## Project Philosophy

TabiNav is being built as a serious portfolio project, a demonstration of structured engineering, and a showcase of product thinking — a low-cost, high-quality SaaS prototype.

> The goal is not speed alone. The goal is **clarity, polish, and intelligent simplicity.**
>
> Claude is a collaborator, not a code generator. Always think in terms of product quality.
