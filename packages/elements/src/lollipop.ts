import { computeModel, type RenderModel } from "@microviz/core";
import { renderSvgString } from "@microviz/renderers";
import { applyMicrovizA11y } from "./a11y";
import { parseBitfieldSegments, parseNumber } from "./parse";
import { renderSvgIntoShadowRoot } from "./render";
import { applyMicrovizStyles } from "./styles";

export class MicrovizLollipop extends HTMLElement {
  static observedAttributes = [
    "data",
    "width",
    "height",
    "pad",
    "max-items",
    "stem-width",
    "dot-radius",
    "min-stem-height",
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
      ? parseNumber(this.getAttribute("pad"), 2)
      : undefined;
    const maxItems = this.hasAttribute("max-items")
      ? parseNumber(this.getAttribute("max-items"), 5)
      : undefined;
    const stemWidth = this.hasAttribute("stem-width")
      ? parseNumber(this.getAttribute("stem-width"), 4)
      : undefined;
    const dotRadius = this.hasAttribute("dot-radius")
      ? parseNumber(this.getAttribute("dot-radius"), 5)
      : undefined;
    const minStemHeight = this.hasAttribute("min-stem-height")
      ? parseNumber(this.getAttribute("min-stem-height"), 6)
      : undefined;

    return computeModel({
      data: segments,
      size: { height, width },
      spec: {
        dotRadius,
        maxItems,
        minStemHeight,
        pad,
        stemWidth,
        type: "lollipop",
      },
    });
  }
}
