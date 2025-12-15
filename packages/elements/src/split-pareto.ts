import { computeModel, type RenderModel } from "@microviz/core";
import { renderSvgString } from "@microviz/renderers";
import { applyMicrovizA11y } from "./a11y";
import { parseBitfieldSegments, parseNumber } from "./parse";
import { renderSvgIntoShadowRoot } from "./render";
import { applyMicrovizStyles } from "./styles";

export class MicrovizSplitPareto extends HTMLElement {
  static observedAttributes = [
    "data",
    "width",
    "height",
    "pad",
    "gap",
    "threshold",
    "divider-opacity",
    "divider-width",
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
    const gap = this.hasAttribute("gap")
      ? parseNumber(this.getAttribute("gap"), 0)
      : undefined;
    const threshold = this.hasAttribute("threshold")
      ? parseNumber(this.getAttribute("threshold"), 80)
      : undefined;
    const dividerOpacity = this.hasAttribute("divider-opacity")
      ? parseNumber(this.getAttribute("divider-opacity"), 0.6)
      : undefined;
    const dividerWidth = this.hasAttribute("divider-width")
      ? parseNumber(this.getAttribute("divider-width"), 2)
      : undefined;

    return computeModel({
      data: segments,
      size: { height, width },
      spec: {
        dividerOpacity,
        dividerWidth,
        gap,
        pad,
        threshold,
        type: "split-pareto",
      },
    });
  }
}
