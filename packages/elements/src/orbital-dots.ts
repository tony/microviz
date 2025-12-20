import { computeModel, type RenderModel } from "@microviz/core";
import { renderSvgString } from "@microviz/renderers";
import { applyMicrovizA11y } from "./a11y";
import { parseBitfieldSegments, parseNumber } from "./parse";
import { renderSvgIntoShadowRoot } from "./render";
import { applyMicrovizStyles } from "./styles";

export class MicrovizOrbitalDots extends HTMLElement {
  static observedAttributes = [
    "data",
    "width",
    "height",
    "pad",
    "radius",
    "min-dot-radius",
    "max-dot-radius",
    "ring-stroke-width",
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
    const radius = this.hasAttribute("radius")
      ? parseNumber(this.getAttribute("radius"), 0)
      : undefined;
    const minDotRadius = this.hasAttribute("min-dot-radius")
      ? parseNumber(this.getAttribute("min-dot-radius"), 2)
      : undefined;
    const maxDotRadius = this.hasAttribute("max-dot-radius")
      ? parseNumber(this.getAttribute("max-dot-radius"), 6)
      : undefined;
    const ringStrokeWidth = this.hasAttribute("ring-stroke-width")
      ? parseNumber(this.getAttribute("ring-stroke-width"), 1)
      : undefined;

    return computeModel({
      data: segments,
      size: { height, width },
      spec: {
        maxDotRadius,
        minDotRadius,
        pad,
        radius,
        ringStrokeWidth,
        type: "orbital-dots",
      },
    });
  }
}
