import type { Mark, RenderModel } from "./model";

export type Point = { x: number; y: number };

export type HitResult = {
  markId: string;
  markType: Mark["type"];
};

function isFiniteNumber(x: number): boolean {
  return Number.isFinite(x);
}

function pointInRect(
  p: Point,
  rect: { x: number; y: number; w: number; h: number },
): boolean {
  return (
    p.x >= rect.x &&
    p.x <= rect.x + rect.w &&
    p.y >= rect.y &&
    p.y <= rect.y + rect.h
  );
}

function pointInCircle(
  p: Point,
  circle: { cx: number; cy: number; r: number },
): boolean {
  if (circle.r <= 0) return false;
  const dx = p.x - circle.cx;
  const dy = p.y - circle.cy;
  return dx * dx + dy * dy <= circle.r * circle.r;
}

export function hitTest(model: RenderModel, point: Point): HitResult | null {
  if (!isFiniteNumber(point.x) || !isFiniteNumber(point.y)) return null;

  for (let i = model.marks.length - 1; i >= 0; i--) {
    const mark = model.marks[i];
    if (!mark) continue;

    if (mark.type === "rect") {
      if (pointInRect(point, mark))
        return { markId: mark.id, markType: mark.type };
    }

    if (mark.type === "circle") {
      if (pointInCircle(point, mark))
        return { markId: mark.id, markType: mark.type };
    }
  }

  return null;
}
