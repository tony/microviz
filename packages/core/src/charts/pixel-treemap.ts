import type { Def, Mark } from "../model";
import type { ChartDefinition } from "./chart-definition";
import {
  coerceFiniteNonNegative,
  isIntegerish,
  normalizeSegments,
} from "./shared";
import type {
  BitfieldData,
  NormalizedPixelTreemap,
  PixelTreemapSpec,
} from "./types";

const CLIP_ID = "pixel-treemap-clip";

function segmentSortKey(
  seg: { name?: string; color: string },
  index: number,
): string {
  return seg.name ?? seg.color ?? String(index);
}

export const pixelTreemapChart = {
  a11y(_spec, _normalized, _layout) {
    return { label: "Pixel treemap chart", role: "img" };
  },
  category: "grids" as const,
  defaultPad: 0,
  defs(spec, normalized, layout, warnings): Def[] {
    const segments = normalized.segments;
    if (segments.length === 0) return [];

    const usableW = Math.max(0, layout.width - layout.pad * 2);
    const usableH = Math.max(0, layout.height - layout.pad * 2);
    if (usableW <= 0 || usableH <= 0) return [];

    const cornerRadiusDefault = Math.min(6, Math.min(usableW, usableH) / 4);
    const cornerRadius = coerceFiniteNonNegative(
      spec.cornerRadius ?? cornerRadiusDefault,
      cornerRadiusDefault,
      warnings,
      "Non-finite pixel-treemap cornerRadius; defaulted to 6.",
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
  displayName: "Pixel treemap",
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

    const cornerRadiusDefault = Math.min(6, Math.min(usableW, usableH) / 4);
    const cornerRadius = coerceFiniteNonNegative(
      spec.cornerRadius ?? cornerRadiusDefault,
      cornerRadiusDefault,
      warnings,
      "Non-finite pixel-treemap cornerRadius; defaulted to 6.",
    );
    const clipPath = cornerRadius > 0 ? CLIP_ID : undefined;

    const strokeWidth = coerceFiniteNonNegative(
      spec.strokeWidth ?? 0.5,
      0.5,
      warnings,
      "Non-finite pixel-treemap strokeWidth; defaulted to 0.5.",
    );
    const strokeOpacityRaw = coerceFiniteNonNegative(
      spec.strokeOpacity ?? 0.3,
      0.3,
      warnings,
      "Non-finite pixel-treemap strokeOpacity; defaulted to 0.3.",
    );
    const strokeOpacity = Math.min(1, strokeOpacityRaw);

    const x0 = layout.pad;
    const y0 = layout.pad;

    const classSuffix = spec.className ? ` ${spec.className}` : "";

    const sorted = segments
      .map((seg, index) => ({ index, key: segmentSortKey(seg, index), seg }))
      .sort((a, b) => {
        const pct = b.seg.pct - a.seg.pct;
        if (pct !== 0) return pct;
        const key = a.key.localeCompare(b.key);
        if (key !== 0) return key;
        return a.index - b.index;
      })
      .map((x) => x.seg);

    const canSnap =
      isIntegerish(x0) &&
      isIntegerish(y0) &&
      isIntegerish(usableW) &&
      isIntegerish(usableH);

    const stroke = spec.stroke ?? "white";

    let x = canSnap ? Math.round(x0) : x0;
    let y = canSnap ? Math.round(y0) : y0;
    let w = canSnap ? Math.round(usableW) : usableW;
    let h = canSnap ? Math.round(usableH) : usableH;

    let remaining = sorted.reduce((sum, seg) => sum + seg.pct, 0) || 1;

    const marks: Mark[] = [];
    for (let i = 0; i < sorted.length; i++) {
      const seg = sorted[i];
      if (!seg) continue;

      if (!(w > 0 && h > 0)) break;

      const isLast = i === sorted.length - 1;
      const rel = remaining > 0 ? seg.pct / remaining : 0;

      if (isLast) {
        marks.push({
          className: `mv-pixel-treemap-cell${classSuffix}`,
          clipPath,
          fill: seg.color,
          h,
          id: `pixel-treemap-cell-${i}`,
          stroke,
          strokeOpacity,
          strokeWidth,
          type: "rect",
          w,
          x,
          y,
        });
        break;
      }

      if (w >= h) {
        const split = Math.max(1, Math.min(Math.round(w * rel), w - 1));
        marks.push({
          className: `mv-pixel-treemap-cell${classSuffix}`,
          clipPath,
          fill: seg.color,
          h,
          id: `pixel-treemap-cell-${i}`,
          stroke,
          strokeOpacity,
          strokeWidth,
          type: "rect",
          w: split,
          x,
          y,
        });
        x += split;
        w -= split;
      } else {
        const split = Math.max(1, Math.min(Math.round(h * rel), h - 1));
        marks.push({
          className: `mv-pixel-treemap-cell${classSuffix}`,
          clipPath,
          fill: seg.color,
          h: split,
          id: `pixel-treemap-cell-${i}`,
          stroke,
          strokeOpacity,
          strokeWidth,
          type: "rect",
          w,
          x,
          y,
        });
        y += split;
        h -= split;
      }

      remaining -= seg.pct;
    }

    return marks;
  },
  normalize(_spec, data) {
    const segments = normalizeSegments(data);
    return { segments, type: "pixel-treemap" as const };
  },
  preferredAspectRatio: "square" as const,
  type: "pixel-treemap",
} satisfies ChartDefinition<
  "pixel-treemap",
  PixelTreemapSpec,
  BitfieldData,
  NormalizedPixelTreemap
>;
