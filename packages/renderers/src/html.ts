import type {
  Def,
  FilterDef,
  Mark,
  MaskDef,
  PatternDef,
  RenderModel,
} from "@microviz/core";
import { svgStringToDataUrl } from "./export";
import { renderSvgString } from "./svg";

export type HtmlUnsupportedMarkEffect =
  | "clipPath"
  | "mask"
  | "filter"
  | "strokeDash";

export const HTML_SUPPORTED_MARK_TYPES = [
  "rect",
  "circle",
  "line",
  "text",
] as const;

const HTML_SUPPORTED_DEF_TYPES = [
  "linearGradient",
  "clipRect",
  "pattern",
  "mask",
  "filter",
] as const;
const HTML_SUPPORTED_MARK_TYPE_SET = new Set<Mark["type"]>(
  HTML_SUPPORTED_MARK_TYPES,
);

/**
 * HTML renderer policy (experimental, parity-deferred):
 * - Supports only rect/circle/line/text marks.
 * - Ignores path marks entirely.
 * - Supports linearGradient defs for rect fills.
 * - Supports clipRect defs for rect clipPath.
 * - Supports pattern defs for fills and mask defs via CSS masks.
 * - Supports filter defs when composed only of dropShadow/gaussianBlur.
 * - Ignores mark effects: mask/filter/strokeDash when unsupported.
 * - Use SVG/Canvas for full-fidelity output.
 */
export const HTML_RENDERER_POLICY = {
  notes: ["Use SVG/Canvas for full-fidelity output."],
  status: "experimental",
  supportedDefs: HTML_SUPPORTED_DEF_TYPES,
  supportedMarkTypes: HTML_SUPPORTED_MARK_TYPES,
  unsupportedDefs: "most",
  unsupportedMarkEffects: ["strokeDash"],
  unsupportedMarkTypes: ["path"],
} as const;

function uniqueSorted<T extends string>(values: Iterable<T>): T[] {
  return [...new Set(values)].sort();
}

const SUPPORTED_FILTER_PRIMITIVES = new Set(["dropShadow", "gaussianBlur"]);

function isSupportedFilterDef(def: FilterDef): boolean {
  return def.primitives.every((primitive) =>
    SUPPORTED_FILTER_PRIMITIVES.has(primitive.type),
  );
}

function isSupportedDef(def: Def): boolean {
  switch (def.type) {
    case "linearGradient":
    case "clipRect":
    case "pattern":
    case "mask":
      return true;
    case "filter":
      return isSupportedFilterDef(def);
  }
}

export function getHtmlUnsupportedMarkTypes(
  model: RenderModel,
): Mark["type"][] {
  return uniqueSorted(
    model.marks
      .map((mark) => mark.type)
      .filter((type) => !HTML_SUPPORTED_MARK_TYPE_SET.has(type)),
  );
}

export function getHtmlUnsupportedDefTypes(model: RenderModel): Def["type"][] {
  if (!model.defs || model.defs.length === 0) return [];
  return uniqueSorted(
    model.defs.filter((def) => !isSupportedDef(def)).map((def) => def.type),
  );
}

export function getHtmlUnsupportedMarkEffects(
  model: RenderModel,
): HtmlUnsupportedMarkEffect[] {
  const defsById = new Map<string, Def>(
    model.defs?.map((def) => [def.id, def]) ?? [],
  );
  const effects = new Set<HtmlUnsupportedMarkEffect>();
  for (const mark of model.marks) {
    if ("clipPath" in mark && mark.clipPath) {
      const clipId = extractUrlRefId(mark.clipPath) ?? mark.clipPath;
      const clipDef = defsById.get(clipId);
      if (!clipDef || clipDef.type !== "clipRect") effects.add("clipPath");
    }
    if ("mask" in mark && mark.mask) {
      const maskId = extractUrlRefId(mark.mask) ?? mark.mask;
      const maskDef = defsById.get(maskId);
      if (!maskDef || maskDef.type !== "mask") effects.add("mask");
    }
    if ("filter" in mark && mark.filter) {
      const filterId = extractUrlRefId(mark.filter) ?? mark.filter;
      const filterDef = defsById.get(filterId);
      if (!filterDef || filterDef.type !== "filter") {
        effects.add("filter");
      } else if (!isSupportedFilterDef(filterDef)) {
        effects.add("filter");
      }
    }
    if (
      mark.type === "circle" &&
      (mark.strokeDasharray || mark.strokeDashoffset)
    )
      effects.add("strokeDash");
  }

  return uniqueSorted(effects);
}

