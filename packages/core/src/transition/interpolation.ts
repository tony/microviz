import type {
  CircleMark,
  LineMark,
  Mark,
  PathMark,
  RectMark,
  RenderModel,
  TextMark,
} from "../model";
import { interpolatePathMark, parsePath } from "./pathMorph";

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

const TAU = Math.PI * 2;
const DONUT_SEGMENT_CLASS = "mv-donut-segment";

function isDonutSegmentMark(mark: PathMark): boolean {
  if (mark.id.startsWith("donut-segment-")) return true;
  if (!mark.className) return false;
  return mark.className.split(/\s+/).includes(DONUT_SEGMENT_CLASS);
}

type DonutArcGeometry = {
  cx: number;
  cy: number;
  outerR: number;
  innerR: number;
  startAngle: number;
  endAngle: number;
};

type Point = { x: number; y: number };

function normalizeSweep(sweep: number): number {
  if (!Number.isFinite(sweep)) return 0;
  let value = sweep;
  while (value < 0) value += TAU;
  while (value > TAU) value -= TAU;
  return value;
}

function wrapAngle(angle: number): number {
  let value = (angle + Math.PI) % TAU;
  if (value < 0) value += TAU;
  return value - Math.PI;
}

function lerpAngle(from: number, to: number, t: number): number {
  const delta = wrapAngle(to - from);
  return from + delta * t;
}

function arcToCenter(
  start: Point,
  end: Point,
  radius: number,
  largeArcFlag: boolean,
  sweepFlag: boolean,
): { cx: number; cy: number; startAngle: number; endAngle: number } | null {
  if (!Number.isFinite(radius) || radius <= 0) return null;

  const dx2 = (start.x - end.x) / 2;
  const dy2 = (start.y - end.y) / 2;
  const x1p = dx2;
  const y1p = dy2;

  const rSq = radius * radius;
  const x1pSq = x1p * x1p;
  const y1pSq = y1p * y1p;
  const denom = x1pSq + y1pSq;
  if (denom === 0) return null;

  let radicant = (rSq - x1pSq - y1pSq) / denom;
  radicant = Math.max(0, radicant);

  const coef = (largeArcFlag === sweepFlag ? -1 : 1) * Math.sqrt(radicant);
  const cxp = coef * y1p;
  const cyp = coef * -x1p;

  const cx = cxp + (start.x + end.x) / 2;
  const cy = cyp + (start.y + end.y) / 2;

  const startAngle = Math.atan2((y1p - cyp) / radius, (x1p - cxp) / radius);
  const endAngleBase = Math.atan2((-y1p - cyp) / radius, (-x1p - cxp) / radius);
  let delta = endAngleBase - startAngle;
  if (!sweepFlag && delta > 0) delta -= TAU;
  if (sweepFlag && delta < 0) delta += TAU;
  const endAngle = startAngle + delta;

  return { cx, cy, endAngle, startAngle };
}

function extractDonutGeometry(mark: PathMark): DonutArcGeometry | null {
  const commands = parsePath(mark.d);
  let outerStart: Point | null = null;
  let outerArc: { args: number[] } | null = null;
  let innerArc: { args: number[] } | null = null;

  for (const cmd of commands) {
    if (!outerStart && cmd.type === "M" && cmd.args.length >= 2) {
      outerStart = { x: cmd.args[0] ?? 0, y: cmd.args[1] ?? 0 };
      continue;
    }
    if (cmd.type === "A" && cmd.args.length >= 7) {
      const sweepFlag = Number(cmd.args[4]) === 1;
      if (sweepFlag && !outerArc) {
        outerArc = cmd;
      } else if (!sweepFlag && !innerArc) {
        innerArc = cmd;
      }
    }
  }

  if (!outerStart || !outerArc || !innerArc) return null;

  const outerR = Number(outerArc.args[0]);
  const innerR = Number(innerArc.args[0]);
  const outerEnd: Point = {
    x: Number(outerArc.args[5]),
    y: Number(outerArc.args[6]),
  };
  const largeArcFlag = Number(outerArc.args[3]) === 1;
  const sweepFlag = Number(outerArc.args[4]) === 1;

  const center = arcToCenter(
    outerStart,
    outerEnd,
    outerR,
    largeArcFlag,
    sweepFlag,
  );
  if (!center) return null;

  return {
    cx: center.cx,
    cy: center.cy,
    endAngle: center.endAngle,
    innerR,
    outerR,
    startAngle: center.startAngle,
  };
}

