import { a11yItemsForSegments, a11yLabelWithSegmentsSummary } from "../a11y";
import type { Def, Mark } from "../model";
import type { ChartDefinition } from "./chart-definition";
import {
  allocateUnitsByPct,
  coerceFiniteInt,
  coerceFiniteNonNegative,
  normalizeSegments,
} from "./shared";
import type {
  BitfieldData,
  NormalizedPixelColumn,
  PixelColumnSpec,
} from "./types";

const CLIP_ID = "pixel-column-clip";

function segmentSortKey(
  seg: { name?: string; color: string },
  index: number,
): string {
  return seg.name ?? seg.color ?? String(index);
}

function allocateCounts(
  segments: ReadonlyArray<{ name?: string; pct: number; color: string }>,
  totalUnits: number,
  minUnits: number,
): number[] {
  const n = segments.length;
  if (n === 0) return [];

  const total = Math.max(0, Math.floor(totalUnits));
  if (total <= 0) return segments.map(() => 0);

  let min = Math.max(0, Math.floor(minUnits));
  if (min > 0 && min * n > total) min = 0;

  let counts = allocateUnitsByPct(segments, total);
  if (min > 0) counts = counts.map((c) => Math.max(c, min));

  let excess = counts.reduce((sum, c) => sum + c, 0) - total;
  if (excess <= 0) return counts;

  const order = counts
    .map((count, index) => ({
      count,
      index,
      key: segmentSortKey(segments[index] ?? { color: "", pct: 0 }, index),
    }))
    .sort(
      (a, b) =>
        b.count - a.count || a.key.localeCompare(b.key) || a.index - b.index,
    );

  for (const item of order) {
    if (excess <= 0) break;
    const canRemove = counts[item.index] - min;
    if (canRemove <= 0) continue;
    const remove = Math.min(canRemove, excess);
    counts[item.index] -= remove;
    excess -= remove;
  }

  return counts;
}

export const pixelColumnChart = {
  a11y(_spec, normalized, _layout) {
    return {
      items: a11yItemsForSegments(normalized.segments, {
        idPrefix: "pixel-column-seg",

        labelFallback: "Segment",
      }),
      label: a11yLabelWithSegmentsSummary(
        "Pixel column chart",
        normalized.segments,
      ),
      role: "img",
    };
  },
  category: "bars" as const,
  defaultPad: 0,
  defs(spec, normalized, layout, warnings): Def[] {
    const segments = normalized.segments;
    if (segments.length === 0) return [];

    const usableW = Math.max(0, layout.width - layout.pad * 2);
    const usableH = Math.max(0, layout.height - layout.pad * 2);
    if (usableW <= 0 || usableH <= 0) return [];

    const cornerRadiusDefault = usableW / 2;
    const cornerRadius = coerceFiniteNonNegative(
      spec.cornerRadius ?? cornerRadiusDefault,
      cornerRadiusDefault,
      warnings,
      "Non-finite pixel-column cornerRadius; defaulted to half the chart width.",
    );
    if (cornerRadius <= 0) return [];

    return [
      {
        h: usableH,
        id: CLIP_ID,
        rx: cornerRadius,
        ry: cornerRadius,
        type: "clipRect",
        w: usableW,
        x: layout.pad,
        y: layout.pad,
      },
    ];
  },
  displayName: "Pixel column",
  emptyDataWarningMessage: "No segments data.",
  isEmpty(normalized) {
    return normalized.segments.length === 0;
  },
  marks(spec, normalized, layout, _state, _theme, warnings) {
    const segments = normalized.segments;
    if (segments.length === 0) return [];

    const usableW = Math.max(0, layout.width - layout.pad * 2);
    const usableH = Math.max(0, layout.height - layout.pad * 2);
    if (usableW <= 0 || usableH <= 0) return [];

    const gapRaw = coerceFiniteNonNegative(
      spec.gap ?? 1,
      1,
      warnings,
      "Non-finite pixel-column gap; defaulted to 1.",
    );
    const gap = Math.round(gapRaw);

    const minPx = coerceFiniteInt(
      spec.minPx ?? 1,
      1,
      0,
      warnings,
      "Non-finite pixel-column minPx; defaulted to 1.",
    );

    const usableWPx = Math.round(usableW);
    const usableHPx = Math.round(usableH);
    const x0 = Math.round(layout.pad);
    const y0 = Math.round(layout.pad);

    const totalGap = gap * Math.max(0, segments.length - 1);
    const available = Math.max(0, usableHPx - totalGap);

    const counts = allocateCounts(segments, available, minPx);

    const cornerRadiusDefault = usableWPx / 2;
    const cornerRadius = coerceFiniteNonNegative(
      spec.cornerRadius ?? cornerRadiusDefault,
      cornerRadiusDefault,
      warnings,
      "Non-finite pixel-column cornerRadius; defaulted to half the chart width.",
    );
    const clipPath = cornerRadius > 0 ? CLIP_ID : undefined;

    const classSuffix = spec.className ? ` ${spec.className}` : "";

    const marks: Mark[] = [];
    let y = y0;
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      if (!seg) continue;
      const h = counts[i] ?? 0;
      if (h <= 0) continue;
      marks.push({
        className: `mv-pixel-column-seg${classSuffix}`,
        clipPath,
        fill: seg.color,
        h,
        id: `pixel-column-seg-${i}`,
        type: "rect",
        w: usableWPx,
        x: x0,
        y,
      });
      y += h + gap;
    }

    return marks;
  },
  normalize(_spec, data) {
    const segments = normalizeSegments(data);
    return { segments, type: "pixel-column" as const };
  },
  preferredAspectRatio: "tall" as const,
  type: "pixel-column",
} satisfies ChartDefinition<
  "pixel-column",
  PixelColumnSpec,
  BitfieldData,
  NormalizedPixelColumn
>;
