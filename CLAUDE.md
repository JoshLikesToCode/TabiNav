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

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router), `output: "export"` |
| Language | TypeScript (strict) |
| Styles | Tailwind CSS v3, custom design tokens |
| Components | shadcn/ui pattern, CVA variants |
| Icons | lucide-react |
| Toasts | sonner |
| Hosting | Azure Static Web Apps |

**Persistence:** Trip encoded into URL hash (v=1 schema, base64url). Local dataset JSON bundled with frontend. No backend in Week 1.

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

## Itinerary Generation Strategy (Week 1)

1. Filter places where `cost` ≤ selected `budget` tier.
2. Filter to places sharing at least one tag with `selectedTags` (skip if no tags chosen).
3. **Sort by `popularity` descending.**
4. Distribute evenly across selected days (4 places/day).
5. Return stable, deterministic results — same inputs → same output.

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
| `MapPanel` | Coordinate-ready map placeholder (Leaflet — Week 2) |

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
- Map placeholder: **"Map coming in Week 2"** (consistent across mobile bar and MapPanel).
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
