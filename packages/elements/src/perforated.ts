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

export class MicrovizPerforated extends HTMLElement {
  static observedAttributes = [
    "animate",
    "data",
    "width",
    "height",
    "pad",
    "separator-width",
    "dot-opacity",
    "dot-radius",
    "pattern-size",
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
    const width = parseNumber(this.getAttribute("width"), 200);
    const height = parseNumber(this.getAttribute("height"), 32);
    const pad = this.hasAttribute("pad")
      ? parseNumber(this.getAttribute("pad"), 0)
      : undefined;
    const separatorWidth = this.hasAttribute("separator-width")
      ? parseNumber(this.getAttribute("separator-width"), 1)
      : undefined;
    const dotOpacity = this.hasAttribute("dot-opacity")
      ? parseNumber(this.getAttribute("dot-opacity"), 0.22)
      : undefined;
    const dotRadius = this.hasAttribute("dot-radius")
      ? parseNumber(this.getAttribute("dot-radius"), 1)
      : undefined;
    const patternSize = this.hasAttribute("pattern-size")
      ? parseNumber(this.getAttribute("pattern-size"), 4)
      : undefined;

    return computeModel({
      data: segments,
      size: { height, width },
      spec: {
        dotOpacity,
        dotRadius,
        pad,
        patternSize,
        separatorWidth,
        type: "perforated",
      },
    });
  }
}
