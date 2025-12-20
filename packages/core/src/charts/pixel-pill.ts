import type { Def, Mark } from "../model";
import type { ChartDefinition } from "./chart-definition";
import {
  allocateUnitsByPct,
  coerceFiniteInt,
  coerceFiniteNonNegative,
  normalizeSegments,
} from "./shared";
import type { BitfieldData, NormalizedPixelPill, PixelPillSpec } from "./types";

const CLIP_ID = "pixel-pill-clip";

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

export const pixelPillChart = {
  a11y(_spec, _normalized, _layout) {
    return { label: "Pixel pill chart", role: "img" };
  },
  category: "bars" as const,
  defaultPad: 0,
  defs(spec, normalized, layout, warnings): Def[] {
    const segments = normalized.segments;
    if (segments.length === 0) return [];

    const usableW = Math.max(0, layout.width - layout.pad * 2);
    const usableH = Math.max(0, layout.height - layout.pad * 2);
    if (usableW <= 0 || usableH <= 0) return [];

    const cornerRadiusDefault = usableH / 2;
    const cornerRadius = coerceFiniteNonNegative(
      spec.cornerRadius ?? cornerRadiusDefault,
      cornerRadiusDefault,
      warnings,
      "Non-finite pixel-pill cornerRadius; defaulted to half the chart height.",
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
  displayName: "Pixel pill",
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
      "Non-finite pixel-pill gap; defaulted to 1.",
    );
    const gap = Math.round(gapRaw);

    const minPx = coerceFiniteInt(
      spec.minPx ?? 1,
      1,
      0,
      warnings,
      "Non-finite pixel-pill minPx; defaulted to 1.",
    );

    const usableWPx = Math.round(usableW);
    const usableHPx = Math.round(usableH);
    const x0 = Math.round(layout.pad);
    const y0 = Math.round(layout.pad);

    const totalGap = gap * Math.max(0, segments.length - 1);
    const available = Math.max(0, usableWPx - totalGap);

    const counts = allocateCounts(segments, available, minPx);

    const cornerRadiusDefault = usableHPx / 2;
    const cornerRadius = coerceFiniteNonNegative(
      spec.cornerRadius ?? cornerRadiusDefault,
      cornerRadiusDefault,
      warnings,
      "Non-finite pixel-pill cornerRadius; defaulted to half the chart height.",
    );
    const clipPath = cornerRadius > 0 ? CLIP_ID : undefined;

    const classSuffix = spec.className ? ` ${spec.className}` : "";

    const marks: Mark[] = [];
    let x = x0;
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      if (!seg) continue;
      const w = counts[i] ?? 0;
      if (w <= 0) continue;
      marks.push({
        className: `mv-pixel-pill-seg${classSuffix}`,
        clipPath,
        fill: seg.color,
        h: usableHPx,
        id: `pixel-pill-seg-${i}`,
        type: "rect",
        w,
        x,
        y: y0,
      });
      x += w + gap;
    }

    return marks;
  },
  normalize(_spec, data) {
    const segments = normalizeSegments(data);
    return { segments, type: "pixel-pill" as const };
  },
  preferredAspectRatio: "wide" as const,
  type: "pixel-pill",
} satisfies ChartDefinition<
  "pixel-pill",
  PixelPillSpec,
  BitfieldData,
  NormalizedPixelPill
>;