function escapeHtmlText(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function attr(name: string, value: string | number | undefined): string {
  if (value === undefined) return "";
  return ` ${name}="${escapeHtmlText(String(value))}"`;
}

function extractUrlRefId(value: string | undefined): string | null {
  if (!value) return null;
  const match = /url\((['"]?)#?([^'")]+)\1\)/.exec(value);
  return match?.[2] ?? null;
}

function resolveDefId(value: string | undefined): string | null {
  if (!value) return null;
  return extractUrlRefId(value) ?? value;
}

function px(value: number | undefined): string | undefined {
  if (value === undefined) return undefined;
  const rounded = Math.round(value * 1000) / 1000;
  return `${rounded}px`;
}

function stylePair(name: string, value: string | undefined): string {
  if (!value) return "";
  return `${name}:${value};`;
}

function withOpacity(color: string, opacity: number | undefined): string {
  if (opacity === undefined) return color;
  if (!Number.isFinite(opacity)) return color;
  const clamped = Math.max(0, Math.min(1, opacity));
  if (clamped <= 0) return "transparent";
  if (clamped >= 1) return color;
  const pct = Math.round(clamped * 1000) / 10;
  return `color-mix(in srgb, ${color} ${pct}%, transparent)`;
}

const PATTERN_CACHE_LIMIT = 200;
const MASK_CACHE_LIMIT = 200;

const patternCache = new Map<string, string>();
const maskCache = new Map<string, string>();

function cacheGet(cache: Map<string, string>, key: string): string | undefined {
  const cached = cache.get(key);
  if (!cached) return undefined;
  cache.delete(key);
  cache.set(key, cached);
  return cached;
}

function cacheSet(
  cache: Map<string, string>,
  key: string,
  value: string,
  limit: number,
): void {
  cache.set(key, value);
  if (cache.size <= limit) return;
  const firstKey = cache.keys().next().value;
  if (firstKey !== undefined) cache.delete(firstKey);
}

function patternCacheKey(def: PatternDef): string {
  return JSON.stringify({
    height: def.height,
    id: def.id,
    marks: def.marks,
    patternContentUnits: def.patternContentUnits,
    patternTransform: def.patternTransform,
    patternUnits: def.patternUnits,
    type: def.type,
    width: def.width,
    x: def.x,
    y: def.y,
  });
}

function maskCacheKey(def: MaskDef): string {
  return JSON.stringify({
    height: def.height,
    id: def.id,
    marks: def.marks,
    maskContentUnits: def.maskContentUnits,
    maskUnits: def.maskUnits,
    type: def.type,
    width: def.width,
    x: def.x,
    y: def.y,
  });
}

function renderPatternMarks(def: PatternDef | MaskDef): RenderModel {
  const marks = def.marks.map((mark, i) => ({
    ...mark,
    id: `html-def-mark-${def.id}-${i}`,
  })) as Mark[];
  return {
    height: def.height ?? 1,
    marks,
    width: def.width ?? 1,
  };
}

function wrapSvgContent(svg: string, transform: string | undefined): string {
  if (!transform) return svg;
  const start = svg.indexOf(">");
  const end = svg.lastIndexOf("</svg>");
  if (start < 0 || end < 0 || end <= start) return svg;
  const head = svg.slice(0, start + 1);
  const inner = svg.slice(start + 1, end);
  const tail = svg.slice(end);
  return `${head}<g transform="${escapeHtmlText(transform)}">${inner}</g>${tail}`;
}

function patternToDataUrl(def: PatternDef): string {
  const key = patternCacheKey(def);
  const cached = cacheGet(patternCache, key);
  if (cached) return cached;
  const baseSvg = renderSvgString(renderPatternMarks(def), { title: "" });
  const svg = wrapSvgContent(baseSvg, def.patternTransform);
  const url = svgStringToDataUrl(svg);
  cacheSet(patternCache, key, url, PATTERN_CACHE_LIMIT);
  return url;
}

function maskToDataUrl(def: MaskDef): string {
  const key = maskCacheKey(def);
  const cached = cacheGet(maskCache, key);
  if (cached) return cached;
  const svg = renderSvgString(renderPatternMarks(def), { title: "" });
  const url = svgStringToDataUrl(svg);
  cacheSet(maskCache, key, url, MASK_CACHE_LIMIT);
  return url;
}

type Bounds = { x: number; y: number; w: number; h: number };

function markBounds(mark: Mark): Bounds | null {
  switch (mark.type) {
    case "rect":
      return { h: mark.h, w: mark.w, x: mark.x, y: mark.y };
    case "circle": {
      const r = mark.r;
      return { h: r * 2, w: r * 2, x: mark.cx - r, y: mark.cy - r };
    }
    case "line": {
      const strokeWidth = mark.strokeWidth ?? 1;
      const x = Math.min(mark.x1, mark.x2);
      const y = Math.min(mark.y1, mark.y2) - strokeWidth / 2;
      const w = Math.abs(mark.x2 - mark.x1) || strokeWidth;
      const h = Math.abs(mark.y2 - mark.y1) || strokeWidth;
      return { h, w, x, y };
    }
    case "text":
      return { h: 0, w: 0, x: mark.x, y: mark.y };
    case "path":
      return null;
  }
}

function filterDefToCss(def: FilterDef): string | null {
  if (!isSupportedFilterDef(def)) return null;
  const parts = def.primitives.map((primitive) => {
    if (primitive.type === "dropShadow") {
      const dx = primitive.dx ?? 0;
      const dy = primitive.dy ?? 0;
      const blur = primitive.stdDeviation ?? 0;
      const colorBase = primitive.floodColor ?? "black";
      const color = withOpacity(colorBase, primitive.floodOpacity);
      return `drop-shadow(${dx}px ${dy}px ${blur}px ${color})`;
    }
    if (primitive.type === "gaussianBlur") {
      const blur = primitive.stdDeviation ?? 0;
      return `blur(${blur}px)`;
    }
    return "";
  });
  const css = parts.filter(Boolean).join(" ");
  return css.length > 0 ? css : null;
}

function maskStyles(mark: Mark, defsById: Map<string, Def>): string[] {
  if (!("mask" in mark) || !mark.mask) return [];
  const maskId = resolveDefId(mark.mask);
  if (!maskId) return [];
  const def = defsById.get(maskId);
  if (!def || def.type !== "mask") return [];
  const bounds = markBounds(mark);
  const useObjectBoundingBox = def.maskUnits === "objectBoundingBox";
  const width = def.width ?? bounds?.w ?? 0;
  const height = def.height ?? bounds?.h ?? 0;
  if (
    !useObjectBoundingBox &&
    (!Number.isFinite(width) || !Number.isFinite(height))
  )
    return [];
  const size = useObjectBoundingBox
    ? "100% 100%"
    : `${Math.max(1, width)}px ${Math.max(1, height)}px`;
  const offsetX = useObjectBoundingBox ? 0 : -(bounds?.x ?? 0) + (def.x ?? 0);
  const offsetY = useObjectBoundingBox ? 0 : -(bounds?.y ?? 0) + (def.y ?? 0);
  const position = useObjectBoundingBox ? "0 0" : `${offsetX}px ${offsetY}px`;
  const url = maskToDataUrl(def);
  return [
    stylePair("mask-image", `url("${url}")`),
    stylePair("-webkit-mask-image", `url("${url}")`),
    stylePair("mask-size", size),
    stylePair("-webkit-mask-size", size),
    stylePair("mask-position", position),
    stylePair("-webkit-mask-position", position),
    stylePair("mask-repeat", "no-repeat"),
    stylePair("-webkit-mask-repeat", "no-repeat"),
  ];
}

function filterStyles(mark: Mark, defsById: Map<string, Def>): string[] {
  if (!("filter" in mark) || !mark.filter) return [];
  const filterId = resolveDefId(mark.filter);
  if (!filterId) return [];
  const def = defsById.get(filterId);
  if (!def || def.type !== "filter") return [];
  const css = filterDefToCss(def);
  if (!css) return [];
  return [stylePair("filter", css)];
}

function linearGradientToCss(
  def: Extract<Def, { type: "linearGradient" }>,
  fillOpacity: number | undefined,
): string | null {
  if (!def.stops || def.stops.length === 0) return null;
  const x1 = def.x1 ?? 0;
  const y1 = def.y1 ?? 0;
  const x2 = def.x2 ?? 1;
  const y2 = def.y2 ?? 0;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
  const angleRounded = Math.round(angle * 1000) / 1000;
  const baseOpacity = Number.isFinite(fillOpacity) ? (fillOpacity ?? 1) : 1;
  const stops = [...def.stops]
    .sort((a, b) => a.offset - b.offset)
    .map((stop) => {
      const offset = Math.max(0, Math.min(1, stop.offset));
      const opacity = Math.max(
        0,
        Math.min(1, (stop.opacity ?? 1) * baseOpacity),
      );
      const color = withOpacity(stop.color, opacity);
      const pct = Math.round(offset * 1000) / 10;
      return `${color} ${pct}%`;
    });
  return `linear-gradient(${angleRounded}deg, ${stops.join(", ")})`;
}

function fallbackPaint(mark: Mark, kind: "fill" | "stroke" | "text"): string {
  const className = mark.className?.toLowerCase() ?? "";
  if (kind === "text") return "var(--mv-fg)";
  if (className.includes("grid")) return "var(--mv-grid)";
  if (
    className.includes("track") ||
    className.includes("axis") ||
    className.includes("tick") ||
    className.includes("muted")
  )
    return "var(--mv-muted)";
  return "var(--mv-series-1)";
}

function renderRect(
  mark: Extract<Mark, { type: "rect" }>,
  defsById: Map<string, Def>,
): string {
  const fillRefId = extractUrlRefId(mark.fill);
  const fillDef = fillRefId ? defsById.get(fillRefId) : undefined;
  const gradientFill =
    fillDef?.type === "linearGradient"
      ? linearGradientToCss(fillDef, mark.fillOpacity)
      : null;
  const patternFill =
    fillDef?.type === "pattern" ? patternToDataUrl(fillDef) : null;
  const rawFill = fillRefId ? undefined : mark.fill;
  const fillBase = gradientFill ?? rawFill ?? fallbackPaint(mark, "fill");
  const fill = gradientFill
    ? gradientFill
    : patternFill
      ? patternFill
      : rawFill === "none"
        ? undefined
        : withOpacity(fillBase, mark.fillOpacity);
  const strokeBase = mark.stroke ?? fallbackPaint(mark, "stroke");
  const stroke =
    mark.stroke === "none"
      ? undefined
      : withOpacity(strokeBase, mark.strokeOpacity);
  const strokeWidth = mark.strokeWidth ?? 0;
  const rx = mark.rx ?? 0;
  const ry = mark.ry ?? rx;
  const clipId = mark.clipPath
    ? (extractUrlRefId(mark.clipPath) ?? mark.clipPath)
    : null;
  const clipDef = clipId ? defsById.get(clipId) : null;
  const clipRect = clipDef?.type === "clipRect" ? clipDef : null;

  const offsetX = clipRect?.x ?? 0;
  const offsetY = clipRect?.y ?? 0;

  const rectStyles = [
    stylePair("position", "absolute"),
    stylePair("left", px(mark.x - offsetX)),
    stylePair("top", px(mark.y - offsetY)),
    stylePair("width", px(mark.w)),
    stylePair("height", px(mark.h)),
    patternFill
      ? stylePair("background-image", `url("${fill}")`)
      : stylePair("background", fill ?? "transparent"),
    patternFill
      ? stylePair(
          "background-size",
          fillDef?.type === "pattern"
            ? `${fillDef.width}px ${fillDef.height}px`
            : undefined,
        )
      : "",
    patternFill
      ? stylePair(
          "background-position",
          fillDef?.type === "pattern"
            ? `${-(mark.x - (fillDef.x ?? 0))}px ${-(mark.y - (fillDef.y ?? 0))}px`
            : undefined,
        )
      : "",
    patternFill ? stylePair("background-repeat", "repeat") : "",
    stylePair("opacity", mark.opacity?.toString()),
    stylePair("border-radius", rx || ry ? `${rx}px / ${ry}px` : undefined),
    stroke && strokeWidth > 0
      ? stylePair("box-shadow", `inset 0 0 0 ${strokeWidth}px ${stroke}`)
      : "",
    ...maskStyles(mark, defsById),
    ...filterStyles(mark, defsById),
  ].join("");

  const rect = `<div${attr("data-mark-id", mark.id)}${attr("class", mark.className)}${attr("style", rectStyles)}></div>`;

  if (!clipRect) return rect;

  const clipRx = clipRect.rx ?? 0;
  const clipRy = clipRect.ry ?? clipRx;
  const clipStyles = [
    stylePair("position", "absolute"),
    stylePair("left", px(clipRect.x)),
    stylePair("top", px(clipRect.y)),
    stylePair("width", px(clipRect.w)),
    stylePair("height", px(clipRect.h)),
    stylePair("overflow", "hidden"),
    stylePair(
      "border-radius",
      clipRx || clipRy ? `${clipRx}px / ${clipRy}px` : undefined,
    ),
  ].join("");

  return `<div${attr("style", clipStyles)}>${rect}</div>`;
}

function renderCircle(
  mark: Extract<Mark, { type: "circle" }>,
  defsById: Map<string, Def>,
): string {
  const fillRefId = extractUrlRefId(mark.fill);
  const fillDef = fillRefId ? defsById.get(fillRefId) : undefined;
  const patternFill =
    fillDef?.type === "pattern" ? patternToDataUrl(fillDef) : null;
  const rawFill = fillRefId ? undefined : mark.fill;
  const fillBase = rawFill ?? fallbackPaint(mark, "fill");
  const fill =
    patternFill ??
    (mark.fill === "none"
      ? undefined
      : withOpacity(fillBase, mark.fillOpacity));
  const strokeBase = mark.stroke ?? fallbackPaint(mark, "stroke");
  const stroke =
    mark.stroke === "none"
      ? undefined
      : withOpacity(strokeBase, mark.strokeOpacity);
  const strokeWidth = mark.strokeWidth ?? 0;
  const size = mark.r * 2;

  const styles = [
    stylePair("position", "absolute"),
    stylePair("left", px(mark.cx - mark.r)),
    stylePair("top", px(mark.cy - mark.r)),
    stylePair("width", px(size)),
    stylePair("height", px(size)),
    patternFill
      ? stylePair("background-image", `url("${fill}")`)
      : stylePair("background", fill ?? "transparent"),
    patternFill
      ? stylePair(
          "background-size",
          fillDef?.type === "pattern"
            ? `${fillDef.width}px ${fillDef.height}px`
            : undefined,
        )
      : "",
    patternFill
      ? stylePair(
          "background-position",
          fillDef?.type === "pattern"
            ? `${-(mark.cx - mark.r - (fillDef.x ?? 0))}px ${-(mark.cy - mark.r - (fillDef.y ?? 0))}px`
            : undefined,
        )
      : "",
    patternFill ? stylePair("background-repeat", "repeat") : "",
    stylePair("border-radius", "9999px"),
    stylePair("opacity", mark.opacity?.toString()),
    stroke && strokeWidth > 0
      ? stylePair("box-shadow", `inset 0 0 0 ${strokeWidth}px ${stroke}`)
      : "",
    ...maskStyles(mark, defsById),
    ...filterStyles(mark, defsById),
  ].join("");

  return `<div${attr("data-mark-id", mark.id)}${attr("class", mark.className)}${attr("style", styles)}></div>`;
}

function renderLine(
  mark: Extract<Mark, { type: "line" }>,
  defsById: Map<string, Def>,
): string {
  const strokeBase = mark.stroke ?? fallbackPaint(mark, "stroke");
  const stroke =
    mark.stroke === "none"
      ? undefined
      : withOpacity(strokeBase, mark.strokeOpacity);
  const strokeWidth = mark.strokeWidth ?? 1;
  const dx = mark.x2 - mark.x1;
  const dy = mark.y2 - mark.y1;
  const length = Math.hypot(dx, dy);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  const radius = mark.strokeLinecap === "round" ? strokeWidth / 2 : 0;

  const styles = [
    stylePair("position", "absolute"),
    stylePair("left", px(mark.x1)),
    stylePair("top", px(mark.y1 - strokeWidth / 2)),
    stylePair("width", px(length)),
    stylePair("height", px(strokeWidth)),
    stylePair("background", stroke ?? fallbackPaint(mark, "stroke")),
    stylePair("opacity", mark.opacity?.toString()),
    stylePair("border-radius", radius ? `${radius}px` : undefined),
    stylePair("transform-origin", "0 0"),
    stylePair("transform", `rotate(${angle}deg)`),
    ...maskStyles(mark, defsById),
    ...filterStyles(mark, defsById),
  ].join("");

  return `<div${attr("data-mark-id", mark.id)}${attr("class", mark.className)}${attr("style", styles)}></div>`;
}

function renderText(
  mark: Extract<Mark, { type: "text" }>,
  defsById: Map<string, Def>,
): string {
  const fillBase = mark.fill ?? fallbackPaint(mark, "text");
  const color =
    mark.fill === "none" ? undefined : withOpacity(fillBase, mark.fillOpacity);
  const anchor = mark.anchor ?? "start";
  const baseline = mark.baseline ?? "alphabetic";

  const translateX =
    anchor === "middle" ? "-50%" : anchor === "end" ? "-100%" : "0";
  const translateY =
    baseline === "middle" || baseline === "central"
      ? "-50%"
      : baseline === "alphabetic"
        ? "-100%"
        : "0";

  const transform =
    translateX !== "0" || translateY !== "0"
      ? `translate(${translateX}, ${translateY})`
      : undefined;

  const styles = [
    stylePair("position", "absolute"),
    stylePair("left", px(mark.x)),
    stylePair("top", px(mark.y)),
    stylePair("color", color ?? fallbackPaint(mark, "text")),
    stylePair("opacity", mark.opacity?.toString()),
    stylePair("white-space", "pre"),
    stylePair("transform", transform),
    ...maskStyles(mark, defsById),
    ...filterStyles(mark, defsById),
  ].join("");

  return `<div${attr("data-mark-id", mark.id)}${attr("class", mark.className)}${attr("style", styles)}>${escapeHtmlText(mark.text)}</div>`;
}

function renderMark(mark: Mark, defsById: Map<string, Def>): string {
  switch (mark.type) {
    case "rect":
      return renderRect(mark, defsById);
    case "circle":
      return renderCircle(mark, defsById);
    case "line":
      return renderLine(mark, defsById);
    case "text":
      return renderText(mark, defsById);
    case "path":
      return "";
  }
}

export function renderHtmlString(
  model: RenderModel,
  options?: { title?: string; className?: string },
): string {
  const label = options?.title ?? model.a11y?.label;
  const role = model.a11y?.role ?? "img";
  const defsById = new Map<string, Def>(
    model.defs?.map((def) => [def.id, def]) ?? [],
  );
  const className = ["mv-chart", "mv-html-renderer", options?.className]
    .filter(Boolean)
    .join(" ");
  const style = [
    stylePair("position", "relative"),
    stylePair("width", px(model.width)),
    stylePair("height", px(model.height)),
    stylePair("overflow", "hidden"),
  ].join("");
  const marks = model.marks.map((mark) => renderMark(mark, defsById)).join("");

  return `<div${attr("class", className)}${attr("role", role)}${attr("aria-label", label)}${attr("data-mv-renderer", "html")}${attr("style", style)}>${marks}</div>`;
}
