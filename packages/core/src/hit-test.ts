import type { Mark, RenderModel } from "./model";

export type Point = { x: number; y: number };

export type HitResult = {
  markId: string;
  markType: Mark["type"];
};

export type HitTestOptions = {
  /**
   * Additional hit slop for strokes (in CSS px). This is added on top of the
   * mark's `strokeWidth` to keep hit targets usable at micro-chart sizes.
   */
  strokeSlopPx?: number;
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

function distSqToSegment(p: Point, a: Point, b: Point, lenSq: number): number {
  if (lenSq <= 0) {
    const dx = p.x - a.x;
    const dy = p.y - a.y;
    return dx * dx + dy * dy;
  }

  const t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / lenSq;
  const clamped = Math.min(1, Math.max(0, t));
  const cx = a.x + (b.x - a.x) * clamped;
  const cy = a.y + (b.y - a.y) * clamped;
  const dx = p.x - cx;
  const dy = p.y - cy;
  return dx * dx + dy * dy;
}

function pointNearLineSegment(
  p: Point,
  line: { x1: number; y1: number; x2: number; y2: number },
  tolerancePx: number,
): boolean {
  const tol = Math.max(0, tolerancePx);
  const tolSq = tol * tol;
  const a = { x: line.x1, y: line.y1 };
  const b = { x: line.x2, y: line.y2 };
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  return distSqToSegment(p, a, b, lenSq) <= tolSq;
}

function pointInPolygon(p: Point, polygon: ReadonlyArray<Point>): boolean {
  if (polygon.length < 3) return false;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const pi = polygon[i];
    const pj = polygon[j];
    if (!pi || !pj) continue;

    const xi = pi.x;
    const yi = pi.y;
    const xj = pj.x;
    const yj = pj.y;

    const intersects =
      yi > p.y !== yj > p.y && p.x < ((xj - xi) * (p.y - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }

  return inside;
}

function pointNearPolyline(
  p: Point,
  polyline: ReadonlyArray<Point>,
  closed: boolean,
  tolerancePx: number,
): boolean {
  if (polyline.length < 2) return false;
  const tol = Math.max(0, tolerancePx);
  const tolSq = tol * tol;

  for (let i = 0; i + 1 < polyline.length; i++) {
    const a = polyline[i];
    const b = polyline[i + 1];
    if (!a || !b) continue;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy;
    if (distSqToSegment(p, a, b, lenSq) <= tolSq) return true;
  }

  if (closed) {
    const a = polyline[polyline.length - 1];
    const b = polyline[0];
    if (a && b) {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const lenSq = dx * dx + dy * dy;
      if (distSqToSegment(p, a, b, lenSq) <= tolSq) return true;
    }
  }

  return false;
}

type ParsedPath = {
  subpaths: ReadonlyArray<ReadonlyArray<Point>>;
  closed: ReadonlyArray<boolean>;
};

function parseSimplePath(d: string): ParsedPath | null {
  const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi);
  if (!tokens || tokens.length === 0) return null;

  const subpaths: Point[][] = [];
  const closed: boolean[] = [];
  let current: Point[] | null = null;
  let currentClosed = false;

  const readNumber = (i: number): number | null => {
    const n = Number(tokens[i]);
    return Number.isFinite(n) ? n : null;
  };

  const readPair = (i: number): { point: Point; nextIndex: number } | null => {
    const x = readNumber(i);
    const y = readNumber(i + 1);
    if (x === null || y === null) return null;
    return { nextIndex: i + 2, point: { x, y } };
  };

  for (let i = 0; i < tokens.length; ) {
    const token = tokens[i];
    if (!token) return null;

    if (!/^[a-zA-Z]$/.test(token)) return null;

    const cmd = token;
    const upper = cmd.toUpperCase();
    if (cmd !== upper) return null;
    i++;

    if (upper === "M") {
      const first = readPair(i);
      if (!first) return null;

      if (current) {
        subpaths.push(current);
        closed.push(currentClosed);
      }

      current = [first.point];
      currentClosed = false;
      i = first.nextIndex;

      // Additional coordinate pairs after M are implicit L commands.
      for (;;) {
        const maybe = readPair(i);
        if (!maybe) break;
        current.push(maybe.point);
        i = maybe.nextIndex;
      }
      continue;
    }

    if (upper === "L") {
      if (!current) return null;
      let any = false;
      for (;;) {
        const maybe = readPair(i);
        if (!maybe) break;
        current.push(maybe.point);
        i = maybe.nextIndex;
        any = true;
      }
      if (!any) return null;
      continue;
    }

    if (upper === "Z") {
      if (!current) return null;
      currentClosed = true;
      continue;
    }

    return null;
  }

  if (current) {
    subpaths.push(current);
    closed.push(currentClosed);
  }

  if (subpaths.length === 0) return null;
  return { closed, subpaths };
}

function getStrokeTolerancePx(mark: { strokeWidth?: number }, slop: number) {
  const halfStroke = Math.max(0, (mark.strokeWidth ?? 1) / 2);
  return halfStroke + Math.max(0, slop);
}

export function hitTest(
  model: RenderModel,
  point: Point,
  options?: HitTestOptions,
): HitResult | null {
  if (!isFiniteNumber(point.x) || !isFiniteNumber(point.y)) return null;

  const strokeSlopPx = options?.strokeSlopPx ?? 2;

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

    if (mark.type === "line") {
      const tol = getStrokeTolerancePx(mark, strokeSlopPx);
      if (pointNearLineSegment(point, mark, tol))
        return { markId: mark.id, markType: mark.type };
    }

    if (mark.type === "path") {
      const parsed = parseSimplePath(mark.d);
      if (!parsed) continue;

      const wantsFill = mark.fill !== "none";
      if (wantsFill) {
        for (const poly of parsed.subpaths) {
          if (pointInPolygon(point, poly))
            return { markId: mark.id, markType: mark.type };
        }
      }

      const wantsStroke = mark.stroke !== undefined && mark.stroke !== "none";
      if (wantsStroke) {
        const tol = getStrokeTolerancePx(mark, strokeSlopPx);
        for (let sp = 0; sp < parsed.subpaths.length; sp++) {
          const poly = parsed.subpaths[sp];
          const isClosed = parsed.closed[sp] ?? false;
          if (pointNearPolyline(point, poly, isClosed, tol))
            return { markId: mark.id, markType: mark.type };
        }
      }
    }
  }

  return null;
}
