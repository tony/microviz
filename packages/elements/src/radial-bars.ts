import { computeModel, type RenderModel } from "@microviz/core";
import { applyMicrovizA11y } from "./a11y";
import { parseBitfieldSegments, parseNumber } from "./parse";
import { renderSvgModelIntoShadowRoot } from "./render";
import { applyMicrovizStyles } from "./styles";
import {
  type AnimationState,
  animateTransition,
  cleanupAnimation,
  createAnimationState,
} from "./transition";

export class MicrovizRadialBars extends HTMLElement {
  static observedAttributes = [
    "animate",
    "data",
    "width",
    "height",
    "pad",
    "start-radius",
    "min-length",
    "max-length",
    "stroke-width",
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
    renderSvgModelIntoShadowRoot(this.#root, model);
  }

  #computeFromAttributes(): RenderModel {
    const segments = parseBitfieldSegments(this.getAttribute("data"));
    const width = parseNumber(this.getAttribute("width"), 32);
    const height = parseNumber(this.getAttribute("height"), 32);
    const pad = this.hasAttribute("pad")
      ? parseNumber(this.getAttribute("pad"), 0)
      : undefined;
    const startRadius = this.hasAttribute("start-radius")
      ? parseNumber(this.getAttribute("start-radius"), 0)
      : undefined;
    const minLength = this.hasAttribute("min-length")
      ? parseNumber(this.getAttribute("min-length"), 0)
      : undefined;
    const maxLength = this.hasAttribute("max-length")
      ? parseNumber(this.getAttribute("max-length"), 0)
      : undefined;
    const strokeWidth = this.hasAttribute("stroke-width")
      ? parseNumber(this.getAttribute("stroke-width"), 2.5)
      : undefined;

    return computeModel({
      data: segments,
      size: { height, width },
      spec: {
        maxLength,
        minLength,
        pad,
        startRadius,
        strokeWidth,
        type: "radial-bars",
      },
    });
  }
}
