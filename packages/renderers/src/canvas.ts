import type {
  ClipRectDef,
  Def,
  FilterDef,
  FilterPrimitive,
  LinearGradientDef,
  Mark,
  MaskDef,
  PatternDef,
  PatternMark,
  RenderModel,
} from "@microviz/core";

export type Canvas2DContext =
  | CanvasRenderingContext2D
  | OffscreenCanvasRenderingContext2D;

export type RenderCanvasOptions = {
  strokeStyle?: string;
  strokeWidth?: number;
  fillStyle?: string;
};

/**
 * Returns filter primitive types that are currently ignored by `renderCanvas`.
 */
export function getCanvasUnsupportedFilterPrimitiveTypes(
  model: RenderModel,
): Array<FilterPrimitive["type"]> {
  const supported = new Set<FilterPrimitive["type"]>([
    "dropShadow",
    "gaussianBlur",
  ]);

  const unsupported = new Set<FilterPrimitive["type"]>();
  for (const def of model.defs ?? []) {
    if (def.type !== "filter") continue;
    for (const primitive of def.primitives)
      if (!supported.has(primitive.type)) unsupported.add(primitive.type);
  }

  return [...unsupported].sort();
}

type Matrix2D = {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
};

function identityMatrix(): Matrix2D {
  return { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
}

function multiplyMatrix(m1: Matrix2D, m2: Matrix2D): Matrix2D {
  return {
    a: m1.a * m2.a + m1.c * m2.b,
    b: m1.b * m2.a + m1.d * m2.b,
    c: m1.a * m2.c + m1.c * m2.d,
    d: m1.b * m2.c + m1.d * m2.d,
    e: m1.a * m2.e + m1.c * m2.f + m1.e,
    f: m1.b * m2.e + m1.d * m2.f + m1.f,
  };
}

function translateMatrix(tx: number, ty: number): Matrix2D {
  return { a: 1, b: 0, c: 0, d: 1, e: tx, f: ty };
}

function scaleMatrix(sx: number, sy: number): Matrix2D {
  return { a: sx, b: 0, c: 0, d: sy, e: 0, f: 0 };
}

function rotateMatrix(deg: number): Matrix2D {
  const rad = (deg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return { a: cos, b: sin, c: -sin, d: cos, e: 0, f: 0 };
}

function parseSvgTransform(transform: string | undefined): Matrix2D | null {
  if (!transform) return null;

  const trimmed = transform.trim();
  if (!trimmed) return null;

  const re = /([a-zA-Z]+)\(([^)]*)\)/g;
  let matrix = identityMatrix();
  let hasAny = false;

  for (;;) {
    const match = re.exec(trimmed);
    if (!match) break;
    const name = match[1]?.toLowerCase();
    const args = (match[2] ?? "")
      .split(/[\s,]+/)
      .map((v) => v.trim())
      .filter(Boolean)
      .map(Number)
      .filter(Number.isFinite);

    let next: Matrix2D | null = null;

    switch (name) {
      case "matrix": {
        if (args.length >= 6) {
          next = {
            a: args[0] ?? 1,
            b: args[1] ?? 0,
            c: args[2] ?? 0,
            d: args[3] ?? 1,
            e: args[4] ?? 0,
            f: args[5] ?? 0,
          };
        }
        break;
      }
      case "translate": {
        if (args.length >= 1) {
          const tx = args[0] ?? 0;
          const ty = args[1] ?? 0;
          next = translateMatrix(tx, ty);
        }
        break;
      }
      case "scale": {
        if (args.length >= 1) {
          const sx = args[0] ?? 1;
          const sy = args[1] ?? sx;
          next = scaleMatrix(sx, sy);
        }
        break;
      }
      case "rotate": {
        if (args.length >= 1) next = rotateMatrix(args[0] ?? 0);
        break;
      }
    }

    if (!next) continue;
    matrix = multiplyMatrix(next, matrix);
    hasAny = true;
  }

  return hasAny ? matrix : null;
}

function roundedRectPath(
  ctx: Canvas2DContext,
  x: number,
  y: number,
  w: number,
  h: number,
  rx: number,
  ry: number,
): void {
  const rX = Math.max(0, Math.min(rx, w / 2));
  const rY = Math.max(0, Math.min(ry, h / 2));

  ctx.beginPath();
  ctx.moveTo(x + rX, y);
  ctx.lineTo(x + w - rX, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rY);
  ctx.lineTo(x + w, y + h - rY);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rX, y + h);
  ctx.lineTo(x + rX, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rY);
  ctx.lineTo(x, y + rY);
  ctx.quadraticCurveTo(x, y, x + rX, y);
  ctx.closePath();
}

