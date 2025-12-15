import { computeModel, type RenderModel } from "@microviz/core";
import { renderSvgString } from "@microviz/renderers";
import { applyMicrovizA11y } from "./a11y";
import { parseBitfieldSegments, parseNumber } from "./parse";
import { renderSvgIntoShadowRoot } from "./render";
import { applyMicrovizStyles } from "./styles";

export class MicrovizBulletGauge extends HTMLElement {
  static observedAttributes = [
    "data",
    "width",
    "height",
    "pad",
    "gap",
    "marker-position",
    "marker-opacity",
    "marker-width",
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
    const markerPosition = this.hasAttribute("marker-position")
      ? parseNumber(this.getAttribute("marker-position"), 50)
      : undefined;
    const markerOpacity = this.hasAttribute("marker-opacity")
      ? parseNumber(this.getAttribute("marker-opacity"), 0.4)
      : undefined;
    const markerWidth = this.hasAttribute("marker-width")
      ? parseNumber(this.getAttribute("marker-width"), 2)
      : undefined;

    return computeModel({
      data: segments,
      size: { height, width },
      spec: {
        gap,
        markerOpacity,
        markerPosition,
        markerWidth,
        pad,
        type: "bullet-gauge",
      },
    });
  }
}
