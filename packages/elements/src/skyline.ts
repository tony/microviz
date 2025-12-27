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

const SPEC_TYPE = "skyline";

export class MicrovizSkyline extends HTMLElement {
  static observedAttributes = [
    "animate",
    "data",
    "width",
    "height",
    "pad",
    "gap",
    "min-height-pct",
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
    const segments = parseBitfieldSegments(this.getAttribute("data"));
    const width = parseNumber(this.getAttribute("width"), 200);
    const height = parseNumber(this.getAttribute("height"), 32);
    const pad = this.hasAttribute("pad")
      ? parseNumber(this.getAttribute("pad"), 0)
      : undefined;
    const gap = this.hasAttribute("gap")
      ? parseNumber(this.getAttribute("gap"), 2)
      : undefined;
    const minHeightPct = this.hasAttribute("min-height-pct")
      ? parseNumber(this.getAttribute("min-height-pct"), 20)
      : undefined;

    return computeModel({
      data: segments,
      size: { height, width },
      spec: { gap, minHeightPct, pad, type: SPEC_TYPE },
    });
  }
}
