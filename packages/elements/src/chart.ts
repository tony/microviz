import { type ChartSpec, computeModel } from "@microviz/core";
import { renderSvgString } from "@microviz/renderers";
import { applyMicrovizA11y } from "./a11y";
import { parseNumber } from "./parse";
import { clearSvgFromShadowRoot, renderSvgIntoShadowRoot } from "./render";
import { applyMicrovizStyles } from "./styles";

type Size = { width: number; height: number };

function parseJson(value: string | null): unknown | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function isChartSpec(value: unknown): value is ChartSpec {
  if (!value || typeof value !== "object") return false;
  return typeof (value as { type?: unknown }).type === "string";
}

function coerceSize(raw: Size): Size {
  const width = Number.isFinite(raw.width) ? Math.max(0, raw.width) : 0;
  const height = Number.isFinite(raw.height) ? Math.max(0, raw.height) : 0;
  return { height, width };
}

export class MicrovizChart extends HTMLElement {
  static observedAttributes = [
    "spec",
    "type",
    "data",
    "width",
    "height",
    "pad",
    "autosize",
  ];

  readonly #internals: ElementInternals | null;
  readonly #root: ShadowRoot;

  #resizeObserver: ResizeObserver | null = null;
  #measuredSize: Size | null = null;

  constructor() {
    super();
    this.#internals =
      typeof this.attachInternals === "function"
        ? this.attachInternals()
        : null;
    this.#root = this.attachShadow({ mode: "open" });
    applyMicrovizStyles(this.#root);
  }

  connectedCallback(): void {
    this.#syncResizeObserver();
    this.render();
  }

  disconnectedCallback(): void {
    this.#resizeObserver?.disconnect();
    this.#resizeObserver = null;
    this.#measuredSize = null;
  }

  attributeChangedCallback(): void {
    this.#syncResizeObserver();
    this.render();
  }

  #syncResizeObserver(): void {
    const wantsAutosize = this.hasAttribute("autosize");
    const canObserve = typeof ResizeObserver !== "undefined";

    if (!wantsAutosize || !canObserve) {
      this.#resizeObserver?.disconnect();
      this.#resizeObserver = null;
      this.#measuredSize = null;
      return;
    }

    if (this.#resizeObserver) return;

    this.#resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { height, width } = entry.contentRect;
      const next = coerceSize({
        height: Math.round(height),
        width: Math.round(width),
      });
      if (
        this.#measuredSize &&
        this.#measuredSize.width === next.width &&
        this.#measuredSize.height === next.height
      )
        return;

      this.#measuredSize = next;
      this.render();
    });

    this.#resizeObserver.observe(this);
  }

  #resolveSize(defaultSize: Size): Size {
    const widthAttr = this.getAttribute("width");
    const heightAttr = this.getAttribute("height");
    const hasWidth = widthAttr !== null;
    const hasHeight = heightAttr !== null;

    const measured = this.#measuredSize;
    const width = hasWidth
      ? parseNumber(widthAttr, defaultSize.width)
      : (measured?.width ?? defaultSize.width);
    const height = hasHeight
      ? parseNumber(heightAttr, defaultSize.height)
      : (measured?.height ?? defaultSize.height);

    return coerceSize({ height, width });
  }

  #resolveSpec(): ChartSpec | null {
    const spec = parseJson(this.getAttribute("spec"));
    if (isChartSpec(spec)) return spec;

    const type = this.getAttribute("type");
    if (!type) return null;

    const pad = this.hasAttribute("pad")
      ? parseNumber(this.getAttribute("pad"), 0)
      : undefined;
    return { pad, type } as ChartSpec;
  }

  render(): void {
    const spec = this.#resolveSpec();
    const data = parseJson(this.getAttribute("data"));
    if (!spec || data === null) {
      applyMicrovizA11y(this, this.#internals, null);
      clearSvgFromShadowRoot(this.#root);
      return;
    }

    const size = this.#resolveSize({ height: 32, width: 200 });
    const model = computeModel({
      data: data as never,
      size,
      spec,
    });

    applyMicrovizA11y(this, this.#internals, model);
    const svg = renderSvgString(model);
    renderSvgIntoShadowRoot(this.#root, svg);
  }
}
