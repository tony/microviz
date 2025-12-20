import type { Mark } from "../model";
import type { ChartDefinition } from "./chart-definition";
import {
  coerceFiniteNonNegative,
  layoutSegmentsByPct,
  normalizeSegments,
} from "./shared";
import type { BitfieldData, ChevronSpec, NormalizedChevron } from "./types";

function chevronPath(options: {
  height: number;
  isLast: boolean;
  overlap: number;
  width: number;
  x: number;
  y: number;
}): string {
  const h = Math.max(0, options.height);
  const w = Math.max(0, options.width);
  const x = options.x;
  const y = options.y;
  const midY = y + h / 2;
  const yBottom = y + h;

  const overlap = Math.min(Math.max(0, options.overlap), w);
  const xRight = x + w;
  const xRightBase = x + Math.max(0, w - overlap);
  const notchX = x + overlap;

  if (options.isLast) {
    return `M ${x.toFixed(2)} ${y.toFixed(2)} L ${xRight.toFixed(2)} ${y.toFixed(2)} L ${xRight.toFixed(2)} ${yBottom.toFixed(2)} L ${x.toFixed(2)} ${yBottom.toFixed(2)} L ${notchX.toFixed(2)} ${midY.toFixed(2)} Z`;
  }

  return `M ${x.toFixed(2)} ${y.toFixed(2)} L ${xRightBase.toFixed(2)} ${y.toFixed(2)} L ${xRight.toFixed(2)} ${midY.toFixed(2)} L ${xRightBase.toFixed(2)} ${yBottom.toFixed(2)} L ${x.toFixed(2)} ${yBottom.toFixed(2)} L ${notchX.toFixed(2)} ${midY.toFixed(2)} Z`;
}

export const chevronChart = {
  a11y(_spec, _normalized, _layout) {
    return { label: "Chevron chart", role: "img" };
  },
  category: "bars" as const,
  defaultPad: 0,
  displayName: "Chevron",
  emptyDataWarningMessage: "No segments data.",
  isEmpty(normalized) {
    return normalized.segments.length === 0;
  },
  marks(spec, normalized, layout, _state, _theme, warnings) {
    const usableW = Math.max(0, layout.width - layout.pad * 2);
    const usableH = Math.max(0, layout.height - layout.pad * 2);
    const x0 = layout.pad;
    const y0 = layout.pad;

    const segments = normalized.segments;
    if (segments.length === 0) return [];

    const overlapRequested = coerceFiniteNonNegative(
      spec.overlap ?? 6,
      6,
      warnings,
      "Non-finite chevron overlap; defaulted to 6.",
    );
    const overlap = Math.min(overlapRequested, usableW);

    const runs = layoutSegmentsByPct(segments, usableW, 0);
    const classSuffix = spec.className ? ` ${spec.className}` : "";

    const marks: Mark[] = [];
    for (let i = runs.length - 1; i >= 0; i--) {
      const run = runs[i];
      if (!run) continue;

      const isLast = i === runs.length - 1;
      const w = run.w + (isLast ? 0 : overlap);
      const x = x0 + run.x;

      marks.push({
        className: `mv-chevron-seg${classSuffix}`,
        d: chevronPath({
          height: usableH,
          isLast,
          overlap,
          width: w,
          x,
          y: y0,
        }),
        fill: run.color,
        id: `chevron-seg-${i}`,
        type: "path",
      });
    }

    return marks;
  },
  normalize(_spec, data) {
    const segments = normalizeSegments(data);
    return { segments, type: "chevron" as const };
  },
  preferredAspectRatio: "wide" as const,
  type: "chevron",
} satisfies ChartDefinition<
  "chevron",
  ChevronSpec,
  BitfieldData,
  NormalizedChevron
>;
