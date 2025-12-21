# Legacy chart suite → new microviz system (port plan)

This doc inventories the “legacy React” chart suite living in the demo and maps each pattern to the **minimum @microviz/core + @microviz/renderers + @microviz/elements capabilities** needed to recreate it using the new deterministic RenderModel pipeline.

Source inventory:
- `packages/demo/src/react/patterns.tsx`: “Patterns” gallery (51 cards)
- `packages/demo/src/react/aggregate.tsx`: “Aggregate” gallery (29 cards)

Local reference repos (for patterns + implementation ideas):
- TanStack Router: `~/study/typescript/tanstack-router/`
- TanStack Virtual: `~/study/typescript/tanstack-virtual/`
- TanStack Table: `~/study/typescript/tanstack-table/`
- TanStack Devtools: `~/study/typescript/tanstack-devtools/`
- TanStack Store: `~/study/typescript/tanstack-store/`
- Chart system references: `~/study/typescript/{carbon-charts,carbon,billboard.js,plotly.js,nivo}/`
- Prior art (in-house): `~/work/cv/packages/react/` (Router + Virtual patterns)

---

## What “ready to port the full suite” means

We’re “ready” when:
- Core can express the full gallery as **RenderModels** (data-only, serializable).
- Renderers can render those models on at least **SVG string** + **Canvas**.
- Elements can mount those models (and/or compute from spec+data) with stable defaults.
- The dev loop makes it cheap to catch “blank/incorrect render” regressions:
  - Tier 0: core model tests (fast)
  - Tier 2: selective visual checks (slower, authoritative)

## Derivative charts are first‑class

microviz isn’t “one chart per file forever.” We explicitly support **derivative/composite charts**:
- Compute a base `RenderModel` (often by reusing an existing `spec.type`).
- Add/modify `marks` and/or `defs` (separators, overlays, tracks, gloss, filters).
- When a derivative pattern proves itself, promote it to a first‑class `spec.type` entry in core (with Tier‑0 tests + element wrapper).

Examples already used in the demo:
- **Segmented Pill**: `stacked-bar` + separator `line` marks.
- **Pixel Pill (glossy)**: `pixel-pill` + `linearGradient` + overlay `rect`.
- **Orbital**: `segmented-ring` + background/core/track marks.
- **Noise Displacement fixture**: `stacked-bar` + `filter` defs (`turbulence → displacementMap`).

---

## Current status (2025-12-18)

### Core + renderer capabilities
- ✅ Mark-level paint + opacity (`fill`, `stroke`, `fillOpacity`, `strokeOpacity`, `strokeWidth`, `opacity`) across SVG string + Canvas.
- ✅ Mark types: `rect`, `path`, `text`, `circle`, `line`.
- ✅ Defs: `linearGradient` end-to-end (SVG string + Canvas `url(#id)` fill support).
- ✅ Defs: `clipRect` is supported by SVG string + React + Canvas renderers (used by `pixel-treemap`).
- ✅ Defs for texture parity:
  - ✅ SVG string + React + SVG DOM support: `pattern`, `mask`, `filter` (drop-shadow + gaussian blur + turbulence + displacementMap).
  - ✅ Canvas parity: `pattern`, `mask`, `filter` (drop-shadow + gaussian blur + turbulence + displacementMap) when `OffscreenCanvas` ImageData APIs are available.
  - 🟡 Without `OffscreenCanvas`, Canvas ignores `turbulence`/`displacementMap` (demo can optionally fall back to SVG for parity).

