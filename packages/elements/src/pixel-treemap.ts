import { computeModel, type RenderModel } from "@microviz/core";
import { renderSvgString } from "@microviz/renderers";
import { applyMicrovizA11y } from "./a11y";
import { parseBitfieldSegments, parseNumber } from "./parse";
import { patchSvgIntoShadowRoot } from "./render";
import { applyMicrovizStyles } from "./styles";
import {
  type AnimationState,
  animateTransition,
  cleanupAnimation,
  createAnimationState,
} from "./transition";

export class MicrovizPixelTreemap extends HTMLElement {
  static observedAttributes = [
    "data",
    "width",
    "height",
    "pad",
    "corner-radius",
    "stroke",
    "stroke-opacity",
    "stroke-width",
  ];

  readonly #internals: ElementInternals | null;
  readonly #root: ShadowRoot;
  readonly #animState: AnimationState = createAnimationState();
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
    const model = this.#modelOverride ?? this.#computeFromAttributes();
    applyMicrovizA11y(this, this.#internals, model);
    animateTransition(this.#animState, model, (m) => this.#renderFrame(m));
  }

  #renderFrame(model: RenderModel): void {
    const svg = renderSvgString(model);
    patchSvgIntoShadowRoot(this.#root, svg);
  }

  #computeFromAttributes(): RenderModel {
    const segments = parseBitfieldSegments(this.getAttribute("data"));
    const width = parseNumber(this.getAttribute("width"), 32);
    const height = parseNumber(this.getAttribute("height"), 32);
    const pad = this.hasAttribute("pad")
      ? parseNumber(this.getAttribute("pad"), 0)
      : undefined;
    const cornerRadius = this.hasAttribute("corner-radius")
      ? parseNumber(this.getAttribute("corner-radius"), 0)
      : undefined;
    const strokeWidth = this.hasAttribute("stroke-width")
      ? parseNumber(this.getAttribute("stroke-width"), 0.5)
      : undefined;
    const strokeOpacity = this.hasAttribute("stroke-opacity")
      ? parseNumber(this.getAttribute("stroke-opacity"), 0.3)
      : undefined;
    const stroke = this.getAttribute("stroke") || undefined;

    return computeModel({
      data: segments,
      size: { height, width },
      spec: {
        cornerRadius,
        pad,
        stroke,
        strokeOpacity,
        strokeWidth,
        type: "pixel-treemap",
      },
    });
  }
}
