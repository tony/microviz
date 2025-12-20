import { hitTest, type RenderModel } from "@microviz/core";
import { renderSvgString } from "@microviz/renderers";
import { applyMicrovizA11y } from "./a11y";
import { clearSvgFromShadowRoot, renderSvgIntoShadowRoot } from "./render";
import { renderSkeletonSvg, shouldRenderSkeleton } from "./skeleton";
import { applyMicrovizStyles } from "./styles";

type Point = { x: number; y: number };

export class MicrovizModel extends HTMLElement {
  static observedAttributes = ["interactive", "skeleton"];

  readonly #internals: ElementInternals | null;
  readonly #root: ShadowRoot;
  #model: RenderModel | null = null;
  #isInteractive = false;

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
    this.#syncInteractivity();
    this.render();
  }

  disconnectedCallback(): void {
    this.#setInteractive(false);
  }

  attributeChangedCallback(): void {
    this.#syncInteractivity();
  }

  get model(): RenderModel | null {
    return this.#model;
  }

  set model(model: RenderModel | null) {
    this.#model = model;
    this.render();
  }

  #syncInteractivity(): void {
    this.#setInteractive(this.hasAttribute("interactive"));
  }

  #setInteractive(enabled: boolean): void {
    if (enabled === this.#isInteractive) return;
    this.#isInteractive = enabled;

    if (enabled) {
      this.addEventListener("pointermove", this.#onPointerMove);
      this.addEventListener("pointerleave", this.#onPointerLeave);
      return;
    }

    this.removeEventListener("pointermove", this.#onPointerMove);
    this.removeEventListener("pointerleave", this.#onPointerLeave);
  }

  #toModelPoint(event: PointerEvent): Point | null {
    if (!this.#model) return null;
    const svg = this.#root.querySelector("svg");
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    if (!(rect.width > 0) || !(rect.height > 0)) return null;

    const x = ((event.clientX - rect.left) / rect.width) * this.#model.width;
    const y = ((event.clientY - rect.top) / rect.height) * this.#model.height;
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

    return { x, y };
  }

  #onPointerMove = (event: PointerEvent): void => {
    if (!this.#model) return;
    const point = this.#toModelPoint(event);
    if (!point) return;

    const hit = hitTest(this.#model, point);
    this.dispatchEvent(
      new CustomEvent("microviz-hit", {
        bubbles: true,
        composed: true,
        detail: { client: { x: event.clientX, y: event.clientY }, hit, point },
      }),
    );
  };

  #onPointerLeave = (event: PointerEvent): void => {
    this.dispatchEvent(
      new CustomEvent("microviz-hit", {
        bubbles: true,
        composed: true,
        detail: { client: { x: event.clientX, y: event.clientY }, hit: null },
      }),
    );
  };

  render(): void {
    if (!this.#model) {
      applyMicrovizA11y(this, this.#internals, null);
      clearSvgFromShadowRoot(this.#root);
      return;
    }

    const model = this.#model;
    applyMicrovizA11y(this, this.#internals, model);

    const svg =
      this.hasAttribute("skeleton") && shouldRenderSkeleton(model)
        ? renderSkeletonSvg({ height: model.height, width: model.width })
        : renderSvgString(model);
    renderSvgIntoShadowRoot(this.#root, svg);
  }
}
