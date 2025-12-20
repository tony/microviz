# Microviz architecture question (expert review)

I’m designing a micro-visualization (micro charts / sparklines / compact pattern viz) library and want a “least regret” architecture with **one canonical truth for layout + drawing**, multiple consumption surfaces, and a test pyramid that’s fast by default but still supports pixel-level confirmation when needed.

Please analyze architectural best practices for a micro-viz library with a **deterministic-ish core** (deterministic given the same injected capabilities) and **pluggable renderers**, designed for broad framework compatibility (React now, others later), SSR/SSG safety, and optional interactivity + accessibility. Also examine Tailwind support patterns without coupling, and tradeoffs around Web Components, layout determinism, and text rendering across adapters. We also want it to be easy for all layers to be served from CDNs and embedded in playgrounds/sandboxes (JSFiddle/CodePen/StackBlitz, “artifact/canvas” style environments, etc.).

## Requirements / constraints

### Target environments & packaging assumptions

- Primary targets: modern browsers + Node 18+.
- Preference: ESM-first (ideally ESM-only) with clean exports and minimal side effects for CDN/sandbox usage.
- Avoid “framework build coupling” requirements (e.g., consumers must scan `node_modules` for Tailwind classes).
- We’re interested in progressive enhancement via modern platform features (e.g., Web Workers, OffscreenCanvas, Shadow DOM, Declarative Shadow DOM, ElementInternals), but want to avoid polyfill-heavy designs.
- Assume some environments will be constrained (strict CSP, iframes/sandboxes, older WebViews): the library should degrade gracefully (e.g., “no Worker” and “no Shadow DOM” baselines remain viable).
- Important CDN/no-build gotcha we want you to consider: import maps apply to the document, not module Workers; any Worker mode needs an explicit URL/bundled Worker entrypoint.

### Compatibility & SSR/SSG

- Yes, must work in SSR/SSG (Next.js/Astro/Remix; Node-only rendering).
- `@microviz/core` must be SSR-safe and DOM-free (no `window`).
- Text measurement is the hard part:
  - We’re open to a two-phase approach: compute a stable model, then optional client re-measure/refine.
  - But we suspect the least-regret design is: keep core pure and make text measurement an injected dependency so determinism is “given the same measurer + font inputs”, rather than claiming global determinism across OS/font renderers.

### Static vs dynamic

- Primarily static rendering first (small footprint), but we want **optional dynamic behaviors**:
  - transitions/animations are a “nice to have” and should live in adapters, not core.
  - tooltips/hover/focus/selection should exist but be driven by an explicit `InteractionState` input (not hidden internal state).

### Interactivity responsibilities

- Renderers should be mostly passive: take a render model and output pixels/DOM/SVG.
- Adapters (React, web components, etc.) should own event binding and mapping events → `InteractionState` updates.
- Core can provide `hitTest(...)`, stable mark IDs, and semantic mapping to support interactivity.

### Accessibility

- Yes, accessibility support is desired.
- Core should compute a deterministic **semantic/a11y model** (`A11yTree`, labels/alt text, focus order hints, value strings).
- Adapters map this to real platform behavior (ARIA attributes, keyboard navigation, focus management, tooltip announcements).
- Target: good defaults, not “full charting a11y framework” on day 1.

### Tailwind

- We want Tailwind-friendly usage without making Tailwind a requirement for consumers.
- Ideal: Tailwind is an authoring tool for skins, but consumers can use compiled CSS + CSS variables / tokens.
- Tailwind v4 uses CSS-first configuration (`@theme`, `@source`, `@import`). We want a pattern that doesn’t force our library to “own” Tailwind’s entrypoint/import order.
- We suspect the best pattern is: ship a pure CSS “Tailwind adapter” that defines `@theme { ... }` mappings (and maybe minimal layered defaults), but does **not** import Tailwind itself; the app owns `@import "tailwindcss";`, ordering, and `@source` scanning.
- We’re open to CSS-native patterns like CSS layers and container queries for responsiveness, but want to avoid deep coupling to any single styling system.

### CDN & embed friendliness

- We want every layer to be easy to consume via:
  - ESM imports from CDNs (esm.sh / unpkg-style) or bundled builds
  - no-build embeds where feasible
  - playground/dev sandboxes easily
- We care about clean exports, small bundles, stable module formats.
- We want your take on CSP realities (e.g., `worker-src` restrictions) and how that should shape an optional Worker strategy.

## Proposed layering

### 1) `@microviz/core` (headless, deterministic)

Pure TypeScript: no DOM/framework/CSS. This is where correctness lives.

Exports:

- Spec types: `ChartSpec`, `SeriesSpec`, `ThemeTokens`, `InteractionState`
- Pure transforms:
  - `normalizeData(spec, data) -> Normalized`
  - `computeLayout(spec, measures, theme) -> Layout`
  - `computeMarks(layout, data, state) -> Mark[]`
  - `computeA11y(layout, data) -> A11yTree`
  - `hitTest(layout, marks, point) -> HitResult`