### Charts currently implemented (core + elements + demo)
These exist as first-class `spec.type` values in `@microviz/core` and are covered by Tier‑0 tests:
- ✅ `sparkline`
- ✅ `step-line`
- ✅ `spark-area` (linearGradient defs)
- ✅ `range-band`
- ✅ `bullet-delta`
- ✅ `dumbbell`
- ✅ `bar`
- ✅ `histogram` (mini histogram)
- ✅ `code-minimap`
- ✅ `heatgrid`
- ✅ `dot-matrix`
- ✅ `barcode`
- ✅ `waveform`
- ✅ `pixel-grid`
- ✅ `pixel-treemap`
- ✅ `pixel-pill`
- ✅ `pixel-column`
- ✅ `dot-row`
- ✅ `shape-row`
- ✅ `dot-cascade`
- ✅ `mosaic`
- ✅ `stacked-bar`
- ✅ `stacked-chips`
- ✅ `segmented-bar`
- ✅ `progress-pills`
- ✅ `bitfield` (mask-backed dot grid; pattern parity works via fill rules)
- ✅ `gradient-fade` (linearGradient defs)
- ✅ `stripe-density` (pattern defs)
- ✅ `perforated` (pattern/mask defs)
- ✅ `masked-wave` (mask defs)
- ✅ `pattern-tiles` (pattern defs)
- ✅ `skyline`
- ✅ `cascade-steps`
- ✅ `ranked-lanes`
- ✅ `lollipop`
- ✅ `variable-ribbon`
- ✅ `faded-pyramid` (linearGradient defs)
- ✅ `pipeline`
- ✅ `chevron`
- ✅ `tapered`
- ✅ `interlocking`
- ✅ `dna-helix`
- ✅ `matryoshka`
- ✅ `layered-waves`
- ✅ `hand-of-cards`
- ✅ `shadow-depth`
- ✅ `split-ribbon`
- ✅ `micro-heatline`
- ✅ `stepped-area`
- ✅ `pareto`
- ✅ `bullet-gauge`
- ✅ `two-tier`
- ✅ `split-pareto`
- ✅ `donut`
- ✅ `nano-ring`
- ✅ `segmented-ring`
- ✅ `orbital-dots`
- ✅ `concentric-arcs`
- ✅ `concentric-arcs-horiz`
- ✅ `radial-bars`
- ✅ `radial-burst`
- ✅ `vertical-stack`
- ✅ `equalizer`
- ✅ `sparkline-bars`

### Next pragmatic wins (engineering ergonomics)
- ✅ **Chart registry** abstraction in core (2025-12-16): normalize/layout defaults/marks/defs/a11y + empty-data metadata are centralized behind a single registry entry per chart.
- ✅ Remove remaining type clutter (2025-12-16): move per-chart `*Spec`, `*Data`, and `Normalized*` declarations out of `packages/core/src/compute.ts` (keep `@microviz/core` exports stable).
- ✅ Modularize chart implementations (2025-12-16): move each chart definition into `packages/core/src/charts/*` with a `charts/registry.ts`, leaving `compute.ts` as the orchestrator.
- ✅ Split Tier‑0 tests per chart (2025-12-16): move chart determinism checks into `packages/core/src/charts/*.test.ts`, keep pipeline invariants in `packages/core/src/compute.test.ts`.
- ✅ Add registry coverage enforcement (2025-12-16): `packages/core/src/charts/registry-coverage.test.ts` ensures every registered chart type has a matching per‑chart test file.
- ✅ Remove unused `ComputeModelInput.measurer` (2025-12-16): the input wasn’t wired into any chart/layout path yet; removed to avoid a dead API surface until text measurement lands.
- ✅ De-dupe tiny math helpers (2025-12-16): extract cycle-safe `packages/core/src/utils/*` so `packages/core/src/index.ts` and `packages/core/src/charts/shared.ts` share the same implementations.
- ✅ Demo wiring (2025-12-16): derive the demo chart ID lists (sidebar/options) from core chart types to prevent “new chart missing” regressions.
- ✅ Elements coverage (2025-12-17): add chart-specific custom elements for more charts and keep the demo “Elements” surface rendering (chart element when available, otherwise `<microviz-model>`).

### Next pragmatic wins (demo UX + performance: TanStack)
These don’t change the rendering pipeline, but they make the demo a better engineering tool:

- ✅ **Route-level code splitting:** gallery route is lazy-loaded via TanStack Router (`packages/demo/src/routes/gallery.tsx`).
  - Goal: fast reloads + faster first paint in the playground.
  - Reference: `~/study/typescript/tanstack-router/` and `~/work/cv/packages/react/src/router.tsx`.
- ✅ **Shareable repro links:** Playground state is encoded in URL search params (`packages/demo/src/routes/index.tsx`, `packages/demo/src/playground/playgroundUrlState.ts`).
  - Goal: copy/paste a link that reproduces a rendering/perf issue.
  - Reference: `~/work/cv/packages/react/src/hud/url-state.ts` (compact encoding + zod adapter).
