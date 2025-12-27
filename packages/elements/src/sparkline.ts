import {
  computeModel,
  type RenderModel,
  type ValidationMode,
} from "@microviz/core";
import { renderSvgString } from "@microviz/renderers";
import { applyMicrovizA11y } from "./a11y";
import { parseNumber, parseNumberArray } from "./parse";
import { renderSvgIntoShadowRoot } from "./render";
import { applyMicrovizStyles } from "./styles";

export class MicrovizSparkline extends HTMLElement {
  static observedAttributes = ["data", "width", "height", "pad", "validate"];

  readonly #internals: ElementInternals | null;
  readonly #root: ShadowRoot;
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
      const svg = renderSvgString(this.#modelOverride);
      renderSvgIntoShadowRoot(this.#root, svg);
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
      spec: { pad, type: "sparkline" },
      validation,
    });

    // In strict mode, add warnings for dropped values
    if (strict && dropped && dropped.length > 0) {
      const existingWarnings = model.stats?.warnings ?? [];
      const droppedWarning = {
        code: "DROPPED_VALUES" as const,
        hint: "Use valid numbers only",
        message: `Dropped ${dropped.length} invalid value(s): ${dropped.map((d) => `"${d}"`).join(", ")}`,
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

    const svg = renderSvgString(model);
    renderSvgIntoShadowRoot(this.#root, svg);
  }
}
