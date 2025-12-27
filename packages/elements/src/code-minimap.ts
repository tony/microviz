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

export class MicrovizCodeMinimap extends HTMLElement {
  static observedAttributes = ["data", "width", "height", "pad", "lines"];

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
    const { data: series } = parseNumberArray(this.getAttribute("data"));
    const width = parseNumber(this.getAttribute("width"), 32);
    const height = parseNumber(this.getAttribute("height"), 32);
    const pad = this.hasAttribute("pad")
      ? parseNumber(this.getAttribute("pad"), 0)
      : undefined;
    const lines = this.hasAttribute("lines")
      ? parseNumber(this.getAttribute("lines"), 8)
      : undefined;

    return computeModel({
      data: series,
      size: { height, width },
      spec: { lines, pad, type: "code-minimap" },
    });
  }
}
