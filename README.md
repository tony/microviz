# microviz

**Tiny charts for fast thinking. Drop-in visuals for AI prototypes, dashboards, and live canvases.**

microviz is a micro-chart engine for people building *ideas*, not reporting pipelines.

If you're prototyping AI workflows, experimenting in canvases like Statsig, building internal tools, or shipping "good enough now" dashboards, you don't want a charting framework — you want a **visual primitive**.

microviz gives you sparklines, bars, and compact charts that load instantly, style cleanly, don't fight your CSS, and stay out of your way.

Paste a tag. Pass some data. Move on.

No config forests. No chart grammar dissertations.

## Why microviz?

microviz is optimized for *iteration velocity*.

- **Charts as UI atoms**: Sparklines, bars, tracks, overlays. Small visuals you can drop anywhere without redesigning your app.
- **Headless by default**: The core produces a tiny render model (a serializable visual AST). Render it, remix it, or ignore the renderer entirely and do something strange.
- **Plays well with AI tooling**: Serializable models, deterministic output, easy to snapshot, diff, or generate from LLM-produced data.
- **Canvas-friendly**: Works cleanly inside constrained surfaces—experiment panels, flags dashboards, feature gates, notebooks, and embeds.
- **CSS-first, Tailwind-friendly**: No theme APIs to learn. Style it like the rest of your app. Optional Tailwind v4 adapter included.
- **Fast enough to forget about**: Workers when helpful, typed arrays where it matters, minimal DOM. You stop thinking about charts and keep thinking about the product.
- **A11y built in**: Stable IDs, model summaries, ARIA wiring, and keyboard focus for interactive charts.

microviz is not a full charting suite. It's small, composable primitives that scale to high-volume UI.

## Quick start

### CDN drop-in (no build, no bundler)

The simplest way to use microviz. Works in CodePen, JSFiddle, StackBlitz, and anywhere ESM is supported:

```html
<script type="module">
  import "https://cdn.jsdelivr.net/npm/@microviz/elements/cdn/microviz.js";
</script>

<microviz-sparkline data="10, 25, 15, 30, 20"></microviz-sparkline>
```

The CDN bundle (~54KB gzipped) includes all dependencies and fallback styles. No CSS import needed.

**Alternative CDN URLs:**
- jsdelivr: `https://cdn.jsdelivr.net/npm/@microviz/elements/cdn/microviz.js`
- unpkg: `https://unpkg.com/@microviz/elements/cdn/microviz.js`
- esm.sh: `https://esm.sh/@microviz/elements` (resolves deps on-demand)

### CDN with import map (advanced)

If you need to resolve bare specifiers or use multiple microviz packages:

```html
<script type="importmap">
  {
    "imports": {
      "@microviz/elements": "https://esm.sh/@microviz/elements@1"
    }
  }
</script>

<link rel="stylesheet" href="https://esm.sh/@microviz/themes@1/base.css" />

<script type="module">
  import "@microviz/elements";
</script>

<microviz-sparkline data="[10, 25, 15, 30, 20]"></microviz-sparkline>
```

### Generic chart element (responsive layouts)

If you want a single tag that can render any `spec.type` and auto-size via `ResizeObserver`:

```html
<microviz-chart
  autosize
  style="width: 240px; height: 64px"
  spec='{"type":"sparkline"}'
  data="[6,10,7,12,9,14]"
></microviz-chart>
```

### Auto chart element (type inference)

If you want a one-liner that infers the chart type from the data:

```html
<microviz-auto data="1,2,3,4,5"></microviz-auto>
<microviz-auto data='{"current":12,"previous":9}'></microviz-auto>
<microviz-auto data="label,value\nA,10\nB,14\nC,8"></microviz-auto>
```

You can still force a type when needed:

```html
<microviz-auto type="bar" data="3, 6, 2"></microviz-auto>
```

### Tailwind v4 harmony (CSS-first)

