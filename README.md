# microviz

**Headless, performant micro-charts harnessing the 2025+ web platform.**

Looking for a sleek, lightweight library to embed sparklines, bars, lines, or compact UI graphics? microviz is built for fast, embeddable visualizations that feel right at home in modern apps—dashboards, reports, and inline data pops. It leans on modern platform features (Workers, Shadow DOM, CSS Layers, container queries) to stay small and fast.

microviz is headless for flexibility, CSS-first for styling (with Tailwind v4 compatibility), and designed to be accessible out of the box. If you're tired of heavy charting suites, this is the minimalist alternative that punches above its weight.

## Why microviz?

- **Performance tuned for micro-scale**: Offload layout/mark generation to Workers when it helps; use typed arrays for dense data; keep rendering surfaces simple.
- **Web platform features (no polyfills)**: OffscreenCanvas for measurement, CSS Layers for override-friendly defaults, container queries for responsiveness, and modern Custom Elements APIs where applicable.
- **Framework freedom**: Web Components for drop-in use; thin wrappers for React and others.
- **Styling that just works**: CSS variables + Layers (`@layer`) so user styles override predictably. Tailwind v4 integration is CSS-native via `@theme` + `@import`.
- **Headless core**: Compute a serializable `RenderModel` for custom rendering, hit-testing, or state-driven interactivity.
- **Derivative charts are a feature**: Treat `RenderModel` like a tiny “render AST” you can compose. Build new charts by reusing a base model and adding marks/defs (separators, overlays, tracks, gloss, filters), then promote them to first-class `spec.type` entries when they prove out.
- **A11y as a feature**: Stable IDs plus model summaries, with element-level ARIA wiring and optional keyboard focus for interactive charts.

microviz is not a full charting suite; it focuses on small, composable primitives that scale to high-volume UI.

## Quick start

### CDN drop-in (no build)

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

## How it works (layered architecture)

microviz follows a layered design with hard boundaries:

- **Core (compute)**: deterministic-ish pure computation producing a serializable `RenderModel` (marks + IDs + optional a11y + stats). No DOM access.
- **Measurement**: a pluggable text measurement strategy (e.g. OffscreenCanvas where supported).
- **Renderers**: stateless transforms from `RenderModel` to SVG/Canvas (or other surfaces) + small export utilities.
- **HTML renderer (experimental)**: supports `rect`/`circle`/`line`/`text` only; ignores `path` marks. Supports `linearGradient`, `pattern`, `mask`, `clipRect`, and `filter` defs (dropShadow/gaussianBlur only); other defs/effects are ignored. Use SVG/Canvas for full fidelity.
- **Elements**: Web Components as a primary integration surface; event binding and native a11y wiring live here (not in core).
- **Themes**: plain CSS tokens + layered defaults (`@layer microviz`). Tailwind v4 support is a separate CSS adapter via `@theme`.
- **Adapters**: optional thin framework wrappers (future).

Interaction is explicit: state (hovered/selected/focused IDs) flows into computation; rendering is a pure transform of the model.

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
