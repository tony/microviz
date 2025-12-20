import type { RenderModel } from "@microviz/core";
import { renderSvgString } from "@microviz/renderers";
import { applyMicrovizA11y } from "./a11y";
import { clearSvgFromShadowRoot, renderSvgIntoShadowRoot } from "./render";
import { applyMicrovizStyles } from "./styles";

export class MicrovizModel extends HTMLElement {
  readonly #internals: ElementInternals | null;
  readonly #root: ShadowRoot;
  #model: RenderModel | null = null;

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

  get model(): RenderModel | null {
    return this.#model;
  }

  set model(model: RenderModel | null) {
    this.#model = model;
    this.render();
  }

  render(): void {
    if (!this.#model) {
      applyMicrovizA11y(this, this.#internals, null);
      clearSvgFromShadowRoot(this.#root);
      return;
    }

    applyMicrovizA11y(this, this.#internals, this.#model);
    const svg = renderSvgString(this.#model);
    renderSvgIntoShadowRoot(this.#root, svg);
  }
}