```css
/* app.css */
@import "tailwindcss";

@import "@microviz/themes/base.css";
@import "@microviz/themes-tailwind/microviz.css";

/* Overrides are effortless */
.mv-line {
  @apply stroke-indigo-500;
}
```

```html
<microviz-sparkline class="rounded-md bg-gray-50 p-2" data="[1,2,3,4,5]"></microviz-sparkline>
```

### Quick JS API (optional)

For programmatic usage, helper functions create elements with sane defaults:

```ts
import { auto, sparkline } from "@microviz/elements";

const chart = auto("1,2,3,4,5");
document.body.append(chart);

const mini = sparkline([2, 4, 3, 6], { width: 120, animate: false });
document.body.append(mini);
```

### React (via Web Components)

```tsx
import "@microviz/elements";

export function Dashboard() {
  return (
    <div className="rounded-md bg-gray-50 p-2">
      <microviz-sparkline data="[10, 25, 15, 30, 20]" />
    </div>
  );
}
```

### Interaction events (tooltip primitives)

When `interactive` is present, `<microviz-chart>` and `<microviz-model>` emit `microviz-hit` events:

```ts
const el = document.querySelector("microviz-chart");
el?.addEventListener("microviz-hit", (event) => {
  console.log((event as CustomEvent).detail.hit?.markId);
});
```

Keyboard focus (arrow keys) emits `microviz-focus` with the a11y item:

```ts
el?.addEventListener("microviz-focus", (event) => {
  console.log((event as CustomEvent).detail.item);
});
```

### Telemetry (debug instrumentation)

Add the `telemetry` attribute to emit `microviz-telemetry` events with timings,
renderer mode, and diagnostics. This is opt-in and meant for debugging and
profiling.

```ts
const el = document.querySelector("microviz-chart");
el?.setAttribute("telemetry", "basic");
el?.addEventListener("microviz-telemetry", (event) => {
  console.log((event as CustomEvent).detail);
});
```

Telemetry levels:

- `telemetry` / `telemetry="basic"`: render + DOM patch summaries (compute timing for chart/model), plus warnings when present
- `telemetry="verbose"`: includes per-frame animation events

Telemetry payloads include a stable `modelHash` plus model stats (marks/defs/layers/a11y counts) to correlate compute/render/DOM events.

You can also enable telemetry globally:

```ts
// Enable for all microviz elements on the page
window.__MICROVIZ_TELEMETRY__ = true; // or "verbose"
```

In the demo app, the Browse inspector includes a Telemetry tab (Elements wrapper)
with filters and copy/export for the live event log. Diagnostics also surfaces
HTML renderer omissions even when another renderer is active.

### Motion (animations)

microviz animates between updates by default. To disable motion per element:

```html
<microviz-sparkline animate="false" data="[1,2,3]"></microviz-sparkline>
```

Accepted falsey values: `false`, `0`, `no`, `off`. Motion also respects
`prefers-reduced-motion` and `--mv-motion-duration: 0ms`.

### Accessibility

- Use `interactive` when you want keyboard navigation; arrow keys move across `a11y.items`.
- Override `aria-label` on the element if you need a custom summary.
- Prefer chart-specific `a11y.items` in core so screen readers announce meaningful labels.

### AI prototype example

Model-generated metrics, visualized immediately:

```ts
// LLM produces structured metrics
const metrics = await runModel(prompt);

// Normalize and visualize
const chart = document.querySelector("microviz-sparkline");
chart.data = metrics.confidenceOverTime;
```

microviz doesn't care where the data came from—a model, a worker, a feature flag, or a CSV pasted five minutes ago.

## Customizing styles

Tweak tokens via CSS variables:

```css
:root {
  --mv-bg: oklch(1 0 0);
  --mv-series-1: oklch(0.6 0.25 30);
  --mv-font-family: Inter, system-ui, sans-serif;
  --mv-stroke-width: 2px;
  --mv-focus-ring: oklch(0.55 0.2 250);
  --mv-focus-ring-width: 2px;
}
```

