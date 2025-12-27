import { type A11yItem, hitTest, type RenderModel } from "@microviz/core";
import { renderHtmlString, renderSvgString } from "@microviz/renderers";
import { applyMicrovizA11y, getA11yItems, updateA11yFocus } from "./a11y";
import { parseOptionalNumber } from "./parse";
import {
  clearHtmlFromShadowRoot,
  clearSvgFromShadowRoot,
  renderHtmlIntoShadowRoot,
  renderSvgIntoShadowRoot,
} from "./render";
import { renderSkeletonSvg, shouldRenderSkeleton } from "./skeleton";
import { applyMicrovizStyles } from "./styles";

type Point = { x: number; y: number };
type ClientPoint = { x: number; y: number };

export class MicrovizModel extends HTMLElement {
  static observedAttributes = [
    "interactive",
    "skeleton",
    "hit-slop",
    "renderer",
  ];

  readonly #internals: ElementInternals | null;
  readonly #root: ShadowRoot;
  #model: RenderModel | null = null;
  #lastWarningKey: string | null = null;
  #isInteractive = false;
  #strokeSlopPxOverride: number | undefined = undefined;
  #lastPointerClient: ClientPoint | null = null;
  #lastHitKey: string | null = null;
  #lastPoint: Point | null = null;
  #a11yItems: A11yItem[] = [];
  #focusIndex: number | null = null;

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
    this.#syncInteractivity();
    this.#syncHitSlop();
    this.render();
  }

  disconnectedCallback(): void {
    this.#setInteractive(false);
  }

  attributeChangedCallback(name: string): void {
    if (name === "interactive") {
      this.#syncInteractivity();
      return;
    }

    if (name === "hit-slop") {
      this.#syncHitSlop();
      this.#maybeReemitHit();
      return;
    }

    this.render();
  }

  get model(): RenderModel | null {
    return this.#model;
  }

  set model(model: RenderModel | null) {
    this.#model = model;
    this.render();
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
    this.#announceFocus();
  };

  #onBlur = (): void => {
    this.#focusIndex = null;
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

  render(): void {
    if (!this.#model) {
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

    const model = this.#model;

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
    if (useHtml) {
      const html = renderHtmlString(model);
      clearSvgFromShadowRoot(this.#root);
      renderHtmlIntoShadowRoot(this.#root, html);
    } else {
      const svg = wantsSkeleton
        ? renderSkeletonSvg({ height: model.height, width: model.width })
        : renderSvgString(model);
      clearHtmlFromShadowRoot(this.#root);
      renderSvgIntoShadowRoot(this.#root, svg);
    }
    this.#maybeReemitHit();
  }
}
