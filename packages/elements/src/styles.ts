/**
 * Microviz element styles with fallback palette.
 *
 * When no external theme is loaded (e.g., @microviz/themes/base.css),
 * these fallback values ensure charts render with a reasonable palette.
 * Uses Tableau 10 colors for colorblind accessibility.
 */
/**
 * Fallback colors (Tableau 10, colorblind-safe) used when no theme is loaded.
 * These are referenced directly in class rules since CSS custom properties
 * cannot self-reference (e.g., --mv-series-1: var(--mv-series-1, fallback) is invalid).
 */
const FALLBACK_SERIES_1 = "#4e79a7";
const FALLBACK_MUTED = "#94a3b8";

const stylesText = `
:host {
  display: inline-block;
  color: var(--mv-fg, currentColor);
  font-family: var(--mv-font-family, system-ui, -apple-system, Segoe UI, Roboto, sans-serif);
  /* Motion tokens for transitions */
  --mv-motion-easing: var(--mv-motion-ease, cubic-bezier(0.2, 0.7, 0.3, 1));
}

:host([animate="false" i]),
:host([animate="0"]),
:host([animate="no" i]),
:host([animate="off" i]) {
  --mv-motion-duration: 0ms;
}

:host([animate="false" i]) .mv-skeleton,
:host([animate="0"]) .mv-skeleton,
:host([animate="no" i]) .mv-skeleton,
:host([animate="off" i]) .mv-skeleton {
  animation: none;
  opacity: 0.14;
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
  fill: var(--mv-muted, ${FALLBACK_MUTED});
  animation: mv-skeleton-pulse 1.25s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  :host {
    --mv-motion-duration: 0ms;
  }
  .mv-skeleton {
    animation: none;
    opacity: 0.14;
  }
}

/* HTML renderer mark transitions */
.mv-html-mark {
  transition:
    left var(--mv-motion-duration, 300ms) var(--mv-motion-easing),
    top var(--mv-motion-duration, 300ms) var(--mv-motion-easing),
    width var(--mv-motion-duration, 300ms) var(--mv-motion-easing),
    height var(--mv-motion-duration, 300ms) var(--mv-motion-easing),
    transform var(--mv-motion-duration, 300ms) var(--mv-motion-easing),
    opacity var(--mv-motion-duration, 300ms) var(--mv-motion-easing),
    background var(--mv-motion-duration, 300ms) var(--mv-motion-easing);
}

.mv-line {
  stroke: var(--mv-series-1, ${FALLBACK_SERIES_1});
  stroke-width: var(--mv-stroke-width, 1.5px);
  fill: none;
}

.mv-range-band-band {
  fill: var(--mv-series-1, ${FALLBACK_SERIES_1});
}

.mv-range-band-line {
  stroke: var(--mv-series-1, ${FALLBACK_SERIES_1});
  fill: none;
}

.mv-range-band-dot {
  fill: var(--mv-series-1, ${FALLBACK_SERIES_1});
}

.mv-spark-area-line {
  stroke: var(--mv-series-1, ${FALLBACK_SERIES_1});
  fill: none;
}

.mv-spark-area-dot {
  fill: var(--mv-series-1, ${FALLBACK_SERIES_1});
}

.mv-bullet-delta-track {
  fill: none;
  stroke: var(--mv-muted, ${FALLBACK_MUTED});
}

.mv-bullet-delta-delta {
  fill: none;
  stroke: var(--mv-series-1, ${FALLBACK_SERIES_1});
}

.mv-bullet-delta-previous {
  fill: var(--mv-muted, ${FALLBACK_MUTED});
}

.mv-bullet-delta-current {
  fill: var(--mv-series-1, ${FALLBACK_SERIES_1});
}

.mv-bullet-delta-arrow {
  fill: var(--mv-series-1, ${FALLBACK_SERIES_1});
}

.mv-bar {
  fill: var(--mv-series-1, ${FALLBACK_SERIES_1});
}

.mv-sparkline-dot {
  fill: var(--mv-series-1, ${FALLBACK_SERIES_1});
}

.mv-step-line-dot {
  fill: var(--mv-series-1, ${FALLBACK_SERIES_1});
}

.mv-histogram-bar {
  fill: var(--mv-series-1, ${FALLBACK_SERIES_1});
}

.mv-heatgrid-cell {
  fill: var(--mv-series-1, ${FALLBACK_SERIES_1});
}

.mv-dot-matrix-dot {
  fill: var(--mv-series-1, ${FALLBACK_SERIES_1});
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
  stroke: var(--mv-muted, ${FALLBACK_MUTED});
}

.mv-dumbbell-range {
  stroke: var(--mv-series-1, ${FALLBACK_SERIES_1});
}

.mv-dumbbell-current {
  fill: var(--mv-series-1, ${FALLBACK_SERIES_1});
}

.mv-dumbbell-target {
  fill: var(--mv-series-1, ${FALLBACK_SERIES_1});
  stroke: var(--mv-series-1, ${FALLBACK_SERIES_1});
}

.mv-sparkline-bars-bar {
  fill: var(--mv-series-1, ${FALLBACK_SERIES_1});
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
