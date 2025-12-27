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

export class MicrovizHeatgrid extends HTMLElement {
  static observedAttributes = [
    "animate",
    "data",
    "opacities",
    "width",
    "height",
    "pad",
    "cols",
    "rows",
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
      ? parseNumber(this.getAttribute("cols"), 12)
      : undefined;
    const rows = this.hasAttribute("rows")
      ? parseNumber(this.getAttribute("rows"), 4)
      : undefined;

    return computeModel({
      data: { opacities, series },
      size: { height, width },
      spec: { cols, pad, rows, type: "heatgrid" },
    });
  }
}
