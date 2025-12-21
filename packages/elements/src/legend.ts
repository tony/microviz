import { applyMicrovizStyles } from "./styles";

type LegendItem = {
  label: string;
  /**
   * Optional explicit CSS color (e.g. `oklch(...)`, `#2563eb`).
   */
  color?: string;
  /**
   * Optional series index (1-based) mapped to `--mv-series-N`.
   */
  series?: number;
  hidden?: boolean;
};

function parseLegendItems(value: string | null): LegendItem[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    const items: LegendItem[] = [];
    for (const raw of parsed) {
      if (!raw || typeof raw !== "object") continue;
      const label = (raw as { label?: unknown }).label;
      if (typeof label !== "string" || label.trim().length === 0) continue;

      const color = (raw as { color?: unknown }).color;
      const series = (raw as { series?: unknown }).series;
      const hidden = (raw as { hidden?: unknown }).hidden;

      items.push({
        color:
          typeof color === "string" && color.length > 0 ? color : undefined,
        hidden: typeof hidden === "boolean" ? hidden : undefined,
        label,
        series:
          typeof series === "number" && Number.isFinite(series)
            ? series
            : undefined,
      });
    }

    return items;
  } catch {
    return [];
  }
}

const legendStylesText = `
:host {
  display: block;
}

.mv-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.mv-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--mv-fg, currentColor);
  font: 500 12px/1.1 var(--mv-font-family, system-ui, -apple-system, Segoe UI, Roboto, sans-serif);
}

.mv-legend-swatch {
  width: 10px;
  height: 6px;
  border-radius: 999px;
  background: var(--mv-series-1, currentColor);
  opacity: 0.9;
}

.mv-legend-item[data-hidden="true"] {
  opacity: 0.4;
}
`;

function applyLegendStyles(root: ShadowRoot): void {
  if ("adoptedStyleSheets" in root && typeof CSSStyleSheet !== "undefined") {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(legendStylesText);
    root.adoptedStyleSheets = [...(root.adoptedStyleSheets ?? []), sheet];
    return;
  }

  const style = document.createElement("style");
  style.textContent = legendStylesText;
  root.appendChild(style);
}

export class MicrovizLegend extends HTMLElement {
  static observedAttributes = ["items"];

  readonly #root: ShadowRoot;

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: "open" });
    applyMicrovizStyles(this.#root);
    applyLegendStyles(this.#root);
  }

  connectedCallback(): void {
    this.render();
  }

  attributeChangedCallback(): void {
    this.render();
  }

  render(): void {
    const items = parseLegendItems(this.getAttribute("items"));

    const host =
      this.#root.querySelector(".mv-legend") ??
      (() => {
        const el = document.createElement("div");
        el.className = "mv-legend";
        this.#root.appendChild(el);
        return el;
      })();

    host.replaceChildren(
      ...items.map((item) => {
        const row = document.createElement("div");
        row.className = "mv-legend-item";
        if (item.hidden) row.dataset.hidden = "true";

        const swatch = document.createElement("span");
        swatch.className = "mv-legend-swatch";

        if (item.color) {
          swatch.style.background = item.color;
        } else if (item.series !== undefined) {
          swatch.style.background = `var(--mv-series-${Math.max(1, Math.floor(item.series))}, var(--mv-series-1, currentColor))`;
        }

        const label = document.createElement("span");
        label.textContent = item.label;

        row.append(swatch, label);
        return row;
      }),
    );
  }
}