- ✅ **Virtualize the chart grid:** TanStack Virtual is used to render only visible chart cards (`packages/demo/src/playground/MicrovizPlayground.tsx`).
  - Goal: reduce DOM/render work and unlock “compute models only for visible charts (+ overscan)” later.
  - Reference: `~/study/typescript/tanstack-virtual/` and `~/work/cv/packages/react/src/HUD.tsx` (`useVirtualizer`).
- ✅ **Virtualize long gallery pages:** patterns/aggregate galleries now render virtualized rows for smooth scroll (`packages/demo/src/react/patterns.tsx`, `packages/demo/src/react/aggregate.tsx`).

---

### Next pragmatic wins (accessibility-first defaults)
Keep core deterministic and data-only; push semantics to elements and tokens to themes.

- **Core a11y summary:** extend `A11yTree` with a structured summary (min/max/last/trend, count, series/segment totals) computed in core and stored in `RenderModel.a11y`.
- **Per-mark a11y items:** optional `a11y.items[]` entries with `{ id, label, value, series, rank }` for screen readers and keyboard focus; still data-only.
- **Elements wiring:** map `a11y` to `ElementInternals` (`role`, `aria-label`, `aria-description`), add SR-only summary/table, and implement roving tabindex + arrow-key focus that updates `InteractionState.focusedMarkId`.
- **Theme tokens:** add focus-ring tokens + `prefers-contrast: more` and `prefers-reduced-motion` support in `@microviz/themes` (no polyfills).
- **Warnings:** when renderers omit marks/defs, emit `aria-live="polite"` warnings in elements/demo (no auto-fallback).
- **Tests:** Tier‑0 for a11y summaries/labels; Tier‑1 for element ARIA wiring and keyboard focus paths.

---

## Capability unlock map (minimal primitives → maximum charts)

### Unlock 0 (done)
- `RenderModel` with `rect|path|text|circle|line` marks.
- SVG string renderer for those marks.
- Canvas renderer for those marks.
- Elements: `<microviz-model>` mounts any `RenderModel`; chart-specific elements cover common charts (see `packages/elements/src/index.ts`).

This gets us a working deterministic pipeline + surfaces; most visual variety comes from Unlock 1+.

### Unlock 1 (done)
Add **per-mark paint + opacity**:
- Mark-level `fill`, `stroke`, `fillOpacity`, `strokeOpacity`, `strokeWidth`, `opacity`.
- Canvas renderer must respect mark-level paint (not global `fillStyle/strokeStyle` only).

Why this is the biggest unlock:
- Pixel grids, mosaics, dot rows, pies/rings, and most “distribution” patterns rely on per-segment colors.

### Unlock 2 (done)
Add mark types:
- `circle` (needed for dots, ring dashes, endpoints, orbital, etc.)
- `line` (needed for bullet/dumbbell/radial bars)

### Unlock 3 (done)
Add defs + references:
- ✅ `linearGradient` defs (e.g. spark-area).
- ✅ `clipRect` defs (SVG string + React + Canvas support exists; used by `pixel-treemap`).
- ✅ `pattern` defs (stripes/dots/crosshatch/waves) in SVG string + React + SVG DOM.
- ✅ `mask` defs (masked wave / CSS-mask parity patterns) in SVG string + React + SVG DOM.
- ✅ `filter` defs (drop-shadow + gaussian blur + turbulence + displacementMap) in SVG string + React + SVG DOM.
- ✅ Canvas parity: `pattern`, `mask`, `filter` (drop-shadow + gaussian blur + turbulence + displacementMap) when `OffscreenCanvas` ImageData APIs are available.

### Unlock 4 (done for flow/clip-path shapes)
We use **Option A:** express these as `path` marks directly (polygons) instead of relying on `clipPath`.

### Unlock 5 (optional, if we want to keep CSS-first effects as-is)
Add an **experimental HTML renderer surface** (positioned divs) while **deferring strict parity** for the first iteration.

Many “Texture & Creative” effects can be re-expressed in SVG via defs (Unlock 3), so an HTML renderer is not strictly required, but it reduces work for box-shadow / CSS-mask-heavy variants.

Pragmatic default: **ship HTML as experimental** once we want those effects, while keeping parity requirements lightweight initially. Keep any remaining CSS-only experiments in the demo until then.

