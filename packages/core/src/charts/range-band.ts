import { a11yLabelWithSeriesSummary } from "../a11y";
import type { ChartDefinition } from "./chart-definition";
import {
  clamp,
  coerceFinite,
  coerceFiniteNonNegative,
  isFiniteNumber,
  normalizedPct,
} from "./shared";
import type {
  NormalizedRangeBand,
  RangeBandSpec,
  SparklineData,
} from "./types";

export const rangeBandChart = {
  a11y(_spec, normalized, _layout) {
    return {
      label: a11yLabelWithSeriesSummary("Range band chart", normalized.series),
      role: "img",
    };
  },
  category: "lines" as const,
  defaultPad: 3,
  displayName: "Range band",
  emptyDataWarningMessage: "No series data.",
  isEmpty(normalized) {
    return normalized.series.length === 0;
  },
  marks(spec, normalized, layout, _state, _theme, warnings) {
    const series = normalized.series;
    if (series.length === 0) return [];

    const bandSeed = coerceFinite(
      spec.bandSeed ?? 0,
      0,
      warnings,
      "Non-finite range-band band seed; defaulted to 0.",
    );
    const bandOpacity = clamp(
      coerceFiniteNonNegative(
        spec.bandOpacity ?? 0.18,
        0.18,
        warnings,
        "Non-finite range-band band opacity; defaulted to 0.18.",
      ),
      0,
      1,
    );
    const strokeWidth = coerceFiniteNonNegative(
      spec.strokeWidth ?? 2,
      2,
      warnings,
      "Non-finite range-band stroke width; defaulted to 2.",
    );
    const dotRadius = coerceFiniteNonNegative(
      spec.dotRadius ?? 2.2,
      2.2,
      warnings,
      "Non-finite range-band dot radius; defaulted to 2.2.",
    );

    const x0 = layout.pad;
    const x1 = layout.width - layout.pad;
    const y0 = layout.pad;
    const y1 = layout.height - layout.pad;

    const dx = series.length > 1 ? (x1 - x0) / (series.length - 1) : x1 - x0;
    const ySpan = y1 - y0 || 1;
    const seedTerm = (bandSeed % 71) * 0.013;

    const points = series.map((v, i) => {
      const pct = normalizedPct(v);
      return { x: x0 + dx * i, y: y1 - (pct / 100) * ySpan };
    });

    const minPts = series.map((v, i) => {
      const pct = normalizedPct(v);
      const wobble = 6 + 4 * (0.5 + 0.5 * Math.sin((i + 1) * 0.65 + seedTerm));
      const min = clamp(pct - wobble, 0, 100);
      return { x: x0 + dx * i, y: y1 - (min / 100) * ySpan };
    });

    const maxPts = series.map((v, i) => {
      const pct = normalizedPct(v);
      const wobble = 6 + 4 * (0.5 + 0.5 * Math.sin((i + 1) * 0.65 + seedTerm));
      const max = clamp(pct + wobble, 0, 100);
      return { x: x0 + dx * i, y: y1 - (max / 100) * ySpan };
    });

    let bandD = `M ${minPts[0].x.toFixed(2)} ${minPts[0].y.toFixed(2)}`;
    for (let i = 1; i < minPts.length; i++)
      bandD += ` L ${minPts[i].x.toFixed(2)} ${minPts[i].y.toFixed(2)}`;
    for (let i = maxPts.length - 1; i >= 0; i--)
      bandD += ` L ${maxPts[i].x.toFixed(2)} ${maxPts[i].y.toFixed(2)}`;
    bandD += " Z";

    const classSuffix = spec.className ? ` ${spec.className}` : "";
    const last = points[points.length - 1];
    const lineMarks = points.slice(1).map((curr, i) => {
      const prev = points[i];
      return {
        className: `mv-range-band-line${classSuffix}`,
        id: `range-band-line-${i}`,
        strokeLinecap: "round" as const,
        strokeWidth,
        type: "line" as const,
        x1: prev.x,
        x2: curr.x,
        y1: prev.y,
        y2: curr.y,
      };
    });

    return [
      {
        className: `mv-range-band-band${classSuffix}`,
        d: bandD,
        fillOpacity: bandOpacity,
        id: "range-band-band",
        type: "path",
      },
      ...lineMarks,
      {
        className: `mv-range-band-dot${classSuffix}`,
        cx: last?.x ?? x1,
        cy: last?.y ?? y1,
        id: "range-band-dot",
        r: dotRadius,
        type: "circle",
      },
    ];
  },
  normalize(_spec, data) {
    const series = data.filter(isFiniteNumber);
    return { series, type: "range-band" };
  },
  type: "range-band",
} satisfies ChartDefinition<
  "range-band",
  RangeBandSpec,
  SparklineData,
  NormalizedRangeBand
>;
