import { type A11yItem, hitTest, type RenderModel } from "@microviz/core";
import { renderHtmlString } from "@microviz/renderers";
import {
  applyMicrovizA11y,
  getA11yItems,
  getHtmlRendererWarnings,
  updateA11yFocus,
} from "./a11y";
import { parseOptionalNumber } from "./parse";
import {
  clearHtmlFromShadowRoot,
  clearSvgFromShadowRoot,
  patchHtmlIntoShadowRoot,
  patchSvgIntoShadowRoot,
  renderSvgIntoShadowRoot,
  renderSvgModelIntoShadowRoot,
} from "./render";
import { renderSkeletonSvg, shouldRenderSkeleton } from "./skeleton";
import { applyMicrovizStyles } from "./styles";
import {
  createTelemetry,
  modelTelemetryStats,
  type TelemetryHandle,
  toTelemetryError,
} from "./telemetry";
import {
  type AnimationState,
  animateTransition,
  cleanupAnimation,
  createAnimationState,
} from "./transition";

type Point = { x: number; y: number };
type ClientPoint = { x: number; y: number };

export class MicrovizModel extends HTMLElement {
  static observedAttributes = [
    "animate",
    "interactive",
    "skeleton",
    "hit-slop",
    "renderer",
  ];

  readonly #internals: ElementInternals | null;
  readonly #root: ShadowRoot;
  readonly #animState: AnimationState = createAnimationState(this);
  #model: RenderModel | null = null;
  #renderModel: RenderModel | null = null;
  #wasSkeletonRender = false;
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
    cleanupAnimation(this.#animState);
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
    createTelemetry(this).emit({
      action: "focus",
      focus: { id: item.id, index: this.#focusIndex, label: item.label },
      phase: "interaction",
    });
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
    const model = this.#renderModel ?? this.#model;
    if (!model) return null;
    return this.#strokeSlopPxOverride === undefined
      ? hitTest(model, point)
      : hitTest(model, point, {
          strokeSlopPx: this.#strokeSlopPxOverride,
        });
  }

  #toModelPoint(client: ClientPoint): Point | null {
    const model = this.#renderModel ?? this.#model;
    if (!model) return null;
    const surface =
      this.#root.querySelector("svg") ?? this.#root.querySelector(".mv-chart");
    if (!surface) return null;
    const rect = surface.getBoundingClientRect();
    if (!(rect.width > 0) || !(rect.height > 0)) return null;

    const x = ((client.x - rect.left) / rect.width) * model.width;
    const y = ((client.y - rect.top) / rect.height) * model.height;
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
    createTelemetry(this).emit({
      action: "hit",
      client: this.#lastPointerClient,
      hit: hit ? { markId: hit.markId, markType: hit.markType } : undefined,
      phase: "interaction",
      point,
      reason: hit ? undefined : "miss",
    });
  }

