import type { Mark } from "../model";
import type { ChartDefinition } from "./chart-definition";
import { coerceFiniteNonNegative, normalizeSegments } from "./shared";
import type { BitfieldData, MosaicSpec, NormalizedMosaic } from "./types";

export const mosaicChart = {
  a11y(_spec, _normalized, _layout) {
    return { label: "Mosaic chart", role: "img" };
  },
  category: "grids" as const,
  defaultPad: 0,
  displayName: "Mosaic",
  isEmpty(normalized) {
    return normalized.segments.length === 0;
  },
  marks(spec, normalized, layout, _state, _theme, warnings) {
    const segments = normalized.segments;
    if (segments.length === 0) return [];

    const usableW = Math.max(0, layout.width - layout.pad * 2);
    const usableH = Math.max(0, layout.height - layout.pad * 2);

    const gap = coerceFiniteNonNegative(
      spec.gap ?? 1,
      1,
      warnings,
      "Non-finite mosaic gap; defaulted to 1.",
    );

    const classSuffix = spec.className ? ` ${spec.className}` : "";

    const major0 = segments[0];
    if (!major0) return [];
    const major1 = segments[1];
    const minor = segments.slice(2);

    if (!major1) {
      return [
        {
          className: `mv-mosaic-cell${classSuffix}`,
          fill: major0.color,
          h: usableH,
          id: "mosaic-major-0",
          type: "rect",
          w: usableW,
          x: layout.pad,
          y: layout.pad,
        },
      ];
    }

    const pct0 = major0.pct;
    const pct1 = major1.pct;
    const remainingPct = Math.max(0, 100 - pct0 - pct1);

    const columns = remainingPct > 0 ? 3 : 2;
    const totalGapX = gap * Math.max(0, columns - 1);
    const availableW = Math.max(0, usableW - totalGapX);

    const w0 = (pct0 / 100) * availableW;
    const w1 = (pct1 / 100) * availableW;
    const w2 = Math.max(0, availableW - w0 - w1);

    const x0 = layout.pad;
    const y0 = layout.pad;
    const x1 = columns >= 2 ? x0 + w0 + gap : x0;
    const x2 = columns === 3 ? x1 + w1 + gap : x1;

    const marks: Mark[] = [
      {
        className: `mv-mosaic-cell${classSuffix}`,
        fill: major0.color,
        h: usableH,
        id: "mosaic-major-0",
        type: "rect",
        w: w0,
        x: x0,
        y: y0,
      },
      {
        className: `mv-mosaic-cell${classSuffix}`,
        fill: major1.color,
        h: usableH,
        id: "mosaic-major-1",
        type: "rect",
        w: columns === 2 ? Math.max(0, availableW - w0) : w1,
        x: x1,
        y: y0,
      },
    ];

    if (columns !== 3 || w2 <= 0) return marks;

    if (minor.length === 0) {
      marks.push({
        className: `mv-mosaic-placeholder${classSuffix}`,
        fill: "rgba(100,116,139,0.3)",
        h: usableH,
        id: "mosaic-minor-placeholder",
        type: "rect",
        w: w2,
        x: x2,
        y: y0,
      });
      return marks;
    }

    const totalGapY = gap * Math.max(0, minor.length - 1);
    const availableH = Math.max(0, usableH - totalGapY);
    const minorTotal = minor.reduce((sum, seg) => sum + seg.pct, 0) || 1;

    let acc = 0;
    for (let i = 0; i < minor.length; i++) {
      const seg = minor[i];
      if (!seg) continue;
      const y = y0 + acc + gap * i;
      const h =
        i === minor.length - 1
          ? Math.max(0, y0 + usableH - y)
          : (seg.pct / minorTotal) * availableH;
      marks.push({
        className: `mv-mosaic-cell${classSuffix}`,
        fill: seg.color,
        h,
        id: `mosaic-minor-${i}`,
        type: "rect",
        w: w2,
        x: x2,
        y,
      });
      acc += h;
    }

    return marks;
  },
  normalize(_spec, data) {
    const segments = normalizeSegments(data);
    return { segments, type: "mosaic" };
  },
  type: "mosaic",
} satisfies ChartDefinition<
  "mosaic",
  MosaicSpec,
  BitfieldData,
  NormalizedMosaic
>;
