import {
  type ChartSpec,
  computeModel,
  hitTest,
  isChartType,
  type RenderModel,
} from "@microviz/core";
import { renderHtmlString, renderSvgString } from "@microviz/renderers";
import { applyMicrovizA11y } from "./a11y";
import { parseNumber, parseOptionalNumber } from "./parse";
import {
  clearHtmlFromShadowRoot,
  clearSvgFromShadowRoot,
  renderHtmlIntoShadowRoot,
  renderSvgIntoShadowRoot,
} from "./render";
import { renderSkeletonSvg, shouldRenderSkeleton } from "./skeleton";
import { applyMicrovizStyles } from "./styles";

type Size = { width: number; height: number };
type Point = { x: number; y: number };
type ClientPoint = { x: number; y: number };

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
  const type = (value as { type?: unknown }).type;
  return typeof type === "string" && isChartType(type);
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
    "renderer",
    "interactive",
    "skeleton",
    "hit-slop",
  ];

  readonly #internals: ElementInternals | null;
  readonly #root: ShadowRoot;

  #resizeObserver: ResizeObserver | null = null;
  #measuredSize: Size | null = null;
  #isInteractive = false;
  #model: RenderModel | null = null;
  #strokeSlopPxOverride: number | undefined = undefined;
  #lastPointerClient: ClientPoint | null = null;
  #lastHitKey: string | null = null;
  #lastPoint: Point | null = null;

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
    this.#syncInteractivity();
    this.#syncHitSlop();
    this.render();
  }

  disconnectedCallback(): void {
    this.#resizeObserver?.disconnect();
    this.#resizeObserver = null;
    this.#measuredSize = null;
    this.#setInteractive(false);
  }

  attributeChangedCallback(name: string): void {
    this.#syncResizeObserver();
    this.#syncInteractivity();
    if (name === "interactive") return;

    if (name === "hit-slop") {
      this.#syncHitSlop();
      this.#maybeReemitHit();
      return;
    }

    this.#syncHitSlop();
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

  #syncInteractivity(): void {
    this.#setInteractive(this.hasAttribute("interactive"));
  }

  #setInteractive(enabled: boolean): void {
    if (enabled === this.#isInteractive) return;
    this.#isInteractive = enabled;

    if (enabled) {
      this.addEventListener("pointermove", this.#onPointerMove);
      this.addEventListener("pointerleave", this.#onPointerLeave);
      return;
    }

    this.#lastPointerClient = null;
    this.#lastHitKey = null;
    this.#lastPoint = null;

    this.removeEventListener("pointermove", this.#onPointerMove);
    this.removeEventListener("pointerleave", this.#onPointerLeave);
  }

  #syncHitSlop(): void {
    const slop = parseOptionalNumber(this.getAttribute("hit-slop"));
    this.#strokeSlopPxOverride =
      slop === undefined ? undefined : Math.max(0, slop);
  }

  #hitTestAt(point: Point): ReturnType<typeof hitTest> {
    if (!this.#model) return null;
    return this.#strokeSlopPxOverride === undefined
      ? hitTest(this.#model, point)
      : hitTest(this.#model, point, {
          strokeSlopPx: this.#strokeSlopPxOverride,
        });
  }

  #toModelPoint(client: ClientPoint): Point | null {
    if (!this.#model) return null;
    const surface =
      this.#root.querySelector("svg") ?? this.#root.querySelector(".mv-chart");
    if (!surface) return null;
    const rect = surface.getBoundingClientRect();
    if (!(rect.width > 0) || !(rect.height > 0)) return null;

    const x = ((client.x - rect.left) / rect.width) * this.#model.width;
    const y = ((client.y - rect.top) / rect.height) * this.#model.height;
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

    return { x, y };
  }

  #hitKey(hit: ReturnType<typeof hitTest>): string | null {
    return hit ? `${hit.markType}:${hit.markId}` : null;
  }

  #maybeReemitHit(): void {
    if (!this.#isInteractive) return;
    if (!this.#model) return;
    if (!this.#lastPointerClient) return;

    const point = this.#toModelPoint(this.#lastPointerClient);
    if (!point) return;

    const hit = this.#hitTestAt(point);
    const key = this.#hitKey(hit);

    const prev = this.#lastPoint;
    const samePoint =
      prev &&
      Math.abs(prev.x - point.x) < 1e-6 &&
      Math.abs(prev.y - point.y) < 1e-6;

    if (key === this.#lastHitKey && samePoint) return;

    this.#lastHitKey = key;
    this.#lastPoint = point;
    this.dispatchEvent(
      new CustomEvent("microviz-hit", {
        bubbles: true,
        composed: true,
        detail: {
          client: this.#lastPointerClient,
          hit,
          point,
        },
      }),
    );
  }

  #onPointerMove = (event: PointerEvent): void => {
    if (!this.#model) return;
    const client = { x: event.clientX, y: event.clientY };
    this.#lastPointerClient = client;

    const point = this.#toModelPoint(client);
    if (!point) return;

    const hit = this.#hitTestAt(point);
    this.#lastHitKey = this.#hitKey(hit);
    this.#lastPoint = point;
    this.dispatchEvent(
      new CustomEvent("microviz-hit", {
        bubbles: true,
        composed: true,
        detail: { client, hit, point },
      }),
    );
  };

  #onPointerLeave = (event: PointerEvent): void => {
    this.#lastPointerClient = null;
    this.#lastHitKey = null;
    this.#lastPoint = null;
    this.dispatchEvent(
      new CustomEvent("microviz-hit", {
        bubbles: true,
        composed: true,
        detail: { client: { x: event.clientX, y: event.clientY }, hit: null },
      }),
    );
  };

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
    if (!type || !isChartType(type)) return null;

    const pad = this.hasAttribute("pad")
      ? parseNumber(this.getAttribute("pad"), 0)
      : undefined;
    return { pad, type } as ChartSpec;
  }

  get model(): RenderModel | null {
    return this.#model;
  }

  render(): void {
    const spec = this.#resolveSpec();
    const data = parseJson(this.getAttribute("data"));
    if (!spec || data === null) {
      this.#model = null;
      applyMicrovizA11y(this, this.#internals, null);
      clearSvgFromShadowRoot(this.#root);
      clearHtmlFromShadowRoot(this.#root);
      if (this.#isInteractive && this.#lastHitKey !== null) {
        this.#lastHitKey = null;
        this.#lastPoint = null;
        this.dispatchEvent(
          new CustomEvent("microviz-hit", {
            bubbles: true,
            composed: true,
            detail: { hit: null },
          }),
        );
      }
      return;
    }

    const size = this.#resolveSize({ height: 32, width: 200 });
    const model = computeModel({
      data: data as never,
      size,
      spec,
    });
    this.#model = model;

    applyMicrovizA11y(this, this.#internals, model);
    const wantsSkeleton =
      this.hasAttribute("skeleton") && shouldRenderSkeleton(model);
    const renderer = this.getAttribute("renderer");
    const useHtml = renderer === "html" && !wantsSkeleton;
    if (useHtml) {
      const html = renderHtmlString(model);
      clearSvgFromShadowRoot(this.#root);
      renderHtmlIntoShadowRoot(this.#root, html);
    } else {
      const svg = wantsSkeleton
        ? renderSkeletonSvg(size)
        : renderSvgString(model);
      clearHtmlFromShadowRoot(this.#root);
      renderSvgIntoShadowRoot(this.#root, svg);
    }
    this.#maybeReemitHit();
  }
}
