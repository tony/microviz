import type {
  CircleMark,
  LineMark,
  Mark,
  PathMark,
  RectMark,
  RenderModel,
  TextMark,
} from "../model";
import { interpolatePathMark } from "./pathMorph";

/**
 * Easing functions for animation timing.
 * Pure math functions: t → t' where both are in [0, 1].
 */
export const easings = {
  easeInOut: (t: number): number =>
    t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2,
  easeOut: (t: number): number => 1 - (1 - t) ** 3,
  linear: (t: number): number => t,
} as const;

export type EasingName = keyof typeof easings;

/**
 * Linear interpolation between two numbers.
 */
export function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

/**
 * Interpolate optional numeric values.
 * If either value is undefined, returns the target value.
 */
function lerpOptional(
  from: number | undefined,
  to: number | undefined,
  t: number,
): number | undefined {
  if (from === undefined || to === undefined) {
    return t < 1 ? from : to;
  }
  return lerp(from, to, t);
}

/**
 * Interpolate a RectMark between two states.
 */
function interpolateRectMark(
  from: RectMark,
  to: RectMark,
  t: number,
): RectMark {
  return {
    ...to,
    fillOpacity: lerpOptional(from.fillOpacity, to.fillOpacity, t),
    h: lerp(from.h, to.h, t),
    opacity: lerpOptional(from.opacity, to.opacity, t),
    rx: lerpOptional(from.rx, to.rx, t),
    ry: lerpOptional(from.ry, to.ry, t),
    strokeOpacity: lerpOptional(from.strokeOpacity, to.strokeOpacity, t),
    strokeWidth: lerpOptional(from.strokeWidth, to.strokeWidth, t),
    w: lerp(from.w, to.w, t),
    x: lerp(from.x, to.x, t),
    y: lerp(from.y, to.y, t),
  };
}

/**
 * Interpolate a CircleMark between two states.
 */
function interpolateCircleMark(
  from: CircleMark,
  to: CircleMark,
  t: number,
): CircleMark {
  return {
    ...to,
    cx: lerp(from.cx, to.cx, t),
    cy: lerp(from.cy, to.cy, t),
    fillOpacity: lerpOptional(from.fillOpacity, to.fillOpacity, t),
    opacity: lerpOptional(from.opacity, to.opacity, t),
    r: lerp(from.r, to.r, t),
    strokeOpacity: lerpOptional(from.strokeOpacity, to.strokeOpacity, t),
    strokeWidth: lerpOptional(from.strokeWidth, to.strokeWidth, t),
  };
}

/**
 * Interpolate a LineMark between two states.
 */
function interpolateLineMark(
  from: LineMark,
  to: LineMark,
  t: number,
): LineMark {
  return {
    ...to,
    opacity: lerpOptional(from.opacity, to.opacity, t),
    strokeOpacity: lerpOptional(from.strokeOpacity, to.strokeOpacity, t),
    strokeWidth: lerpOptional(from.strokeWidth, to.strokeWidth, t),
    x1: lerp(from.x1, to.x1, t),
    x2: lerp(from.x2, to.x2, t),
    y1: lerp(from.y1, to.y1, t),
    y2: lerp(from.y2, to.y2, t),
  };
}

/**
 * Interpolate a TextMark between two states.
 * Text content snaps to target; only position interpolates.
 */
function interpolateTextMark(
  from: TextMark,
  to: TextMark,
  t: number,
): TextMark {
  return {
    ...to,
    fillOpacity: lerpOptional(from.fillOpacity, to.fillOpacity, t),
    opacity: lerpOptional(from.opacity, to.opacity, t),
    // Text content snaps at t=1
    text: t < 1 ? from.text : to.text,
    x: lerp(from.x, to.x, t),
    y: lerp(from.y, to.y, t),
  };
}

const DONUT_SEGMENT_CLASS = "mv-donut-segment";

function isDonutSegmentMark(mark: PathMark): boolean {
  if (mark.id.startsWith("donut-segment-")) return true;
  if (!mark.className) return false;
  return mark.className.split(/\s+/).includes(DONUT_SEGMENT_CLASS);
}

function interpolateDonutPathMark(
  from: PathMark,
  to: PathMark,
  t: number,
): PathMark {
  return {
    ...to,
    fillOpacity: lerpOptional(from.fillOpacity, to.fillOpacity, t),
    opacity: lerpOptional(from.opacity, to.opacity, t),
    strokeOpacity: lerpOptional(from.strokeOpacity, to.strokeOpacity, t),
    strokeWidth: lerpOptional(from.strokeWidth, to.strokeWidth, t),
  };
}

/**
 * Interpolate a single mark between two states.
 * If mark types differ, returns the target immediately.
 */
export function interpolateMark(from: Mark, to: Mark, t: number): Mark {
  // Type mismatch: snap to target
  if (from.type !== to.type) {
    return to;
  }

  switch (from.type) {
    case "rect":
      return interpolateRectMark(from, to as RectMark, t);
    case "circle":
      return interpolateCircleMark(from, to as CircleMark, t);
    case "line":
      return interpolateLineMark(from, to as LineMark, t);
    case "text":
      return interpolateTextMark(from, to as TextMark, t);
    case "path": {
      const toPath = to as PathMark;
      if (isDonutSegmentMark(from) || isDonutSegmentMark(toPath)) {
        return interpolateDonutPathMark(from, toPath, t);
      }
      return interpolatePathMark(from, toPath, t);
    }
    default:
      return to;
  }
}

/**
 * Interpolate a RenderModel between two states.
 * Matches marks by ID and interpolates matching pairs.
 * New marks appear immediately; removed marks disappear immediately.
 */
export function interpolateModel(
  from: RenderModel,
  to: RenderModel,
  t: number,
): RenderModel {
  // Build map of existing marks by ID
  const fromById = new Map<string, Mark>();
  for (const mark of from.marks) {
    fromById.set(mark.id, mark);
  }

  // Interpolate marks that exist in target
  const interpolatedMarks = to.marks.map((toMark) => {
    const fromMark = fromById.get(toMark.id);
    if (fromMark) {
      return interpolateMark(fromMark, toMark, t);
    }
    // New mark: appear immediately
    return toMark;
  });

  return {
    ...to,
    height: lerp(from.height, to.height, t),
    marks: interpolatedMarks,
    // Interpolate viewport dimensions
    width: lerp(from.width, to.width, t),
  };
}
