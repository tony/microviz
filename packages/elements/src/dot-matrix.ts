import { computeModel, type RenderModel } from "@microviz/core";
import { applyMicrovizA11y } from "./a11y";
import { parseNumber, parseNumberArray } from "./parse";
import { renderSvgModelIntoShadowRoot } from "./render";
import { applyMicrovizStyles } from "./styles";
import {
  type AnimationState,
  animateTransition,
  cleanupAnimation,
  createAnimationState,
} from "./transition";

const SPEC_TYPE = "dot-matrix";

export class MicrovizDotMatrix extends HTMLElement {
  static observedAttributes = [
    "animate",
    "data",
    "opacities",
    "width",
    "height",
    "pad",
    "cols",
    "max-dots",
    "dot-radius",
  ];

  readonly #internals: ElementInternals | null;
  readonly #root: ShadowRoot;
  readonly #animState: AnimationState = createAnimationState(this);
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
    renderSvgModelIntoShadowRoot(this.#root, model, {
      specType: SPEC_TYPE,
    });
  }

  #computeFromAttributes(): RenderModel {
    const { data: series } = parseNumberArray(this.getAttribute("data"));
    const opacities = this.hasAttribute("opacities")
      ? parseNumberArray(this.getAttribute("opacities")).data
      : undefined;

    const width = parseNumber(this.getAttribute("width"), 200);
    const height = parseNumber(this.getAttribute("height"), 32);
    const pad = this.hasAttribute("pad")
      ? parseNumber(this.getAttribute("pad"), 0)
      : undefined;
    const cols = this.hasAttribute("cols")
      ? parseNumber(this.getAttribute("cols"), 32)
      : undefined;
    const maxDots = this.hasAttribute("max-dots")
      ? parseNumber(this.getAttribute("max-dots"), 4)
      : undefined;
    const dotRadius = this.hasAttribute("dot-radius")
      ? parseNumber(this.getAttribute("dot-radius"), 3)
      : undefined;

    return computeModel({
      data: { opacities, series },
      size: { height, width },
      spec: { cols, dotRadius, maxDots, pad, type: SPEC_TYPE },
    });
  }
}