### Experimental HTML renderer (parity deferred) — integration plan
Initial goal: provide a fast HTML surface for CSS-first patterns, without promising SVG/Canvas parity yet.
- **Render surface:** add `html` to demo renderer picker (left panel) as “HTML (experimental)”.
- **Policy (v1):** supports `rect`/`circle`/`line`/`text` only. Ignores `path` marks. Supports `linearGradient`, `pattern`, `mask`, `clipRect`, and `filter` defs (dropShadow/gaussianBlur only); other defs/effects are ignored. Use SVG/Canvas for full fidelity.
- **Renderer implementation:** map `RenderModel` marks to absolutely positioned HTML elements:
  - `rect` → `<div>` with `position:absolute`, `background`, `borderRadius`, `opacity`.
  - `circle` → `<div>` with `borderRadius:9999px`, `background`, `opacity`.
  - `line` → `<div>` with rotation and stroke width.
  - `text` → `<div>` with absolute positioning + anchor/baseline transforms.
- **Defs/filters:** support `linearGradient`, `pattern`, `mask`, `clipRect`, and `filter` (dropShadow/gaussianBlur only); other defs/effects remain ignored and must warn.
- **A11y:** reuse `model.a11y` for `aria-label` on the HTML surface.
- **Telemetry:** show loud warnings in the demo if a chart uses unsupported mark types/defs. **Do not auto-fallback** to other renderers; broken output is acceptable to expose gaps.

---

## Inventory + port classification

Legend:
- **SVG-easy:** port to RenderModel + SVG with Unlock 1–2
- **Defs:** needs Unlock 3 (gradients/patterns/masks/filters)
- **Poly/Path:** needs polygon/path marks (Unlock 4)
- **CSS-heavy:** easiest if we keep HTML/CSS renderer or accept SVG rewrite cost
- ✅ indicates a chart/pattern already has a dedicated `@microviz/core` implementation (see “Current status”).

### A) Patterns gallery (`patterns.tsx`)

#### 1) Micro-Charts (SVG)
- Sparkline — SVG-easy (path + circle) → Unlock 1–2 ✅
- Spark Area — Defs (linearGradient) → Unlock 1–3 ✅
- Mini Histogram — SVG-easy (rects + opacity) → Unlock 1 ✅
- Range Band — SVG-easy (band path + line + circle) → Unlock 1–2 ✅
- Heatgrid — SVG-easy (rect grid + opacity) → Unlock 1 ✅
- Bullet Delta — SVG-easy (line + circles + small triangle path) → Unlock 1–2 ✅
- Dumbbell — SVG-easy (line + circles w/ stroke) → Unlock 1–2 ✅

#### 2) Activity Cadence
- Activity Cadence (HUD) — SVG-easy rewrite (bars) → Unlock 1 ✅
- Tight Bars — SVG-easy rewrite (bars) → Unlock 1 ✅
- Dot Matrix — SVG-easy rewrite (circles) → Unlock 1–2 ✅
- Rounded Bars — SVG-easy (rect rx) → Unlock 1 ✅
- Gradient Bars — Defs (linearGradient) → Unlock 1–3 ✅
- Step Line — SVG-easy (path) → Unlock 1 ✅

#### 3) Texture & Creative
- Bitfield — Defs (mask-backed dot grid) → Unlock 3 ✅
- Stripe Density — Defs (pattern) or CSS-heavy → Unlock 3 (preferred) / Unlock 5 ✅
- Gradient Fade — Defs (linearGradient) or CSS-heavy → Unlock 3 / Unlock 5 ✅
- Perforated — Defs (pattern/mask) or CSS-heavy → Unlock 3 / Unlock 5 ✅
- Masked Wave — Defs (mask) → Unlock 3 ✅

#### 4) Discrete & Grid
- Pixel Grid (32 cells) — SVG-easy rewrite (rect grid) → Unlock 1 ✅
- Barcode (48 bins) — SVG-easy rewrite (rect grid, crisp edges) → Unlock 1 (+ root shapeRendering hint) ✅
- Waveform — SVG-easy rewrite (rect bars) → Unlock 1 ✅
- Dot Cascade — SVG-easy rewrite (circles) → Unlock 1–2 ✅

#### 5) Specialty Patterns
- Mosaic (long-tail) — SVG-easy rewrite (rects) → Unlock 1 ✅
- Concentric Arcs (horiz) — SVG-easy rewrite (open stroked paths) → Unlock 1–2 ✅
- Split Ribbon — SVG-easy rewrite (rects) → Unlock 1 ✅
- Micro Heatline — SVG-easy rewrite (thin rects) → Unlock 1 ✅
- Radial Burst (conic) — SVG-easy rewrite (arc paths) → Unlock 1–2 ✅

