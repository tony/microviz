import { computeModel, type RenderModel } from "@microviz/core";
import { renderSvgString } from "@microviz/renderers";
import { applyMicrovizA11y } from "./a11y";
import { parseNumber } from "./parse";
import { renderSvgIntoShadowRoot } from "./render";
import { applyMicrovizStyles } from "./styles";

export class MicrovizBulletDelta extends HTMLElement {
  static observedAttributes = [
    "current",
    "previous",
    "max",
    "width",
    "height",
    "pad",
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
    if (this.#modelOverride) {
      applyMicrovizA11y(this, this.#internals, this.#modelOverride);
      const svg = renderSvgString(this.#modelOverride);
      renderSvgIntoShadowRoot(this.#root, svg);
      return;
    }

    const width = parseNumber(this.getAttribute("width"), 200);
    const height = parseNumber(this.getAttribute("height"), 32);
    const current = parseNumber(this.getAttribute("current"), 0);
    const previous = parseNumber(this.getAttribute("previous"), 0);
    const max = this.hasAttribute("max")
      ? parseNumber(this.getAttribute("max"), 100)
      : undefined;
    const pad = this.hasAttribute("pad")
      ? parseNumber(this.getAttribute("pad"), 4)
      : undefined;

    const model = computeModel({
      data: { current, max, previous },
      size: { height, width },
      spec: { pad, type: "bullet-delta" },
    });
    applyMicrovizA11y(this, this.#internals, model);

    const svg = renderSvgString(model);
    renderSvgIntoShadowRoot(this.#root, svg);
  }
}
