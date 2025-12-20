import { computeModel, type RenderModel } from "@microviz/core";
import { renderSvgString } from "@microviz/renderers";
import { applyMicrovizA11y } from "./a11y";
import { parseBitfieldSegments, parseNumber } from "./parse";
import { renderSvgIntoShadowRoot } from "./render";
import { applyMicrovizStyles } from "./styles";

export class MicrovizDnaHelix extends HTMLElement {
  static observedAttributes = [
    "data",
    "width",
    "height",
    "pad",
    "gap",
    "strand-gap",
    "strand-height",
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
    const gap = this.hasAttribute("gap")
      ? parseNumber(this.getAttribute("gap"), 2)
      : undefined;
    const strandGap = this.hasAttribute("strand-gap")
      ? parseNumber(this.getAttribute("strand-gap"), 4)
      : undefined;
    const strandHeight = this.hasAttribute("strand-height")
      ? parseNumber(this.getAttribute("strand-height"), 6)
      : undefined;

    return computeModel({
      data: segments,
      size: { height, width },
      spec: { gap, pad, strandGap, strandHeight, type: "dna-helix" },
    });
  }
}