  #onPointerMove = (event: PointerEvent): void => {
    const model = this.#renderModel ?? this.#model;
    if (!model) return;
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
    createTelemetry(this).emit({
      action: "hit",
      client,
      hit: hit ? { markId: hit.markId, markType: hit.markType } : undefined,
      phase: "interaction",
      point,
      reason: hit ? undefined : "miss",
    });
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
    createTelemetry(this).emit({
      action: "leave",
      client: { x: event.clientX, y: event.clientY },
      phase: "interaction",
      reason: "pointer-leave",
    });
  };

  render(): void {
    const telemetry = createTelemetry(this);
    if (!this.#model) {
      const renderer = this.getAttribute("renderer");
      const renderMode = renderer === "html" ? "html" : "svg";
      cleanupAnimation(this.#animState);
      applyMicrovizA11y(this, this.#internals, null);
      this.#setA11yItems([]);
      clearSvgFromShadowRoot(this.#root, {
        reason: "missing-model",
        telemetry,
      });
      clearHtmlFromShadowRoot(this.#root, {
        reason: "missing-model",
        telemetry,
      });
      this.#renderModel = null;
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
      if (telemetry.enabled) {
        telemetry.emit({
          operation: "clear",
          phase: "render",
          reason: "missing-model",
          renderer: renderMode,
        });
      }
      return;
    }

    const model = this.#model;
    const wantsSkeleton =
      this.hasAttribute("skeleton") && shouldRenderSkeleton(model);
    const renderer = this.getAttribute("renderer");
    const useHtml = renderer === "html" && !wantsSkeleton;
    const renderMode = useHtml ? "html" : "svg";

    // Emit warning event if model has diagnostics (deduplicated)
    const warnings = model.stats?.warnings;
    const warningCodes = warnings?.map((warning) => warning.code) ?? [];
    const rendererWarnings = useHtml ? getHtmlRendererWarnings(model) : null;
    const warningKeyParts: string[] = [];
    if (warningCodes.length > 0) {
      warningKeyParts.push(warningCodes.join(","));
    }
    if (rendererWarnings) {
      const rendererKey = [
        rendererWarnings.unsupportedMarkTypes.join(","),
        rendererWarnings.unsupportedDefs.join(","),
        rendererWarnings.unsupportedMarkEffects.join(","),
      ]
        .filter((value) => value.length > 0)
        .join("|");
      if (rendererKey) warningKeyParts.push(`html:${rendererKey}`);
    }
    const warningKey =
      warningKeyParts.length > 0 ? warningKeyParts.join("|") : null;
    if (warningKey && warningKey !== this.#lastWarningKey) {
      this.#lastWarningKey = warningKey;
      this.dispatchEvent(
        new CustomEvent("microviz-warning", {
          bubbles: true,
          composed: true,
          detail: {
            element: this.tagName.toLowerCase(),
            rendererWarnings: rendererWarnings ?? undefined,
            warnings,
          },
        }),
      );
      if (telemetry.enabled && useHtml) {
        if (warnings && warnings.length > 0) {
          telemetry.emit({
            phase: "warning",
            renderer: renderMode,
            warningCodes,
            warnings,
          });
        }
        if (rendererWarnings) {
          telemetry.emit({
            phase: "warning",
            reason: "renderer-unsupported",
            renderer: renderMode,
            stats: modelTelemetryStats(model) ?? undefined,
            unsupportedDefs: rendererWarnings.unsupportedDefs,
            unsupportedMarkEffects: rendererWarnings.unsupportedMarkEffects,
            unsupportedMarkTypes: rendererWarnings.unsupportedMarkTypes,
          });
        }
      }
    } else if (!warningKey) {
      this.#lastWarningKey = null;
    }

    applyMicrovizA11y(this, this.#internals, model);
    this.#setA11yItems(getA11yItems(model));

    // Skip animation when transitioning to/from skeleton (incompatible mark structures)
    const skeletonStateChanged = wantsSkeleton !== this.#wasSkeletonRender;
    const skipAnimation = useHtml || wantsSkeleton || skeletonStateChanged;

    // When animating, we need to differentiate between:
    // 1. Direct render (no animation) → use replacement
    // 2. Animation frames → use patching for smooth transitions
    const isFirstRender = this.#animState.previousModel === null;

    if (skipAnimation || isFirstRender) {
      // No animation: render directly with full replacement
      cleanupAnimation(this.#animState);
      this.#renderFrame(model, useHtml, wantsSkeleton, false, telemetry);
      this.#animState.previousModel = model;
    } else {
      // Animate with patching for smooth transitions
      const animationStart = telemetry.enabled ? performance.now() : 0;
      let frameCount = 0;
      const emitFrames = telemetry.enabled && telemetry.level === "verbose";
      animateTransition(
        this.#animState,
        model,
        (interpolated) => {
          frameCount += 1;
          if (emitFrames) {
            telemetry.emit({
              frame: frameCount,
              phase: "animation",
              reason: "frame",
              renderer: renderMode,
            });
          }
          this.#renderFrame(
            interpolated,
            useHtml,
            wantsSkeleton,
            true,
            telemetry,
          );
          this.#maybeReemitHit();
        },
        {
          onCancel: () => {
            if (telemetry.enabled) {
              telemetry.emit({
                cancelled: true,
                durationMs: performance.now() - animationStart,
                frameCount,
                phase: "animation",
                reason: "interrupt",
                renderer: renderMode,
              });
            }
          },
          onComplete: () => {
            if (telemetry.enabled) {
              telemetry.emit({
                durationMs: performance.now() - animationStart,
                frameCount,
                phase: "animation",
                renderer: renderMode,
              });
            }
          },
          telemetry: "off",
        },
      );
    }

    this.#wasSkeletonRender = wantsSkeleton;
    this.#maybeReemitHit();
  }

  #renderFrame(
    model: RenderModel,
    useHtml: boolean,
    wantsSkeleton: boolean,
    usePatch: boolean,
    telemetry: TelemetryHandle = createTelemetry(this),
  ): void {
    this.#renderModel = wantsSkeleton ? null : model;
    if (useHtml) {
      let html: string;
      if (telemetry.enabled) {
        const renderStart = performance.now();
        try {
          html = renderHtmlString(model);
        } catch (error) {
          telemetry.emit({
            error: toTelemetryError(error),
            phase: "error",
            reason: "render-html",
            renderer: "html",
          });
          throw error;
        }
        telemetry.emit({
          bytes: html.length,
          durationMs: performance.now() - renderStart,
          phase: "render",
          reason: wantsSkeleton ? "skeleton" : undefined,
          renderer: "html",
          size: { height: model.height, width: model.width },
          stats: modelTelemetryStats(model) ?? undefined,
        });
      } else {
        html = renderHtmlString(model);
      }
      clearSvgFromShadowRoot(this.#root, {
        reason: "render-html",
        telemetry,
      });
      patchHtmlIntoShadowRoot(this.#root, html, {
        reason: "render-html",
        telemetry,
      });
    } else {
      if (wantsSkeleton) {
        const renderStart = telemetry.enabled ? performance.now() : 0;
        const svg = renderSkeletonSvg({
          height: model.height,
          width: model.width,
        });
        if (telemetry.enabled) {
          telemetry.emit({
            bytes: svg.length,
            durationMs: performance.now() - renderStart,
            phase: "render",
            reason: "skeleton",
            renderer: "svg",
            size: { height: model.height, width: model.width },
          });
        }
        clearHtmlFromShadowRoot(this.#root, {
          reason: "skeleton",
          telemetry,
        });
        if (usePatch) {
          patchSvgIntoShadowRoot(this.#root, svg, {
            reason: "skeleton",
            telemetry,
          });
        } else {
          renderSvgIntoShadowRoot(this.#root, svg, {
            reason: "skeleton",
            telemetry,
          });
        }
        return;
      }
      clearHtmlFromShadowRoot(this.#root, {
        reason: "render-svg",
        telemetry,
      });
      renderSvgModelIntoShadowRoot(this.#root, model, {
        patch: usePatch,
        reason: "render-svg",
        telemetry,
      });
    }
  }
}
