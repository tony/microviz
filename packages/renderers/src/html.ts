import type { Def, Mark, RenderModel } from "@microviz/core";

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

const HTML_SUPPORTED_MARK_TYPE_SET = new Set<Mark["type"]>(
  HTML_SUPPORTED_MARK_TYPES,
);

/**
 * HTML renderer policy (experimental, parity-deferred):
 * - Supports only rect/circle/line/text marks.
 * - Ignores path marks entirely.
 * - Ignores all defs (gradients, patterns, masks, filters, clip paths).
 * - Ignores mark effects: clipPath, mask, filter, strokeDash.
 * - Use SVG/Canvas for full-fidelity output.
 */
export const HTML_RENDERER_POLICY = {
  notes: ["Use SVG/Canvas for full-fidelity output."],
  status: "experimental",
  supportedMarkTypes: HTML_SUPPORTED_MARK_TYPES,
  unsupportedDefs: "all",
  unsupportedMarkEffects: ["clipPath", "mask", "filter", "strokeDash"],
  unsupportedMarkTypes: ["path"],
} as const;

function uniqueSorted<T extends string>(values: Iterable<T>): T[] {
  return [...new Set(values)].sort();
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
  return uniqueSorted(model.defs.map((def) => def.type));
}

export function getHtmlUnsupportedMarkEffects(
  model: RenderModel,
): HtmlUnsupportedMarkEffect[] {
  const effects = new Set<HtmlUnsupportedMarkEffect>();
  for (const mark of model.marks) {
    if ("clipPath" in mark && mark.clipPath) effects.add("clipPath");
    if ("mask" in mark && mark.mask) effects.add("mask");
    if ("filter" in mark && mark.filter) effects.add("filter");
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

function renderRect(mark: Extract<Mark, { type: "rect" }>): string {
  const fillBase = mark.fill ?? fallbackPaint(mark, "fill");
  const fill =
    mark.fill === "none" ? undefined : withOpacity(fillBase, mark.fillOpacity);
  const strokeBase = mark.stroke ?? fallbackPaint(mark, "stroke");
  const stroke =
    mark.stroke === "none"
      ? undefined
      : withOpacity(strokeBase, mark.strokeOpacity);
  const strokeWidth = mark.strokeWidth ?? 0;
  const rx = mark.rx ?? 0;
  const ry = mark.ry ?? rx;

  const styles = [
    stylePair("position", "absolute"),
    stylePair("left", px(mark.x)),
    stylePair("top", px(mark.y)),
    stylePair("width", px(mark.w)),
    stylePair("height", px(mark.h)),
    stylePair("background", fill ?? "transparent"),
    stylePair("opacity", mark.opacity?.toString()),
    stylePair("border-radius", rx || ry ? `${rx}px / ${ry}px` : undefined),
    stroke && strokeWidth > 0
      ? stylePair("box-shadow", `inset 0 0 0 ${strokeWidth}px ${stroke}`)
      : "",
  ].join("");

  return `<div${attr("data-mark-id", mark.id)}${attr("class", mark.className)}${attr("style", styles)}></div>`;
}

function renderCircle(mark: Extract<Mark, { type: "circle" }>): string {
  const fillBase = mark.fill ?? fallbackPaint(mark, "fill");
  const fill =
    mark.fill === "none" ? undefined : withOpacity(fillBase, mark.fillOpacity);
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
    stylePair("background", fill ?? "transparent"),
    stylePair("border-radius", "9999px"),
    stylePair("opacity", mark.opacity?.toString()),
    stroke && strokeWidth > 0
      ? stylePair("box-shadow", `inset 0 0 0 ${strokeWidth}px ${stroke}`)
      : "",
  ].join("");

  return `<div${attr("data-mark-id", mark.id)}${attr("class", mark.className)}${attr("style", styles)}></div>`;
}

function renderLine(mark: Extract<Mark, { type: "line" }>): string {
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
  ].join("");

  return `<div${attr("data-mark-id", mark.id)}${attr("class", mark.className)}${attr("style", styles)}></div>`;
}

function renderText(mark: Extract<Mark, { type: "text" }>): string {
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
  ].join("");

  return `<div${attr("data-mark-id", mark.id)}${attr("class", mark.className)}${attr("style", styles)}>${escapeHtmlText(mark.text)}</div>`;
}

function renderMark(mark: Mark): string {
  switch (mark.type) {
    case "rect":
      return renderRect(mark);
    case "circle":
      return renderCircle(mark);
    case "line":
      return renderLine(mark);
    case "text":
      return renderText(mark);
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
  const className = ["mv-chart", "mv-html-renderer", options?.className]
    .filter(Boolean)
    .join(" ");
  const style = [
    stylePair("position", "relative"),
    stylePair("width", px(model.width)),
    stylePair("height", px(model.height)),
    stylePair("overflow", "hidden"),
  ].join("");
  const marks = model.marks.map(renderMark).join("");

  return `<div${attr("class", className)}${attr("role", role)}${attr("aria-label", label)}${attr("data-mv-renderer", "html")}${attr("style", style)}>${marks}</div>`;
}
