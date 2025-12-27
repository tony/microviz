import { computeModel, type RenderModel } from "@microviz/core";
import { applyMicrovizA11y } from "./a11y";
import { parseBitfieldSegments, parseNumber } from "./parse";
import { renderSvgModelIntoShadowRoot } from "./render";
import { applyMicrovizStyles } from "./styles";
import {
  animate,
  getMotionConfig,
  isAnimationEnabled,
  shouldReduceMotion,
} from "./transition";

const SPEC_TYPE = "donut";

export class MicrovizDonut extends HTMLElement {
  static observedAttributes = [
    "animate",
    "data",
    "width",
    "height",
    "pad",
    "inner-radius",
  ];

  readonly #internals: ElementInternals | null;
  readonly #root: ShadowRoot;
  #modelOverride: RenderModel | null = null;
  #previousModel: RenderModel | null = null;
  #cancelAnimation: (() => void) | null = null;

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
    this.#cancelAnimation?.();
    this.#cancelAnimation = null;
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

    // Cancel any in-flight animation
    this.#cancelAnimation?.();
    this.#cancelAnimation = null;

    const motionConfig = getMotionConfig(this);
    const durationDisabled =
      typeof motionConfig.duration === "number" && motionConfig.duration <= 0;
    const canAnimate =
      this.#previousModel &&
      isAnimationEnabled(this) &&
      !shouldReduceMotion() &&
      !durationDisabled;
    // Animate if we have a previous model and motion is not reduced
    if (canAnimate && this.#previousModel) {
      this.#cancelAnimation = animate(
        this.#previousModel,
        model,
        (interpolated) => this.#renderFrame(interpolated),
        () => {
          this.#previousModel = model;
          this.#cancelAnimation = null;
        },
        motionConfig,
      );
    } else {
      this.#renderFrame(model);
      this.#previousModel = model;
    }
  }

  #renderFrame(model: RenderModel): void {
    renderSvgModelIntoShadowRoot(this.#root, model, {
      specType: SPEC_TYPE,
    });
  }

  #computeFromAttributes(): RenderModel {
    const segments = parseBitfieldSegments(this.getAttribute("data"));
    const width = parseNumber(this.getAttribute("width"), 32);
    const height = parseNumber(this.getAttribute("height"), 32);
    const pad = this.hasAttribute("pad")
      ? parseNumber(this.getAttribute("pad"), 2)
      : undefined;
    const innerRadius = this.hasAttribute("inner-radius")
      ? parseNumber(this.getAttribute("inner-radius"), 0.5)
      : undefined;

    return computeModel({
      data: segments,
      size: { height, width },
      spec: { innerRadius, pad, type: SPEC_TYPE },
    });
  }
}
