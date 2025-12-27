import {
  type A11yItem,
  type ChartSpec,
  computeModel,
  type DiagnosticWarning,
  hitTest,
  isChartType,
  type RenderModel,
} from "@microviz/core";
import { renderHtmlString, renderSvgString } from "@microviz/renderers";
import { applyMicrovizA11y, getA11yItems, updateA11yFocus } from "./a11y";
import { parseNumber, parseOptionalNumber } from "./parse";
import {
  clearHtmlFromShadowRoot,
  clearSvgFromShadowRoot,
  patchSvgIntoShadowRoot,
  renderHtmlIntoShadowRoot,
} from "./render";
import { renderSkeletonSvg, shouldRenderSkeleton } from "./skeleton";
import { applyMicrovizStyles } from "./styles";
import { animate, shouldReduceMotion } from "./transition";

type Size = { width: number; height: number };
type Point = { x: number; y: number };
type ClientPoint = { x: number; y: number };

type ParseJsonResult =
  | { ok: true; value: unknown }
  | { ok: false; error: string };

function parseJsonWithError(value: string | null): ParseJsonResult {
  if (!value) return { ok: true, value: null };
  try {
    return { ok: true, value: JSON.parse(value) };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Invalid JSON",
      ok: false,
    };
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
  #previousModel: RenderModel | null = null;
  #cancelAnimation: (() => void) | null = null;
  #lastWarningKey: string | null = null;
  #strokeSlopPxOverride: number | undefined = undefined;
  #lastPointerClient: ClientPoint | null = null;
  #lastHitKey: string | null = null;
  #lastPoint: Point | null = null;
  #a11yItems: A11yItem[] = [];
  #focusIndex: number | null = null;
  #focusedMarkId: string | null = null;

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
    this.#cancelAnimation?.();
    this.#cancelAnimation = null;
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
      this.addEventListener("keydown", this.#onKeyDown);
      this.addEventListener("blur", this.#onBlur);
      return;
    }

    this.#lastPointerClient = null;
    this.#lastHitKey = null;
    this.#lastPoint = null;
    this.#focusIndex = null;
    this.#setFocusedMarkId(null, { rerender: true });
    updateA11yFocus(this.#root, null);

    this.removeEventListener("pointermove", this.#onPointerMove);
    this.removeEventListener("pointerleave", this.#onPointerLeave);
    this.removeEventListener("keydown", this.#onKeyDown);
    this.removeEventListener("blur", this.#onBlur);
  }

  #syncKeyboardAccess(): void {
    const shouldFocus = this.#isInteractive && this.#a11yItems.length > 0;
    if (shouldFocus) {
      this.tabIndex = 0;
    } else {
      this.removeAttribute("tabindex");
      this.#focusIndex = null;
      updateA11yFocus(this.#root, null);
    }
  }

  #setA11yItems(next: A11yItem[]): void {
    this.#a11yItems = next;
    if (
      this.#focusIndex !== null &&
      this.#focusIndex >= this.#a11yItems.length
    ) {
      this.#focusIndex = this.#a11yItems.length > 0 ? 0 : null;
    }
    this.#syncKeyboardAccess();
    this.#syncFocusedMarkId();
  }

  #focusedMarkIdForIndex(index: number | null): string | null {
    if (index === null) return null;
    return this.#a11yItems[index]?.id ?? null;
  }

  #setFocusedMarkId(
    next: string | null,
    options?: { rerender?: boolean },
  ): void {
    if (next === this.#focusedMarkId) return;
    this.#focusedMarkId = next;
    if (options?.rerender && this.isConnected) this.render();
  }

  #syncFocusedMarkId(): void {
    this.#setFocusedMarkId(this.#focusedMarkIdForIndex(this.#focusIndex));
  }

  #announceFocus(): void {
    if (this.#focusIndex === null) return;
    const item = this.#a11yItems[this.#focusIndex];
    if (!item) return;
    updateA11yFocus(this.#root, item, this.#focusIndex);
    this.dispatchEvent(
      new CustomEvent("microviz-focus", {
        bubbles: true,
        composed: true,
        detail: { index: this.#focusIndex, item },
      }),
    );
  }

  #onKeyDown = (event: KeyboardEvent): void => {
    if (this.#a11yItems.length === 0) return;

    const lastIndex = this.#a11yItems.length - 1;
    const currentIndex = this.#focusIndex ?? -1;
    let nextIndex = currentIndex;

    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        nextIndex =
          currentIndex < 0
            ? 0
            : currentIndex >= lastIndex
              ? 0
              : currentIndex + 1;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        nextIndex =
          currentIndex < 0
            ? lastIndex
            : currentIndex <= 0
              ? lastIndex
              : currentIndex - 1;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = lastIndex;
        break;
      default:
        return;
    }

    event.preventDefault();
    this.#focusIndex = nextIndex;
    this.#setFocusedMarkId(this.#focusedMarkIdForIndex(nextIndex), {
      rerender: true,
    });
    this.#announceFocus();
  };

  #onBlur = (): void => {
    this.#focusIndex = null;
    this.#setFocusedMarkId(null, { rerender: true });
    updateA11yFocus(this.#root, null);
  };

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

  #resolveSpecFromType(): ChartSpec | null {
    const type = this.getAttribute("type");
    if (!type || !isChartType(type)) return null;

    const pad = this.hasAttribute("pad")
      ? parseNumber(this.getAttribute("pad"), 0)
      : undefined;
    return { pad, type } as ChartSpec;
  }

  #resolveSpecWithError(): { spec: ChartSpec | null; error: string | null } {
    const specAttr = this.getAttribute("spec");
    if (specAttr) {
      const result = parseJsonWithError(specAttr);
      if (!result.ok) {
        // JSON parse failed, try fallback to type attribute
        return { error: result.error, spec: this.#resolveSpecFromType() };
      }
      if (isChartSpec(result.value)) {
        return { error: null, spec: result.value };
      }
    }
    return { error: null, spec: this.#resolveSpecFromType() };
  }

  get model(): RenderModel | null {
    return this.#model;
  }

  render(): void {
    const parseWarnings: DiagnosticWarning[] = [];

    // Parse spec with error tracking
    const { spec, error: specError } = this.#resolveSpecWithError();
    if (specError) {
      parseWarnings.push({
        code: "INVALID_JSON",
        example:
          '<microviz-chart spec=\'{"type":"sparkline"}\' data="[1,2,3]"></microviz-chart>',
        hint: "Ensure valid JSON syntax for spec",
        message: `Failed to parse spec attribute: ${specError}`,
        phase: "input",
      });
    }

    // Parse data with error tracking
    const dataAttr = this.getAttribute("data");
    const dataResult = parseJsonWithError(dataAttr);
    const data = dataResult.ok ? dataResult.value : null;
    if (!dataResult.ok) {
      parseWarnings.push({
        code: "INVALID_JSON",
        example:
          '<microviz-chart spec=\'{"type":"sparkline"}\' data="[10, 20, 30]"></microviz-chart>',
        hint: "Ensure valid JSON syntax for data",
        message: `Failed to parse data attribute: ${dataResult.error}`,
        phase: "input",
      });
    }

    // Emit parse error warnings before early return
    if (parseWarnings.length > 0) {
      const warningKey = parseWarnings
        .map((w) => `${w.code}:${w.message}`)
        .join(",");
      if (warningKey !== this.#lastWarningKey) {
        this.#lastWarningKey = warningKey;
        this.dispatchEvent(
          new CustomEvent("microviz-warning", {
            bubbles: true,
            composed: true,
            detail: {
              element: this.tagName.toLowerCase(),
              warnings: parseWarnings,
            },
          }),
        );
      }
    }

    if (!spec || data === null) {
      // Clear warning key if no parse errors (e.g., missing data attribute)
      if (parseWarnings.length === 0) {
        this.#lastWarningKey = null;
      }
      this.#model = null;
      this.#setFocusedMarkId(null);
      applyMicrovizA11y(this, this.#internals, null);
      this.#setA11yItems([]);
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
    const state = this.#focusedMarkId
      ? { focusedMarkId: this.#focusedMarkId }
      : undefined;
    const model = computeModel({
      data: data as never,
      size,
      spec,
      state,
    });
    this.#model = model;

    // Emit warning event if model has diagnostics (deduplicated)
    const warnings = model.stats?.warnings;
    const warningKey = warnings?.length
      ? warnings.map((w) => w.code).join(",")
      : null;
    if (warningKey && warningKey !== this.#lastWarningKey) {
      this.#lastWarningKey = warningKey;
      this.dispatchEvent(
        new CustomEvent("microviz-warning", {
          bubbles: true,
          composed: true,
          detail: {
            element: this.tagName.toLowerCase(),
            warnings,
          },
        }),
      );
    } else if (!warningKey) {
      this.#lastWarningKey = null;
    }

    applyMicrovizA11y(this, this.#internals, model);
    this.#setA11yItems(getA11yItems(model));
    const wantsSkeleton =
      this.hasAttribute("skeleton") && shouldRenderSkeleton(model);
    const renderer = this.getAttribute("renderer");
    const useHtml = renderer === "html" && !wantsSkeleton;

    // Cancel any in-flight animation
    this.#cancelAnimation?.();
    this.#cancelAnimation = null;

    // Determine if we should animate
    const canAnimate =
      this.#previousModel &&
      !useHtml && // HTML renderer has CSS transitions
      !wantsSkeleton &&
      !shouldReduceMotion();

    if (canAnimate && this.#previousModel) {
      this.#cancelAnimation = animate(
        this.#previousModel,
        model,
        (interpolated) =>
          this.#renderFrame(interpolated, useHtml, wantsSkeleton, size),
        () => {
          this.#previousModel = model;
          this.#cancelAnimation = null;
        },
      );
    } else {
      this.#renderFrame(model, useHtml, wantsSkeleton, size);
      this.#previousModel = model;
    }

    this.#maybeReemitHit();
  }

  #renderFrame(
    model: RenderModel,
    useHtml: boolean,
    wantsSkeleton: boolean,
    size: Size,
  ): void {
    if (useHtml) {
      const html = renderHtmlString(model);
      clearSvgFromShadowRoot(this.#root);
      renderHtmlIntoShadowRoot(this.#root, html);
    } else {
      const svg = wantsSkeleton
        ? renderSkeletonSvg(size)
        : renderSvgString(model);
      clearHtmlFromShadowRoot(this.#root);
      patchSvgIntoShadowRoot(this.#root, svg);
    }
  }
}