#### 6) Foundational Patterns
- Stacked Bar — SVG-easy rewrite (rect segments) → Unlock 1 ✅
- Segmented Bar — SVG-easy rewrite (rect segments + gaps) → Unlock 1 ✅
- Progress Pills — SVG-easy rewrite (rects w/ rounding strategy) → Unlock 1 ✅
- Dot Row — SVG-easy rewrite (circles) → Unlock 1–2 ✅

#### 7) Hierarchy-First
- Skyline — SVG-easy rewrite (rect bars) → Unlock 1 ✅
- Cascade Steps — SVG-easy rewrite (rect bars) → Unlock 1 ✅
- Ranked Lanes — SVG-easy rewrite (thin rects) → Unlock 1 ✅
- Lollipop — SVG-easy rewrite (rect + circle) → Unlock 1–2 ✅
- Variable Ribbon — SVG-easy rewrite (rects, varying heights) → Unlock 1 ✅
- Faded Pyramid — Defs (linearGradient) or accept “flat fill” → Unlock 3 (preferred) ✅

#### 8) Flow & Direction
All of these are easiest as polygon `path` marks (no clip-path dependency):
- Pipeline — Poly/Path → Unlock 4 ✅
- Chevron — Poly/Path → Unlock 4 ✅
- Tapered — Poly/Path → Unlock 4 ✅
- Interlocking — Poly/Path → Unlock 4 ✅
- DNA Helix — SVG-easy rewrite (rounded rects) → Unlock 1 ✅

#### 9) Depth & Layering
- Matryoshka — SVG-easy rewrite (overlapping rects) + optional Defs (shadow) → Unlock 1 (+ Unlock 3 if SVG shadow parity) ✅
- Layered Waves — SVG-easy rewrite (rounded rects with opacity) → Unlock 1 ✅
- Hand of Cards — SVG-easy rewrite (overlapping rounded rects) + optional Defs (shadow) → Unlock 1 (+ Unlock 3) ✅
- Shadow Depth — Defs (filter) → Unlock 3 ✅
- Stepped Area — SVG-easy rewrite (rect steps) → Unlock 1 ✅

#### 10) Analytical Patterns
- Pareto — SVG-easy rewrite (cumulative rect heights) → Unlock 1 ✅
- Bullet Gauge — SVG-easy rewrite (rect segments + midpoint line) → Unlock 1–2 ✅
- Two-Tier — SVG-easy rewrite (two rows of rects) → Unlock 1 ✅
- Split-Pareto — SVG-easy rewrite (rects + divider) → Unlock 1–2 ✅

### B) Aggregate gallery (`aggregate.tsx`)

Most of these are already SVG or trivial to rewrite to SVG marks:

#### Circles / Rings
- Nano Ring — SVG-easy (circle dash) → Unlock 1–2 ✅
- Mini Pie — SVG-easy (arc paths) → Unlock 1 ✅
- Orbital — SVG-easy (rect bg + circles + dashed circle ring) → Unlock 1–2 ✅ (composed from `segmented-ring`)
- Orbital Dots — SVG-easy (circles) → Unlock 1–2 ✅

#### Grids / Mosaics
- Dot Matrix — SVG-easy rewrite (circles) → Unlock 1–2 ✅
- Mosaic Grid — SVG-easy rewrite (rect grid) → Unlock 1 ✅
- Bit Grid — SVG-easy rewrite (rect grid) → Unlock 1 ✅
- Mosaic 8×8 — SVG-easy (already SVG rects) → Unlock 1 ✅ (via `pixel-grid` + interleave)
- Pixel Treemap — SVG-easy rewrite (rects + rounding) → Unlock 1 ✅

#### Mini-charts
- Code Minimap — SVG-easy (rects) → Unlock 1 ✅
- Barcode Strip — SVG-easy (rects, crisp edges) → Unlock 1 ✅
- Equalizer — SVG-easy (rects) → Unlock 1 ✅
- Sparkline Bars — SVG-easy rewrite (rects) → Unlock 1 ✅

