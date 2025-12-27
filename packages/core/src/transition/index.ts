/**
 * Transition module: pure interpolation functions for animating RenderModels.
 *
 * This module is Worker-safe and has no DOM dependencies.
 * Animation timing (RAF loop) lives in @microviz/elements.
 */

export {
  type EasingName,
  easings,
  interpolateMark,
  interpolateModel,
  lerp,
} from "./interpolation";

export {
  arePathsCompatible,
  interpolatePath,
  interpolatePathMark,
  type PathCommand,
  parsePath,
  serializePath,
} from "./pathMorph";
