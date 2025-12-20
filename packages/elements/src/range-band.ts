import { computeModel, type RenderModel } from "@microviz/core";
import { renderSvgString } from "@microviz/renderers";
import { applyMicrovizA11y } from "./a11y";
import { parseNumber, parseNumberArray } from "./parse";
import { renderSvgIntoShadowRoot } from "./render";
import { applyMicrovizStyles } from "./styles";

export class MicrovizRangeBand extends HTMLElement {
  static observedAttributes = [
    "data",
    "width",
    "height",
    "pad",
    "band-seed",
    "band-opacity",
    "dot-radius",
    "stroke-width",
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
    const data = parseNumberArray(this.getAttribute("data"));
    const width = parseNumber(this.getAttribute("width"), 200);
    const height = parseNumber(this.getAttribute("height"), 32);
    const pad = this.hasAttribute("pad")
      ? parseNumber(this.getAttribute("pad"), 3)
      : undefined;
    const bandSeed = this.hasAttribute("band-seed")
      ? parseNumber(this.getAttribute("band-seed"), 0)
      : undefined;
    const bandOpacity = this.hasAttribute("band-opacity")
      ? parseNumber(this.getAttribute("band-opacity"), 0.18)
      : undefined;
    const dotRadius = this.hasAttribute("dot-radius")
      ? parseNumber(this.getAttribute("dot-radius"), 2.2)
      : undefined;
    const strokeWidth = this.hasAttribute("stroke-width")
      ? parseNumber(this.getAttribute("stroke-width"), 2)
      : undefined;

    return computeModel({
      data,
      size: { height, width },
      spec: {
        bandOpacity,
        bandSeed,
        dotRadius,
        pad,
        strokeWidth,
        type: "range-band",
      },
    });
  }
}