export function renderCanvas(
  ctx: Canvas2DContext,
  model: RenderModel,
  options?: RenderCanvasOptions,
): void {
  ctx.clearRect(0, 0, model.width, model.height);

  const defsById = new Map<string, Def>();
  for (const def of model.defs ?? []) defsById.set(def.id, def);

  const patternCache = new Map<string, CanvasPattern | null>();

  for (const mark of model.marks) {
    if (!mark) continue;
    renderMark(ctx, mark, defsById, patternCache, options);
  }
}

function withAlpha(
  ctx: Canvas2DContext,
  alpha: number,
  draw: () => void,
): void {
  const prev = ctx.globalAlpha;
  ctx.globalAlpha = prev * alpha;
  try {
    draw();
  } finally {
    ctx.globalAlpha = prev;
  }
}

type Bounds = { maxX: number; maxY: number; minX: number; minY: number };
type FillableMark = Exclude<Mark, { type: "line" }>;

function parseUrlRef(value: string): string | null {
  const match = value.match(/^url\(#([^)]+)\)$/);
  return match?.[1] ?? null;
}

function boundsForPathData(d: string): Bounds | null {
  const commands = d.match(/[a-zA-Z]/g) ?? [];
  for (const c of commands) {
    const upper = c.toUpperCase();
    if (upper !== "M" && upper !== "L" && upper !== "Z") return null;
  }

  const nums = d.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi);
  if (!nums || nums.length < 2) return null;

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (let i = 0; i + 1 < nums.length; i += 2) {
    const x = Number(nums[i]);
    const y = Number(nums[i + 1]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  if (!Number.isFinite(minX) || !Number.isFinite(minY)) return null;
  if (!Number.isFinite(maxX) || !Number.isFinite(maxY)) return null;
  return { maxX, maxY, minX, minY };
}

function boundsForMark(mark: Mark): Bounds | null {
  switch (mark.type) {
    case "rect":
      return {
        maxX: mark.x + mark.w,
        maxY: mark.y + mark.h,
        minX: mark.x,
        minY: mark.y,
      };
    case "circle":
      return {
        maxX: mark.cx + mark.r,
        maxY: mark.cy + mark.r,
        minX: mark.cx - mark.r,
        minY: mark.cy - mark.r,
      };
    case "path":
      return boundsForPathData(mark.d);
    default:
      return null;
  }
}

function resolveStopColor(
  color: string,
  opacity: number | undefined,
  options?: Pick<RenderCanvasOptions, "fillStyle">,
): string {
  const base =
    color === "currentColor" || color.startsWith("var(")
      ? (options?.fillStyle ?? "black")
      : color;
  if (opacity === undefined || opacity >= 1) return base;
  if (opacity <= 0) return "transparent";
  const pct = Math.round(opacity * 10000) / 100;
  return `color-mix(in oklch, ${base} ${pct}%, transparent)`;
}

function buildLinearGradient(
  ctx: Canvas2DContext,
  def: LinearGradientDef,
  bounds: Bounds,
  options?: Pick<RenderCanvasOptions, "fillStyle">,
): CanvasGradient {
  const w = bounds.maxX - bounds.minX || 1;
  const h = bounds.maxY - bounds.minY || 1;

  const x1 = bounds.minX + (def.x1 ?? 0) * w;
  const y1 = bounds.minY + (def.y1 ?? 0) * h;
  const x2 = bounds.minX + (def.x2 ?? 1) * w;
  const y2 = bounds.minY + (def.y2 ?? 0) * h;

  const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
  for (const stop of def.stops) {
    const offset = Math.min(1, Math.max(0, stop.offset));
    gradient.addColorStop(
      offset,
      resolveStopColor(stop.color, stop.opacity, options),
    );
  }
  return gradient;
}

function patternMarkToMark(mark: PatternMark, id: string): Mark {
  return { ...(mark as unknown as Omit<Mark, "id">), id } as Mark;
}

function buildPattern(
  ctx: Canvas2DContext,
  def: PatternDef,
  defsById: ReadonlyMap<string, Def>,
  patternCache: Map<string, CanvasPattern | null>,
  options?: RenderCanvasOptions,
): CanvasPattern | null {
  const units = def.patternUnits ?? "objectBoundingBox";
  if (units !== "userSpaceOnUse") return null;

  const width = def.width;
  const height = def.height;
  if (!Number.isFinite(width) || !Number.isFinite(height)) return null;
  if (!(width > 0 && height > 0)) return null;

  const pxW = Math.max(1, Math.ceil(width));
  const pxH = Math.max(1, Math.ceil(height));

  const OffscreenCanvasCtor = (
    globalThis as unknown as {
      OffscreenCanvas?: new (w: number, h: number) => OffscreenCanvas;
    }
  ).OffscreenCanvas;

  if (!OffscreenCanvasCtor) return null;

  const tileCanvas = new OffscreenCanvasCtor(pxW, pxH);
  const tileCtx = tileCanvas.getContext("2d");
  if (!tileCtx) return null;

  tileCtx.clearRect(0, 0, pxW, pxH);

  if (typeof tileCtx.setTransform === "function")
    tileCtx.setTransform(1, 0, 0, 1, 0, 0);

  const drawScaleX = pxW / width;
  const drawScaleY = pxH / height;
  if (Number.isFinite(drawScaleX) && Number.isFinite(drawScaleY)) {
    tileCtx.transform(drawScaleX, 0, 0, drawScaleY, 0, 0);
  }

  for (let i = 0; i < def.marks.length; i++) {
    const mark = def.marks[i];
    renderMark(
      tileCtx,
      patternMarkToMark(mark, `${def.id}-pattern-${i}`),
      defsById,
      patternCache,
      options,
    );
  }

  const pattern = ctx.createPattern(tileCanvas, "repeat");
  if (!pattern) return null;

  const patternScaleX = width / pxW;
  const patternScaleY = height / pxH;

  const x = def.x ?? 0;
  const y = def.y ?? 0;

  const extra = parseSvgTransform(def.patternTransform);

  const needsTransform =
    Math.abs(patternScaleX - 1) > 1e-6 ||
    Math.abs(patternScaleY - 1) > 1e-6 ||
    Math.abs(x) > 1e-6 ||
    Math.abs(y) > 1e-6 ||
    extra !== null;

  if (
    "setTransform" in pattern &&
    typeof pattern.setTransform === "function" &&
    needsTransform
  ) {
    let matrix = identityMatrix();
    matrix = multiplyMatrix(scaleMatrix(patternScaleX, patternScaleY), matrix);
    if (extra) matrix = multiplyMatrix(extra, matrix);
    matrix = multiplyMatrix(translateMatrix(x, y), matrix);

    pattern.setTransform(matrix);
  }

  return pattern;
}

function setFillStyle(
  ctx: Canvas2DContext,
  mark: FillableMark,
  defsById: ReadonlyMap<string, Def>,
  patternCache: Map<string, CanvasPattern | null>,
  options?: Pick<RenderCanvasOptions, "fillStyle">,
): boolean {
  const fill = mark.fill;
  if (fill === "none") return false;

  if (fill === undefined) {
    if (options?.fillStyle === undefined) return false;
    ctx.fillStyle = options.fillStyle;
    return true;
  }

  const urlId = parseUrlRef(fill);
  if (urlId) {
    const def = defsById.get(urlId);
    const bounds = boundsForMark(mark);
    if (def?.type === "linearGradient" && bounds) {
      ctx.fillStyle = buildLinearGradient(ctx, def, bounds, options);
      return true;
    }
    if (def?.type === "pattern") {
      if (def.patternUnits === "userSpaceOnUse") {
        if (patternCache.has(def.id)) {
          const cached = patternCache.get(def.id);
          if (cached) {
            ctx.fillStyle = cached;
            return true;
          }
        } else {
          patternCache.set(def.id, null);
          const pattern = buildPattern(
            ctx,
            def,
            defsById,
            patternCache,
            options,
          );
          patternCache.set(def.id, pattern);
          if (pattern) {
            ctx.fillStyle = pattern;
            return true;
          }
        }
      } else {
        const pattern = buildPattern(ctx, def, defsById, patternCache, options);
        if (pattern) {
          ctx.fillStyle = pattern;
          return true;
        }
      }
    }
    if (options?.fillStyle !== undefined) {
      ctx.fillStyle = options.fillStyle;
      return true;
    }
    return false;
  }

  if (fill === "currentColor" || fill.startsWith("var(")) {
    if (options?.fillStyle === undefined) return false;
    ctx.fillStyle = options.fillStyle;
    return true;
  }

  ctx.fillStyle = fill;
  return true;
}

function setStrokeStyle(
  ctx: Canvas2DContext,
  stroke: string | undefined,
  options?: Pick<RenderCanvasOptions, "strokeStyle">,
): boolean {
  const style = stroke ?? options?.strokeStyle;
  if (!style || style === "none") return false;
  ctx.strokeStyle = style;
  return true;
}

function applyClipPath(
  ctx: Canvas2DContext,
  clipPathId: string | undefined,
  defsById: ReadonlyMap<string, Def>,
  didSave: boolean,
): boolean {
  if (!clipPathId) return didSave;
  const def = defsById.get(clipPathId);
  if (!def || def.type !== "clipRect") return didSave;
  const clip = def as ClipRectDef;
  if (!didSave) ctx.save();
  roundedRectPath(
    ctx,
    clip.x,
    clip.y,
    clip.w,
    clip.h,
    clip.rx ?? 0,
    clip.ry ?? 0,
  );
  ctx.clip();
  return true;
}

function applyMask(
  ctx: Canvas2DContext,
  maskId: string | undefined,
  mark: Mark,
  defsById: ReadonlyMap<string, Def>,
  didSave: boolean,
): boolean {
  if (!maskId) return didSave;
  const def = defsById.get(maskId);
  if (!def || def.type !== "mask") return didSave;

  const bounds = boundsForMark(mark);
  if (!bounds) return didSave;

  if (typeof Path2D === "undefined") return didSave;

  const mask = def as MaskDef;
  const maskPath = new Path2D();

  const addPath =
    "addPath" in maskPath && typeof maskPath.addPath === "function"
      ? maskPath.addPath.bind(maskPath)
      : null;

  let hasAny = false;
  for (const maskMark of mask.marks) {
    if (maskMark.type === "rect") {
      const alpha = (maskMark.opacity ?? 1) * (maskMark.fillOpacity ?? 1);
      if (alpha <= 0) continue;
      if (maskMark.fill === "none") continue;

      const p = new Path2D();
      p.rect(maskMark.x, maskMark.y, maskMark.w, maskMark.h);
      if (addPath) addPath(p);
      hasAny = true;
      continue;
    }

    if (maskMark.type === "circle") {
      const alpha = (maskMark.opacity ?? 1) * (maskMark.fillOpacity ?? 1);
      if (alpha <= 0) continue;
      if (maskMark.fill === "none") continue;

      const p = new Path2D();
      p.arc(maskMark.cx, maskMark.cy, maskMark.r, 0, Math.PI * 2);
      if (addPath) addPath(p);
      hasAny = true;
      continue;
    }

    if (maskMark.type === "path") {
      const alpha = (maskMark.opacity ?? 1) * (maskMark.fillOpacity ?? 1);
      if (alpha <= 0) continue;
      if (maskMark.fill === "none") continue;

      const p = new Path2D(maskMark.d);
      if (addPath) addPath(p);
      hasAny = true;
    }
  }

  if (!hasAny || !addPath) return didSave;

  const contentUnits = mask.maskContentUnits ?? "objectBoundingBox";
  if (contentUnits !== "objectBoundingBox") {
    if (!didSave) ctx.save();
    ctx.clip(maskPath);
    return true;
  }

  const w = bounds.maxX - bounds.minX;
  const h = bounds.maxY - bounds.minY;
  if (!(w > 0 && h > 0)) return didSave;
  if (typeof ctx.setTransform !== "function") return didSave;

  if (!didSave) ctx.save();
  ctx.transform(w, 0, 0, h, bounds.minX, bounds.minY);
  ctx.clip(maskPath);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  return true;
}

function applyFilter(
  ctx: Canvas2DContext,
  filterId: string | undefined,
  defsById: ReadonlyMap<string, Def>,
  didSave: boolean,
  options?: Pick<RenderCanvasOptions, "fillStyle">,
): boolean {
  if (!filterId) return didSave;
  const def = defsById.get(filterId);
  if (!def || def.type !== "filter") return didSave;
  const filter = def as FilterDef;
  const gaussianBlur = filter.primitives.find((p) => p.type === "gaussianBlur");
  const dropShadow = filter.primitives.find((p) => p.type === "dropShadow");
  if (!gaussianBlur && !dropShadow) return didSave;

  if (!didSave) ctx.save();

  if (gaussianBlur) {
    const blur = Math.max(0, gaussianBlur.stdDeviation ?? 0);
    ctx.filter = blur > 0 ? `blur(${blur}px)` : "none";
  }

  if (dropShadow) {
    ctx.shadowOffsetX = dropShadow.dx ?? 0;
    ctx.shadowOffsetY = dropShadow.dy ?? 0;
    ctx.shadowBlur = Math.max(0, (dropShadow.stdDeviation ?? 0) * 2);
    ctx.shadowColor = resolveStopColor(
      dropShadow.floodColor ?? "black",
      dropShadow.floodOpacity,
      options,
    );
  }

  return true;
}

function renderMark(
  ctx: Canvas2DContext,
  mark: Mark,
  defsById: ReadonlyMap<string, Def>,
  patternCache: Map<string, CanvasPattern | null>,
  options?: RenderCanvasOptions,
): void {
  const baseOpacity = mark.opacity ?? 1;

  let didSave = false;

  // Apply clipping if mark has clipPath (only RectMark and PathMark support it)
  const clipPathId =
    "clipPath" in mark ? (mark.clipPath as string | undefined) : undefined;
  didSave = applyClipPath(ctx, clipPathId, defsById, didSave);

  // Apply mask via canvas clipping (subset of SVG mask semantics)
  didSave = applyMask(ctx, mark.mask, mark, defsById, didSave);

  // Apply drop-shadow filters using canvas shadow settings
  didSave = applyFilter(ctx, mark.filter, defsById, didSave, options);

  switch (mark.type) {
    case "rect": {
      const hasFill = setFillStyle(ctx, mark, defsById, patternCache, options);
      if (!hasFill) {
        if (didSave) ctx.restore();
        return;
      }
      const rX = mark.rx ?? 0;
      const rY = mark.ry ?? rX;
      const hasRadius = rX > 0 || rY > 0;

      withAlpha(ctx, baseOpacity * (mark.fillOpacity ?? 1), () => {
        if (!hasRadius) {
          ctx.fillRect(mark.x, mark.y, mark.w, mark.h);
          return;
        }

        roundedRectPath(ctx, mark.x, mark.y, mark.w, mark.h, rX, rY);
        ctx.fill();
      });

      const shouldStroke =
        (mark.stroke !== undefined && mark.stroke !== "none") ||
        (mark.stroke === undefined &&
          options?.strokeStyle !== undefined &&
          (mark.strokeOpacity !== undefined || mark.strokeWidth !== undefined));

      if (shouldStroke) {
        const hasStroke = setStrokeStyle(ctx, mark.stroke, options);
        if (!hasStroke) {
          if (didSave) ctx.restore();
          return;
        }
        const prevLineWidth = ctx.lineWidth;
        if (mark.strokeWidth !== undefined) ctx.lineWidth = mark.strokeWidth;
        withAlpha(ctx, baseOpacity * (mark.strokeOpacity ?? 1), () => {
          if (!hasRadius) {
            ctx.strokeRect(mark.x, mark.y, mark.w, mark.h);
            return;
          }

          roundedRectPath(ctx, mark.x, mark.y, mark.w, mark.h, rX, rY);
          ctx.stroke();
        });
        ctx.lineWidth = prevLineWidth;
      }
      if (didSave) ctx.restore();
      return;
    }

    case "circle": {
      const hasFill = setFillStyle(ctx, mark, defsById, patternCache, options);
      const wantsFill = mark.fill !== "none";

      ctx.beginPath();
      ctx.arc(mark.cx, mark.cy, mark.r, 0, Math.PI * 2);

      if (wantsFill && hasFill) {
        withAlpha(ctx, baseOpacity * (mark.fillOpacity ?? 1), () => {
          ctx.fill();
        });
      }

      const shouldStroke =
        (mark.stroke !== undefined && mark.stroke !== "none") ||
        (mark.stroke === undefined &&
          options?.strokeStyle !== undefined &&
          (mark.strokeOpacity !== undefined || mark.strokeWidth !== undefined));

      if (shouldStroke) {
        const hasStroke = setStrokeStyle(ctx, mark.stroke, options);
        if (!hasStroke) {
          if (didSave) ctx.restore();
          return;
        }
        const prevLineWidth = ctx.lineWidth;
        const prevLineCap = ctx.lineCap;
        const prevLineDash = ctx.getLineDash();
        const prevLineDashOffset = ctx.lineDashOffset;

        if (mark.strokeWidth !== undefined) ctx.lineWidth = mark.strokeWidth;
        if (mark.strokeLinecap !== undefined) ctx.lineCap = mark.strokeLinecap;
        if (mark.strokeDasharray !== undefined) {
          const dashes = mark.strokeDasharray
            .split(/[\s,]+/)
            .map(Number)
            .filter(Number.isFinite);
          ctx.setLineDash(dashes);
        }
        if (mark.strokeDashoffset !== undefined) {
          ctx.lineDashOffset = Number(mark.strokeDashoffset) || 0;
        }

        withAlpha(ctx, baseOpacity * (mark.strokeOpacity ?? 1), () => {
          ctx.stroke();
        });

        ctx.lineWidth = prevLineWidth;
        ctx.lineCap = prevLineCap;
        ctx.setLineDash(prevLineDash);
        ctx.lineDashOffset = prevLineDashOffset;
      }
      if (didSave) ctx.restore();
      return;
    }

    case "line": {
      const hasStroke = setStrokeStyle(ctx, mark.stroke, options);
      if (!hasStroke) {
        if (didSave) ctx.restore();
        return;
      }

      const prevLineWidth = ctx.lineWidth;
      const prevLineCap = ctx.lineCap;
      const prevLineJoin = ctx.lineJoin;

      const lineWidth = mark.strokeWidth ?? options?.strokeWidth;
      if (lineWidth !== undefined) ctx.lineWidth = lineWidth;
      if (mark.strokeLinecap !== undefined) ctx.lineCap = mark.strokeLinecap;
      if (mark.strokeLinejoin !== undefined) ctx.lineJoin = mark.strokeLinejoin;

      withAlpha(ctx, baseOpacity * (mark.strokeOpacity ?? 1), () => {
        ctx.beginPath();
        ctx.moveTo(mark.x1, mark.y1);
        ctx.lineTo(mark.x2, mark.y2);
        ctx.stroke();
      });

      ctx.lineWidth = prevLineWidth;
      ctx.lineCap = prevLineCap;
      ctx.lineJoin = prevLineJoin;
      if (didSave) ctx.restore();
      return;
    }

    case "path": {
      if (typeof Path2D === "undefined") {
        if (didSave) ctx.restore();
        return;
      }
      const path = new Path2D(mark.d);

      const wantsFill =
        mark.fill !== "none" &&
        (mark.fill !== undefined || mark.fillOpacity !== undefined);
      if (wantsFill) {
        const hasFill = setFillStyle(
          ctx,
          mark,
          defsById,
          patternCache,
          options,
        );
        if (hasFill) {
          withAlpha(ctx, baseOpacity * (mark.fillOpacity ?? 1), () => {
            ctx.fill(path);
          });
        }
      }

      if (mark.stroke !== undefined && mark.stroke !== "none") {
        const hasStroke = setStrokeStyle(ctx, mark.stroke, options);
        if (!hasStroke) {
          if (didSave) ctx.restore();
          return;
        }

        const prevLineWidth = ctx.lineWidth;
        const prevLineCap = ctx.lineCap;
        const prevLineJoin = ctx.lineJoin;

        const lineWidth = mark.strokeWidth ?? options?.strokeWidth;
        if (lineWidth !== undefined) ctx.lineWidth = lineWidth;
        if (mark.strokeLinecap !== undefined) ctx.lineCap = mark.strokeLinecap;
        if (mark.strokeLinejoin !== undefined)
          ctx.lineJoin = mark.strokeLinejoin;

        withAlpha(ctx, baseOpacity * (mark.strokeOpacity ?? 1), () => {
          ctx.stroke(path);
        });

        ctx.lineWidth = prevLineWidth;
        ctx.lineCap = prevLineCap;
        ctx.lineJoin = prevLineJoin;
      }
      if (didSave) ctx.restore();
      return;
    }

    case "text": {
      const hasFill = setFillStyle(ctx, mark, defsById, patternCache, options);
      if (!hasFill) {
        if (didSave) ctx.restore();
        return;
      }

      const prevAlign = ctx.textAlign;
      const prevBaseline = ctx.textBaseline;
      if (mark.anchor === "start") ctx.textAlign = "left";
      if (mark.anchor === "middle") ctx.textAlign = "center";
      if (mark.anchor === "end") ctx.textAlign = "right";

      if (mark.baseline === "alphabetic") ctx.textBaseline = "alphabetic";
      if (mark.baseline === "central") ctx.textBaseline = "middle";
      if (mark.baseline === "hanging") ctx.textBaseline = "hanging";
      if (mark.baseline === "middle") ctx.textBaseline = "middle";

      withAlpha(ctx, baseOpacity * (mark.fillOpacity ?? 1), () => {
        ctx.fillText(mark.text, mark.x, mark.y);
      });

      ctx.textAlign = prevAlign;
      ctx.textBaseline = prevBaseline;
      if (didSave) ctx.restore();
      return;
    }
  }
}