function createArcPath(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number,
): string {
  const isFullCircle = Math.abs(endAngle - startAngle) >= TAU - 0.001;

  if (isFullCircle) {
    const midAngle = startAngle + Math.PI;
    return (
      createHalfArcPath(cx, cy, outerR, innerR, startAngle, midAngle) +
      " " +
      createHalfArcPath(cx, cy, outerR, innerR, midAngle, endAngle)
    );
  }

  const outerStart = polarToCartesian(cx, cy, outerR, startAngle);
  const outerEnd = polarToCartesian(cx, cy, outerR, endAngle);
  const innerStart = polarToCartesian(cx, cy, innerR, startAngle);
  const innerEnd = polarToCartesian(cx, cy, innerR, endAngle);

  const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;

  return [
    `M ${outerStart.x.toFixed(2)} ${outerStart.y.toFixed(2)}`,
    `A ${outerR.toFixed(2)} ${outerR.toFixed(2)} 0 ${largeArcFlag} 1 ${outerEnd.x.toFixed(2)} ${outerEnd.y.toFixed(2)}`,
    `L ${innerEnd.x.toFixed(2)} ${innerEnd.y.toFixed(2)}`,
    `A ${innerR.toFixed(2)} ${innerR.toFixed(2)} 0 ${largeArcFlag} 0 ${innerStart.x.toFixed(2)} ${innerStart.y.toFixed(2)}`,
    "Z",
  ].join(" ");
}

function createHalfArcPath(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number,
): string {
  const outerStart = polarToCartesian(cx, cy, outerR, startAngle);
  const outerEnd = polarToCartesian(cx, cy, outerR, endAngle);
  const innerStart = polarToCartesian(cx, cy, innerR, startAngle);
  const innerEnd = polarToCartesian(cx, cy, innerR, endAngle);

  return [
    `M ${outerStart.x.toFixed(2)} ${outerStart.y.toFixed(2)}`,
    `A ${outerR.toFixed(2)} ${outerR.toFixed(2)} 0 0 1 ${outerEnd.x.toFixed(2)} ${outerEnd.y.toFixed(2)}`,
    `L ${innerEnd.x.toFixed(2)} ${innerEnd.y.toFixed(2)}`,
    `A ${innerR.toFixed(2)} ${innerR.toFixed(2)} 0 0 0 ${innerStart.x.toFixed(2)} ${innerStart.y.toFixed(2)}`,
    "Z",
  ].join(" ");
}

function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angle: number,
): Point {
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  };
}

function interpolateDonutPathMark(
  from: PathMark,
  to: PathMark,
  t: number,
): PathMark {
  const fromGeom = extractDonutGeometry(from);
  const toGeom = extractDonutGeometry(to);
  if (!fromGeom || !toGeom) {
    return interpolatePathMark(from, to, t);
  }

  const startAngle = lerpAngle(fromGeom.startAngle, toGeom.startAngle, t);
  const sweepFrom = normalizeSweep(fromGeom.endAngle - fromGeom.startAngle);
  const sweepTo = normalizeSweep(toGeom.endAngle - toGeom.startAngle);
  const sweep = lerp(sweepFrom, sweepTo, t);
  const endAngle = startAngle + sweep;

  const cx = lerp(fromGeom.cx, toGeom.cx, t);
  const cy = lerp(fromGeom.cy, toGeom.cy, t);
  const outerR = lerp(fromGeom.outerR, toGeom.outerR, t);
  const innerR = lerp(fromGeom.innerR, toGeom.innerR, t);
  const d = createArcPath(cx, cy, outerR, innerR, startAngle, endAngle);

  return {
    ...to,
    d,
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
