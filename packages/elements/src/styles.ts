/**
 * Microviz element styles with fallback palette.
 *
 * When no external theme is loaded (e.g., @microviz/themes/base.css),
 * these fallback values ensure charts render with a reasonable palette.
 * Uses Tableau 10 colors for colorblind accessibility.
 */
const stylesText = `
:host {
  display: inline-block;
  color: var(--mv-fg, currentColor);
  font-family: var(--mv-font-family, system-ui, -apple-system, Segoe UI, Roboto, sans-serif);
  /* Fallback palette: Tableau 10 (colorblind-safe) */
  --mv-series-1: var(--mv-series-1, #4e79a7);
  --mv-series-2: var(--mv-series-2, #f28e2c);
  --mv-series-3: var(--mv-series-3, #e15759);
  --mv-series-4: var(--mv-series-4, #76b7b2);
  --mv-series-5: var(--mv-series-5, #59a14f);
  --mv-series-6: var(--mv-series-6, #edc949);
  --mv-series-7: var(--mv-series-7, #af7aa1);
  --mv-series-8: var(--mv-series-8, #ff9da7);
  --mv-series-9: var(--mv-series-9, #9c755f);
  --mv-series-10: var(--mv-series-10, #bab0ab);
  --mv-muted: var(--mv-muted, #94a3b8);
  --mv-stroke-width: var(--mv-stroke-width, 1.5px);
  --mv-focus-ring: var(--mv-focus-ring, #3b82f6);
  --mv-focus-ring-width: var(--mv-focus-ring-width, 2px);
  --mv-focus-ring-offset: var(--mv-focus-ring-offset, 2px);
}

:host(:focus-visible) {
  outline: var(--mv-focus-ring-width, 2px) solid
    var(--mv-focus-ring, currentColor);
  outline-offset: var(--mv-focus-ring-offset, 2px);
}

svg {
  display: block;
}

.mv-sr-only {
  border: 0;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  height: 1px;
  margin: -1px;
  overflow: hidden;
  padding: 0;
  position: absolute;
  width: 1px;
  white-space: nowrap;
}

@keyframes mv-skeleton-pulse {
  0%,
  100% {
    opacity: 0.1;
  }
  50% {
    opacity: 0.18;
  }
}

.mv-skeleton {
  fill: var(--mv-muted, currentColor);
  animation: mv-skeleton-pulse 1.25s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .mv-skeleton {
    animation: none;
    opacity: 0.14;
  }
}

.mv-line {
  stroke: var(--mv-series-1, currentColor);
  stroke-width: var(--mv-stroke-width, 1.5px);
  fill: none;
}

.mv-range-band-band {
  fill: var(--mv-series-1, currentColor);
}

.mv-range-band-line {
  stroke: var(--mv-series-1, currentColor);
  fill: none;
}

.mv-range-band-dot {
  fill: var(--mv-series-1, currentColor);
}

.mv-spark-area-line {
  stroke: var(--mv-series-1, currentColor);
  fill: none;
}

.mv-spark-area-dot {
  fill: var(--mv-series-1, currentColor);
}

.mv-bullet-delta-track {
  fill: none;
  stroke: var(--mv-muted, currentColor);
}

.mv-bullet-delta-delta {
  fill: none;
  stroke: var(--mv-series-1, currentColor);
}

.mv-bullet-delta-previous {
  fill: var(--mv-muted, currentColor);
}

.mv-bullet-delta-current {
  fill: var(--mv-series-1, currentColor);
}

.mv-bullet-delta-arrow {
  fill: var(--mv-series-1, currentColor);
}

.mv-bar {
  fill: var(--mv-series-1, currentColor);
}

.mv-sparkline-dot {
  fill: var(--mv-series-1, currentColor);
}

.mv-step-line-dot {
  fill: var(--mv-series-1, currentColor);
}

.mv-histogram-bar {
  fill: var(--mv-series-1, currentColor);
}

.mv-heatgrid-cell {
  fill: var(--mv-series-1, currentColor);
}

.mv-dot-matrix-dot {
  fill: var(--mv-series-1, currentColor);
}

.mv-barcode-bin {
  shape-rendering: crispEdges;
}

.mv-pixel-grid-cell {
  shape-rendering: crispEdges;
}

.mv-pixel-pill-seg {
  shape-rendering: crispEdges;
}

.mv-pixel-column-seg {
  shape-rendering: crispEdges;
}

.mv-pixel-treemap-cell {
  shape-rendering: crispEdges;
}

.mv-dumbbell-track {
  stroke: var(--mv-muted, currentColor);
}

.mv-dumbbell-range {
  stroke: var(--mv-series-1, currentColor);
}

.mv-dumbbell-current {
  fill: var(--mv-series-1, currentColor);
}

.mv-dumbbell-target {
  fill: var(--mv-series-1, currentColor);
  stroke: var(--mv-series-1, currentColor);
}

.mv-sparkline-bars-bar {
  fill: var(--mv-series-1, currentColor);
}
`;

export type StylesTarget = { adoptedStyleSheets?: CSSStyleSheet[] } & Node;

export function applyMicrovizStyles(root: StylesTarget): void {
  if ("adoptedStyleSheets" in root && typeof CSSStyleSheet !== "undefined") {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(stylesText);
    root.adoptedStyleSheets = [...(root.adoptedStyleSheets ?? []), sheet];
    return;
  }

  const style = document.createElement("style");
  style.textContent = stylesText;
  root.appendChild(style);
}
