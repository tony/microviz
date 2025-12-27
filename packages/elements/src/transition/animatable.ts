/**
 * Reusable animation state and helpers for microviz elements.
 *
 * This module provides a consistent pattern for adding animation support
 * to any element that renders a RenderModel.
 */

import type { RenderModel } from "@microviz/core";
import { animate, shouldReduceMotion } from "./animator";

/**
 * Animation state to be stored in each element instance.
 */
export type AnimationState = {
  previousModel: RenderModel | null;
  cancelAnimation: (() => void) | null;
};

/**
 * Create a new animation state object.
 * Call this once in your element's constructor or field initialization.
 */
export function createAnimationState(): AnimationState {
  return {
    cancelAnimation: null,
    previousModel: null,
  };
}

/**
 * Options for animateTransition.
 */
export type AnimateTransitionOptions = {
  /** Skip animation even if conditions allow it (e.g., skeleton mode) */
  skipAnimation?: boolean;
};

/**
 * Animate between the previous model and the next model.
 *
 * This function handles:
 * - Canceling any in-flight animation
 * - Checking reduced motion preference
 * - Calling renderFrame for each animation frame
 * - Updating previousModel when animation completes
 *
 * @param state - The animation state object (mutated)
 * @param nextModel - The target model to animate to
 * @param renderFrame - Function to render a model frame
 * @param options - Optional settings
 *
 * @example
 * ```typescript
 * class MyElement extends HTMLElement {
 *   #animState = createAnimationState();
 *
 *   render() {
 *     const model = computeModel(...);
 *     animateTransition(
 *       this.#animState,
 *       model,
 *       (m) => this.#renderFrame(m),
 *     );
 *   }
 *
 *   disconnectedCallback() {
 *     cleanupAnimation(this.#animState);
 *   }
 * }
 * ```
 */
export function animateTransition(
  state: AnimationState,
  nextModel: RenderModel,
  renderFrame: (model: RenderModel) => void,
  options: AnimateTransitionOptions = {},
): void {
  // Cancel any in-flight animation
  state.cancelAnimation?.();
  state.cancelAnimation = null;

  // Determine if we should animate
  const canAnimate =
    state.previousModel !== null &&
    !options.skipAnimation &&
    !shouldReduceMotion();

  if (canAnimate && state.previousModel) {
    state.cancelAnimation = animate(
      state.previousModel,
      nextModel,
      renderFrame,
      () => {
        state.previousModel = nextModel;
        state.cancelAnimation = null;
      },
    );
  } else {
    renderFrame(nextModel);
    state.previousModel = nextModel;
  }
}

/**
 * Clean up animation state on element disconnect.
 * Call this in disconnectedCallback to prevent memory leaks.
 */
export function cleanupAnimation(state: AnimationState): void {
  state.cancelAnimation?.();
  state.cancelAnimation = null;
}
