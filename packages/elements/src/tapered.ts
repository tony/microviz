import { computeModel, type RenderModel } from "@microviz/core";
import { renderSvgString } from "@microviz/renderers";
import { applyMicrovizA11y } from "./a11y";
import { parseBitfieldSegments, parseNumber } from "./parse";
import { renderSvgIntoShadowRoot } from "./render";
import { applyMicrovizStyles } from "./styles";

export class MicrovizTapered extends HTMLElement {
  static observedAttributes = [
    "data",
    "width",
    "height",
    "pad",
    "taper-pct",
    "height-step-pct",
    "min-height-pct",
  ];

  readonly #internals: ElementInternals | null;
  readonly #root: ShadowRoot;
  #modelOverride: RenderModel | null = null;

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
    const model = this.#modelOverride ?? this.#computeFromAttributes();
    applyMicrovizA11y(this, this.#internals, model);
    const svg = renderSvgString(model);
    renderSvgIntoShadowRoot(this.#root, svg);
  }

  #computeFromAttributes(): RenderModel {
    const segments = parseBitfieldSegments(this.getAttribute("data"));
    const width = parseNumber(this.getAttribute("width"), 200);
    const height = parseNumber(this.getAttribute("height"), 32);
    const pad = this.hasAttribute("pad")
      ? parseNumber(this.getAttribute("pad"), 0)
      : undefined;
    const taperPct = this.hasAttribute("taper-pct")
      ? parseNumber(this.getAttribute("taper-pct"), 0.1)
      : undefined;
    const heightStepPct = this.hasAttribute("height-step-pct")
      ? parseNumber(this.getAttribute("height-step-pct"), 0.12)
      : undefined;
    const minHeightPct = this.hasAttribute("min-height-pct")
      ? parseNumber(this.getAttribute("min-height-pct"), 0.4)
      : undefined;

    return computeModel({
      data: segments,
      size: { height, width },
      spec: { heightStepPct, minHeightPct, pad, taperPct, type: "tapered" },
    });
  }
}