#### Bars
- Stacked Bar — SVG-easy rewrite (rect segments) → Unlock 1 ✅
- Bar + Gaps — SVG-easy rewrite (rect segments + gaps) → Unlock 1 ✅
- Progress Pills — SVG-easy rewrite (rounded rects) → Unlock 1 ✅
- Segmented Pill — SVG-easy rewrite (rounded rects + dividers) → Unlock 1–2 ✅
- Pixel Pill — SVG-easy rewrite (rects) → Unlock 1 ✅
- Curved Bar — SVG-easy (rounded rects) → Unlock 1 ✅ (composed from `progress-pills`)
- Stacked Chips — SVG-easy rewrite (overlap + ordering) → Unlock 1 ✅
- Pattern Tiles — Defs (pattern fills) → Unlock 3 ✅
- Vertical Stack — SVG-easy rewrite (vertical segments) → Unlock 1 ✅
- Pixel Column — SVG-easy rewrite (rects) → Unlock 1 ✅

#### Circular
- Donut — SVG-easy rewrite (arc paths) → Unlock 1 ✅
- Segmented Ring — SVG-easy (circle dash) → Unlock 1–2 ✅
- Concentric Arcs — SVG-easy (circle dash) → Unlock 1–2 ✅
- Radial Bars — SVG-easy (line marks) → Unlock 1–2 ✅

#### Odd
- Shape Row — SVG-easy (circle + rect + path) → Unlock 1–2 ✅
- Dot Row — SVG-easy rewrite (circles) → Unlock 1–2 ✅

---

## Recommended port order (least churn, maximum unlock)

### Phase 1: “SVG foundation” (unlocks most charts)
Deliverables:
- ✅ Unlock 1–2 in core + renderers (per-mark paint + circle + line).
- ✅ Port “Aggregate mini-charts” (no demo-only render paths).

This gives you immediate confidence that:
- core computation is producing real models (not blank)
- SVG and Canvas stay in sync

### Phase 2: “Distribution primitives” (segments, bins, grids)
Deliverables:
- Shared core helpers for:
  - segment layout (stacked/segmented)
  - discrete allocation (cells/bins)
  - cumulative transforms (pareto)
- ✅ Port: Stacked Bar, Segmented Bar, Progress Pills, Dot Row, Pixel Grid, Barcode, Mosaic, Skyline, Ranked Lanes, Pareto.

### Phase 3: “Flow shapes” (polygons/paths)
Deliverables:
- Path/polygon helpers (Pipeline/Chevron/Tapered/Interlocking).
- Ensure layering/paint order is stable.

### Phase 4: “Defs + texture parity”
Deliverables:
- ✅ Linear gradients in model + SVG renderer (Unlock 3).
- ✅ Patterns/masks/filters in model + SVG renderer (Unlock 3).
- ✅ Port Texture & Creative + Pattern Tiles.
- ✅ Decision: keep SVG-only for “Shadow Depth” / heavy CSS effects; defer Unlock 5 (HTML renderer) until proven necessary.

---

## Dev loop (fast QA while porting)

### One-command loop (demo + core tests)
Run:
- `pnpm dev:loop`

This runs:
- `pnpm --filter @microviz/demo dev` (interactive preview)
- `pnpm --filter @microviz/core test:watch` (fast Tier‑0 checks)

### Per-change checklist while porting a chart
1. Add/adjust core computation for the chart spec and ensure `RenderModel.stats.warnings` stays empty.
2. Add a Tier‑0 unit test in `@microviz/core` for the chart:
   - assert `markCount > 0`
   - assert no NaNs/out-of-bounds
   - snapshot the `RenderModel` (or key parts of it)
3. Add the chart to the demo “Vanilla surfaces” selector so you can flip:
   - SVG string
   - SVG DOM
   - Canvas
   - OffscreenCanvas (worker)
   - Elements
4. When touching renderer fidelity or defs, add/update a visual baseline in:
   - `pnpm --filter @microviz/demo test:visual` (and `test:visual:update` when intentional)

---

## Definition of done for a ported chart

A chart is considered “ported” when:
- Core: computation is deterministic and covered by Tier‑0 tests.
- Renderers: at least SVG string output is correct; Canvas matches for geometry.
- Elements: chart can be mounted as a Custom Element (either chart-specific element or a generic host).
- Demo: chart is present in the Vanilla harness for quick surface switching.

---

## Inspirational scan (2025-12-18)

