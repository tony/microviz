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

export class MicrovizStackedChips extends HTMLElement {
  static observedAttributes = [
    "animate",
    "data",
    "width",
    "height",
    "pad",
    "max-chips",
    "overlap",
    "min-chip-width",
    "max-chip-width",
    "chip-height",
    "corner-radius",
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
    const svg = renderSvgString(model);
    patchSvgIntoShadowRoot(this.#root, svg);
  }

  #computeFromAttributes(): RenderModel {
    const segments = parseBitfieldSegments(this.getAttribute("data"));
    const width = parseNumber(this.getAttribute("width"), 200);
    const height = parseNumber(this.getAttribute("height"), 32);
    const pad = this.hasAttribute("pad")
      ? parseNumber(this.getAttribute("pad"), 0)
      : undefined;
    const maxChips = this.hasAttribute("max-chips")
      ? parseNumber(this.getAttribute("max-chips"), 4)
      : undefined;
    const overlap = this.hasAttribute("overlap")
      ? parseNumber(this.getAttribute("overlap"), 4)
      : undefined;
    const minChipWidth = this.hasAttribute("min-chip-width")
      ? parseNumber(this.getAttribute("min-chip-width"), 12)
      : undefined;
    const maxChipWidth = this.hasAttribute("max-chip-width")
      ? parseNumber(this.getAttribute("max-chip-width"), 24)
      : undefined;
    const chipHeight = this.hasAttribute("chip-height")
      ? parseNumber(this.getAttribute("chip-height"), 0)
      : undefined;
    const cornerRadius = this.hasAttribute("corner-radius")
      ? parseNumber(this.getAttribute("corner-radius"), 0)
      : undefined;
    const strokeWidth = this.hasAttribute("stroke-width")
      ? parseNumber(this.getAttribute("stroke-width"), 2)
      : undefined;

    return computeModel({
      data: segments,
      size: { height, width },
      spec: {
        chipHeight,
        cornerRadius,
        maxChips,
        maxChipWidth,
        minChipWidth,
        overlap,
        pad,
        strokeWidth,
        type: "stacked-chips",
      },
    });
  }
}