Or use optional preset variants (Carbon-inspired `white/g10/g90/g100`):

```css
@import "@microviz/themes/base.css";
@import "@microviz/themes/variants.css";
```

```html
<div class="mv-theme-g90 rounded-md p-2">
  <microviz-sparkline data="[1,2,3,4,5]"></microviz-sparkline>
</div>
```

Or extend via Tailwind v4 theme variables:

```css
@theme {
  --color-mv-series-1: theme(colors.indigo.500);
  --spacing-mv-padding: theme(spacing.4);
}
```

## How it works

### Headless core = remixable output

Every chart computes a serializable `RenderModel`—think of it as a tiny visual AST:

- marks (the shapes)
- IDs (for hit-testing and interaction)
- optional a11y metadata
- optional stats

You can:

- snapshot it in tests
- diff it across experiments
- generate it from LLM output
- layer on overlays without forking a chart
- promote successful hacks into real chart types

Charts don't have to be "final" to be useful.

### Layers

- **Core**: deterministic pure computation → `RenderModel`. No DOM access.
- **Renderers**: stateless transforms to SVG/Canvas/HTML.
- **Elements**: Web Components with event binding and a11y wiring.
- **Themes**: CSS tokens + `@layer microviz`. Tailwind v4 via `@theme`.

Interaction flows in (hovered/selected/focused IDs); rendering is a pure transform out.

## Model overlays (optional)

Need to add a few marks/defs without forking a chart? Use the overlay helpers:

```ts
import { createModelIdAllocator, patchRenderModel } from "@microviz/core";

const { defId } = createModelIdAllocator(model);
const overlayFilterId = defId("mv-overlay-noise");

const next = patchRenderModel(
  model,
  {
    defs: [
      {
        id: overlayFilterId,
        type: "filter",
        primitives: [{ type: "gaussianBlur", stdDeviation: 1.5 }],
      },
    ],
    marks: model.marks.map((mark) =>
      mark.filter ? mark : { ...mark, filter: overlayFilterId },
    ),
  },
  { marksMode: "replace" },
);
```

## Defs + fill rules

Apply `defs` (patterns/gradients) to marks using fill rules:

```ts
import { applyFillRules } from "@microviz/core";

const next = {
  ...model,
  defs: [
    { id: "mv-stripes", type: "pattern", ...patternDef },
  ],
  marks: applyFillRules(model.marks, [
    { id: "mv-stripes", match: { className: "mv-bar" } },
  ]),
};
```

By default rules only apply when a mark has no explicit `fill`. Pass
`{ overwrite: true }` to force re-application.

## Export utilities

Small helpers are available for turning render output into shareable artifacts:

```ts
import {
  canvasToBlob,
  renderSvgString,
  svgStringToBlob,
  svgStringToDataUrl,
} from "@microviz/renderers";

const svg = renderSvgString(model);
const svgBlob = svgStringToBlob(svg);
const svgDataUrl = svgStringToDataUrl(svg);

// Works with either HTMLCanvasElement or OffscreenCanvas.
const pngBlob = await canvasToBlob(canvas, { type: "image/png" });
```

## Development

- Install: `pnpm install`
- Docs site (Astro/Starlight): `pnpm docs`
- Demo (Vite): `pnpm --filter @microviz/demo dev`
- Build packages: `pnpm build`
- Lint/format: `pnpm lint` / `pnpm format`
- Type-check: `pnpm type-check`
- Tests (Vitest): `pnpm test`
- Visual regression (Vitest browser + Playwright provider): `pnpm --filter @microviz/demo test:visual`

## Browser baseline

Target is modern evergreen browsers (2025+ baseline): OffscreenCanvas, CSS Layers and container queries, ES Modules/import maps, modern Custom Elements APIs, and (where applicable) Declarative Shadow DOM and ElementInternals.

## License

MIT.