This section is *not* about turning microviz into a full charting suite. It’s a list of “worth stealing” habits from mature chart systems, while staying inside the **microviz constitution** (ESM-only, Baseline 2025, deterministic core, CSS-first theming, no DOM APIs in `core`/`renderers`).

### Carbon Charts + Carbon Design System (IBM)
- **Optional legend + tooltip primitives**: Carbon’s `legend`/`tooltip` options are feature-toggled and highly configurable (formatters, truncation, ordering). For microviz, the analog should live in `@microviz/elements` (or demo helpers), not in `@microviz/core`.
- **Theme variants**: Carbon’s “white / g10 / g90 / g100” worldview is a good reminder that *background + contrast* is the theme axis users actually care about. microviz can express this as CSS theme presets (variables + `@layer microviz`) rather than JS theme objects.
- **Truncation as a first-class concern**: Carbon treats truncation rules as a deliberate design choice. In microviz, that likely maps to (a) text measurement + ellipsis helpers and/or (b) “no text under X px” container-query defaults.
- **“Skeleton/empty” patterns**: Carbon popularized predictable empty/loading states. microviz already emits high-signal warnings (`EMPTY_DATA`, `BLANK_RENDER`); we can add an element-level “skeleton” mode without infecting the deterministic core.

### billboard.js
- **Modular, tree-shakeable features**: billboard’s “import only what you need” posture is compatible with microviz’s registry architecture. Long-term, we can consider per-chart entry points (or build-time registries) to keep bundles tiny without adding complexity to `computeModel`.
- **Sparkline ergonomics**: billboard’s sparkline plugin is a reminder that micro charts benefit from *purpose-built defaults* (minimal chrome, hover affordances, tiny tooltips) rather than a generic “big chart” API shrunk down.
- **Theme packs as CSS**: multiple theme CSS files (loaded instead of the default) map cleanly to microviz’s `@microviz/themes` approach.

### plotly.js
- **Strict separation of concerns**: Plotly’s “data vs layout vs config” is worth emulating conceptually. microviz already has `spec` + `data` + `size` (+ optional `theme` + `state`), which is the right minimal split.
- **State persistence (“uirevision”)**: Plotly treats user-driven state as something you can preserve across rerenders. For microviz, the equivalent is element-level behavior: keep hover/selection stable across attribute changes when it’s still valid.
- **Export as a product feature**: Plotly makes “export to PNG/SVG” a first-class capability. For microviz, this should be a small utility layer (`renderSvgString` + Canvas surface export), not a UI toolbar.

### nivo
- **Defs + “fill rules” pattern**: nivo’s two-step model (declare `defs`, then apply them via `fill` rules/matchers) is a great API pattern for patterns/gradients. microviz can adopt this idea as helpers so charts can support “group by texture” without hardcoding every variation.
- **Layer extension hooks**: nivo’s `layers` prop is an extremely pragmatic escape hatch. microviz already has `RenderModel.layers?`; we can formalize an optional post-processing hook (model overlays) so users/demo can inject extra marks/defs without forking chart code.
- **Responsive wrappers**: nivo’s “Responsive*” components are a good north star for `@microviz/elements` ergonomics: use `ResizeObserver` + container queries and keep `width/height` attributes as an escape hatch.

### Microviz-aligned backlog ideas (post-port)
- ✅ Add **element-level tooltip primitives** (opt-in): `interactive` + `microviz-hit` events (hit-testing) emitted by elements; UI stays in the demo/integration layer.
- ✅ Add **element-level legend primitives** (opt-in): `<microviz-legend>` renders a small token-driven legend from JSON items.
- ✅ Add **auto-size** mode to `@microviz/elements` via `ResizeObserver` (Baseline 2025): `<microviz-chart autosize ...>`.
- ✅ Add small **export utilities** (SVG string → Blob/data URL, Canvas → Blob) and document them.
- ✅ Add **defs/fill-rule helpers** (in core/shared) inspired by nivo so charts can apply textures by match rule rather than bespoke wiring.
- ✅ Add optional **theme presets** in `@microviz/themes` (Carbon-inspired `white/g10/g90/g100`).

### Explicitly out of scope (by constitution)
- Polyfills / legacy browser support, non‑ESM builds, or DOM imports in `core`/`renderers`.
- A general-purpose “everything charting suite” surface (axes, dashboards, 3D, maps, etc.) in `@microviz/core`.
- Heavy animation runtimes in core; keep motion optional at the integration layer.