- Optional: `renderModelToSvgString(model)` (still DOM-free)

Text measurement idea (open question / likely direction):

- Make measurement an explicit dependency, e.g. `computeLayout(..., measurer)` where measurer can be:
  - SSR approximation (Node-only)
  - Canvas measurement (client)
  - OffscreenCanvas measurement (worker)
- This keeps core deterministic given the same measurer + fonts, and makes “worker-first” an optional execution mode rather than a hard dependency.

Execution mode idea (open question):

- Core is synchronous and deterministic by default.
- Worker execution is an optional optimization that should degrade gracefully in CSP-locked or sandboxed environments.

Canonical output:

```ts
type RenderModel = {
  width: number;
  height: number;
  marks: Mark[]; // rect/line/path/text/etc
  defs?: Def[]; // gradients, clipPaths, masks
  layers?: LayerHint[]; // paint order hints
  a11y?: A11yTree;
  debug?: DebugInfo; // bounds, layout boxes, baselines
  stats?: { markCount: number; textCount: number; hasDefs: boolean };
};
```

Key property: given `(spec, data, size, theme, state)` the model is deterministic.

### 2) Renderers (framework-agnostic)

- `@microviz/renderer-svg`, `@microviz/renderer-canvas`, `@microviz/renderer-html`
- Input: `RenderModel`
- Output: SVG string/element-tree, Canvas draw calls, or positioned HTML.
- Should support stable IDs/data attributes to enable hit-testing and diagnostics.
- Security posture (open question): avoid `innerHTML` sinks for client rendering if any content can be influenced by user data; prefer DOM construction. If you recommend a string renderer, please comment on strict escaping and/or Trusted Types style constraints.

### 3) Adapters

- `@microviz/react`: “easy button” components/hooks; owns ResizeObserver/event mapping/animation toggles/hydration concerns.
- Optional later: Vue/Svelte/Angular adapters following the same boundary.

### 4) Skins / Tailwind support (without coupling)

- Minimal token contract (CSS variables / theme object) that renderers understand.
- `@microviz/skins-tailwind` (or similar) provides opinionated visuals:
  1. Recommended: ship compiled CSS + CSS variables (Tailwind is internal tool)
  2. Optional: Tailwind-class output mode for Tailwind-native consumers
- Tailwind v4 opt-in idea: ship a pure CSS “adapter” that defines `@theme { --color-mv-* ... }` mappings, but does not import Tailwind itself (the app owns `@import "tailwindcss";` and ordering).

### 5) Optional Web Components

- `@microviz/elements`: `<microviz-chart>` for Angular/vanilla/no-build/CMS embeds.
- Should depend on core + renderers; not vice versa.
- We’re considering Shadow DOM for isolation, but want an expert view on:
  - Shadow DOM vs light DOM mode (styling ergonomics, Tailwind compatibility, SSR story)
  - Declarative Shadow DOM as progressive enhancement (and its interaction with constructable stylesheets, which can’t be serialized server-side)
  - ElementInternals as progressive enhancement with ARIA fallback

## Test pyramid intent

- Tier 0 (fast): Node Vitest tests on core (RenderModel snapshots + invariants like `markCount > 0`, bounds sanity, no NaNs)
- Tier 1: renderer structural tests (SVG string structure, defs/clips present)
- Tier 2: selective browser visual regression (Vitest browser mode + Playwright screenshots)
- Optional: semantic/LLM checks only for new chart types or rare cases

## Questions for you

1. Is `RenderModel` the right “canonical truth”, or should the canonical artifact be something else (SVG string, scene graph, etc.)?
2. What are best practices for keeping core deterministic while still handling hard parts like text measurement and font differences across environments? Is “inject a measurer” the right contract?
3. How would you design the theme/styling contract so Tailwind users are happy but non-Tailwind users aren’t excluded?
4. Should Web Components be a first-class surface early (for broad adoptability), or added later once core/renderers stabilize? How would you evaluate Shadow DOM vs light DOM for a “works everywhere” chart library?
5. For CDN/no-build embeds, what packaging strategy is least regrettable (ESM-only vs dual ESM/CJS, UMD bundles, “prebuilt renderer” bundles, etc.)? Would you ship “batteries included” entrypoints for sandboxes?
6. Where should interactivity and accessibility responsibilities live to avoid duplication across adapters while keeping SSR-safe determinism?
7. What failure modes should we plan for (blank render, overflow/clipping, layout drift, hydration mismatch) and what diagnostics/contracts would you recommend to detect them early?
8. What are the “gotchas” for CDN/sandbox use that we should design around up front (e.g., CSP `worker-src`, import maps not applying to Workers, Shadow DOM styling expectations)?
