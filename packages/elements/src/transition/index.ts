/**
 * Transition module for @microviz/elements.
 * Provides animation coordination using requestAnimationFrame.
 */

export {
  type AnimateTransitionOptions,
  type AnimationState,
  animateTransition,
  cleanupAnimation,
  createAnimationState,
} from "./animatable";
export { type AnimationConfig, animate, shouldReduceMotion } from "./animator";
