import {
  computeModel,
  type RenderModel,
  type ValidationMode,
} from "@microviz/core";
import { applyMicrovizA11y } from "./a11y";
import { parseNumber, parseNumberArray } from "./parse";
import { renderSvgModelIntoShadowRoot } from "./render";
import { applyMicrovizStyles } from "./styles";
import {
  type AnimationState,
  animateTransition,
  cleanupAnimation,
  createAnimationState,
} from "./transition";

const SPEC_TYPE = "sparkline";

export class MicrovizSparkline extends HTMLElement {
  static observedAttributes = [
    "animate",
    "data",
    "width",
    "height",
    "pad",
    "validate",
  ];

  readonly #internals: ElementInternals | null;
  readonly #root: ShadowRoot;
  readonly #animState: AnimationState = createAnimationState(this);
  #modelOverride: RenderModel | null = null;
  #lastWarningKey: string | null = null;

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
    this.render();
  }

  disconnectedCallback(): void {
    cleanupAnimation(this.#animState);
  }

  attributeChangedCallback(): void {
    this.render();
  }

  get model(): RenderModel | null {
    return this.#modelOverride;
  }

  set model(model: RenderModel | null) {
    this.#modelOverride = model;
    this.render();
  }

  render(): void {
    if (this.#modelOverride) {
      applyMicrovizA11y(this, this.#internals, this.#modelOverride);
      animateTransition(this.#animState, this.#modelOverride, (m) =>
        this.#renderFrame(m),
      );
      return;
    }

    const validateAttr = this.getAttribute("validate");
    const validation: ValidationMode =
      validateAttr === "strict" || validateAttr === "skip"
        ? validateAttr
        : "normal";
    const strict = validation === "strict";

    const { data, dropped } = parseNumberArray(
      this.getAttribute("data"),
      strict,
    );
    const width = parseNumber(this.getAttribute("width"), 200);
    const height = parseNumber(this.getAttribute("height"), 32);
    const pad = this.hasAttribute("pad")
      ? parseNumber(this.getAttribute("pad"), 3)
      : undefined;

    const model = computeModel({
      data,
      size: { height, width },
      spec: { pad, type: SPEC_TYPE },
      validation,
    });

    // In strict mode, add warnings for dropped values
    if (strict && dropped && dropped.length > 0) {
      const existingWarnings = model.stats?.warnings ?? [];
      const droppedWarning = {
        code: "DROPPED_VALUES" as const,
        hint: "Use valid numbers only",
        message: `Dropped ${dropped.length} invalid value(s): ${dropped.map((d) => `"${d}"`).join(", ")}`,
        phase: "input" as const,
      };
      (model as { stats: typeof model.stats }).stats = {
        ...model.stats,
        hasDefs: model.stats?.hasDefs ?? false,
        markCount: model.stats?.markCount ?? 0,
        textCount: model.stats?.textCount ?? 0,
        warnings: [droppedWarning, ...existingWarnings],
      };
    }

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
    animateTransition(this.#animState, model, (m) => this.#renderFrame(m));
  }

  #renderFrame(model: RenderModel): void {
    renderSvgModelIntoShadowRoot(this.#root, model, {
      specType: SPEC_TYPE,
    });
  }
}
