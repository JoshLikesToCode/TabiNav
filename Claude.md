CLAUDE.md — TabiNav Project Context

You are assisting in building TabiNav (tabinav.com).

TabiNav is a modern, intelligent Japan trip planner designed to:

Reduce wasted transit time

Organize itineraries by proximity and interest

Generate shareable trip links with no authentication

Operate without a database in v1

Be visually polished and product-grade

Be cheap to host (Azure Static Web Apps)

Be demoable within 30 seconds

This is NOT a toy project.
This is a portfolio-quality product.

Core Product Vision

TabiNav is:

A smarter way to plan Japan trips by clustering destinations intelligently and minimizing backtracking.

Primary Differentiator

Proximity-aware itinerary generation

Secondary Features

Interest-based filtering (anime, food, history, nature, tech, traditional)

Budget preference

Shareable link persistence via URL hash

No auth required

Local JSON dataset bundled with frontend

NOT in scope for Week 1

Real transit APIs

Accounts

Database persistence

Advanced clustering algorithms

Drag-and-drop UI

Short links backed by storage

Tech Stack

Frontend

Next.js (App Router)

TypeScript

Tailwind CSS

shadcn/ui

Hosting

Azure Static Web Apps

Persistence Strategy

Trip encoded into URL hash (v=1 schema)

Local dataset JSON bundled with frontend

No backend required in Week 1.

Architecture Rules

Keep data models strongly typed.

Keep components modular and reusable.

Avoid premature complexity.

Favor deterministic algorithms over clever hacks.

Maintain consistent spacing, typography, and layout hierarchy.

Do not introduce authentication unless explicitly requested.

Avoid paid APIs.

Trip Data Model (Authoritative)
export type City = "tokyo"; // | "kyoto" | "osaka" — Week 2+

export type BudgetLevel = '$' | '$$' | '$$$';

export type InterestTag =
  | "culture" | "food" | "nature" | "shopping"
  | "nightlife" | "art" | "history" | "anime" | "architecture";

export interface DayPlan {
  day: number;
  placeIds: string[];
}

export interface Trip {
  v: 1;
  city: City;        // single city per trip (multi-city is Week 2+)
  days: number;
  selectedTags: InterestTag[];
  budget: BudgetLevel;
  dayPlans: DayPlan[];
}

This schema must remain stable unless explicitly versioned.

Places Dataset Structure

Each place must include:

export interface Place {
  id: string;
  name: string;
  nameJa: string;
  city: City;
  category: PlaceCategory;
  tags: InterestTag[];
  cost: BudgetLevel;
  durationMins: number;
  popularity: number;   // 0–100, used for sorting
  description: string;
  area: string;
  lat: number;
  lng: number;
}

Rules

Keep IDs short and consistent.

Keep tag naming consistent.

Avoid typos.

Keep dataset clean and structured.

Itinerary Generation Strategy (Week 1)

Algorithm must:

Filter by selected tags.

Soft-filter by budget.

Sort by popularity descending.

Distribute evenly across selected days.

Return stable deterministic results.

Do not implement K-means or advanced clustering yet.

UI Requirements

UI must:

Feel like a polished SaaS product.

Avoid generic template look.

Use consistent spacing and typography.

Separate concerns cleanly:

Hero

TripWizard

TripViewer

DayColumn

PlaceCard

ShareButton

Be responsive.

Be demo-ready at all times.

Share Link Requirements

Encode Trip as JSON.

Base64 encode.

Store in URL hash.

Must decode safely.

Must fail gracefully.

No backend persistence in v1.

Code Quality Expectations

When generating code:

Do not output pseudocode.

Provide full working files.

Ensure imports are correct.

Avoid unused variables.

Avoid breaking Next.js conventions.

Provide copy-paste ready output.

After generating code, always:

Review for missing imports.

Review for potential runtime errors.

Review for obvious UI inconsistencies.

Provide a “Fix Pass” section if issues are found.

Workflow Discipline

Claude must:

Stay within the current milestone.

Not introduce new features without being asked.

Suggest improvements only if relevant to current scope.

Keep solutions simple unless complexity is requested.

Incidents and What We Learned From Them

---

Incident #001 — bg-primary/8 silently dropped by Tailwind

Issue: bg-primary/8 was used across 6 components for tinted backgrounds but generated no CSS.
Root cause: Tailwind v3's default opacity scale is 0, 5, 10, 20, 25… — the value 8 is a gap. Classes using out-of-scale integers are silently ignored.
Fix: Added opacity: { 8: "0.08" } to theme.extend in tailwind.config.ts.
Lesson: When using non-standard opacity values (anything outside 5, 10, 20, 25, etc.), either use arbitrary syntax bg-primary/[0.08] or explicitly extend the opacity scale. Always verify generated CSS after build.
Preventative guideline: After generating Tailwind classes with custom opacity modifiers, grep the out/ CSS output for the expected value.

---

Incident #002 — Prop removed from interface without fixing call-site

Issue: Removed unused dayNumber from DayColumnProps but did not simultaneously remove the prop from TripViewer.tsx where it was passed — build failed with a TS type error.
Root cause: Interface change without searching for all usages first.
Fix: Removed dayNumber from both the interface and the call-site in TripViewer.tsx.
Lesson: When removing a prop from an interface, always grep for every usage before making the change.
Preventative guideline: Use grep/search before removing any prop from a shared interface.

---

Whenever Claude:

Makes a structural mistake

Breaks a build

Introduces invalid imports

Creates broken logic

Causes deployment failure

Suggests over-engineered solutions

Claude must:

Acknowledge the mistake clearly.

Explain why it happened.

Provide the corrected solution.

Add a short entry to this section summarizing:

The issue

Root cause

Lesson learned

Preventative guideline

This section must grow over time.

This is mandatory.

Project Philosophy

TabiNav is being built as:

A serious portfolio project

A demonstration of structured engineering

A showcase of product thinking

A low-cost, high-quality SaaS prototype

The goal is not speed alone.
The goal is clarity, polish, and intelligent simplicity.

Claude is a collaborator, not a code generator.

Always think in terms of product quality.
