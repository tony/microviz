import { computeModel, type RenderModel } from "@microviz/core";
import { renderSvgString } from "@microviz/renderers";
import { applyMicrovizA11y } from "./a11y";
import { parseNumber, parseNumberArray } from "./parse";
import { patchSvgIntoShadowRoot } from "./render";
import { applyMicrovizStyles } from "./styles";
import {
  type AnimationState,
  animateTransition,
  cleanupAnimation,
  createAnimationState,
} from "./transition";

export class MicrovizSparkArea extends HTMLElement {
  static observedAttributes = [
    "data",
    "width",
    "height",
    "pad",
    "dot-radius",
    "stroke-width",
    "gradient-top-opacity",
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
    const { data } = parseNumberArray(this.getAttribute("data"));
    const width = parseNumber(this.getAttribute("width"), 200);
    const height = parseNumber(this.getAttribute("height"), 32);
    const pad = this.hasAttribute("pad")
      ? parseNumber(this.getAttribute("pad"), 3)
      : undefined;
    const dotRadius = this.hasAttribute("dot-radius")
      ? parseNumber(this.getAttribute("dot-radius"), 2.2)
      : undefined;
    const strokeWidth = this.hasAttribute("stroke-width")
      ? parseNumber(this.getAttribute("stroke-width"), 2)
      : undefined;
    const gradientTopOpacity = this.hasAttribute("gradient-top-opacity")
      ? parseNumber(this.getAttribute("gradient-top-opacity"), 0.45)
      : undefined;

    return computeModel({
      data,
      size: { height, width },
      spec: {
        dotRadius,
        gradientTopOpacity,
        pad,
        strokeWidth,
        type: "spark-area",
      },
    });
  }
}
