import type { Mark } from "../model";
import type { ChartDefinition } from "./chart-definition";
import { coerceFiniteNonNegative, isFiniteNumber } from "./shared";
import type { NormalizedStepLine, SparklineData, StepLineSpec } from "./types";

/**
 * Generate step-interpolated path data for a series.
 * Uses horizontal-then-vertical (step-after) interpolation.
 */
function stepLineSeries(
  series: readonly number[],
  w: number,
  h: number,
  pad: number,
): { d: string; last: { x: number; y: number } | null } {
  if (series.length === 0) return { d: "", last: null };

  const x0 = pad;
  const x1 = w - pad;
  const y0 = pad;
  const y1 = h - pad;

  const min = Math.min(...series);
  const max = Math.max(...series);
  const denom = max - min || 1;

  const dx = series.length > 1 ? (x1 - x0) / (series.length - 1) : 0;
  const points = series.map((v, i) => ({
    x: x0 + dx * i,
    y: y1 - ((v - min) / denom) * (y1 - y0),
  }));

  // Start at the first point
  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

  // For each subsequent point, do horizontal-then-vertical (step-after)
  for (let i = 1; i < points.length; i++) {
    const curr = points[i];
    // Horizontal line to the new x at the old y level
    d += ` H ${curr.x.toFixed(2)}`;
    // Vertical line down/up to the new y level
    d += ` V ${curr.y.toFixed(2)}`;
  }

  return { d, last: points[points.length - 1] ?? null };
}

export const stepLineChart = {
  a11y(_spec, _normalized, _layout) {
    return { label: "Step line chart", role: "img" };
  },
  category: "lines" as const,
  defaultPad: 3,
  displayName: "Step Line",
  emptyDataWarningMessage: "No series data.",
  isEmpty(normalized) {
    return normalized.series.length === 0;
  },
  marks(spec, normalized, layout, _state, _theme, warnings) {
    if (normalized.series.length === 0) return [];

    const { d, last } = stepLineSeries(
      normalized.series,
      layout.width,
      layout.height,
      layout.pad,
    );

    const marks: Mark[] = [
      {
        className: `mv-line${spec.className ? ` ${spec.className}` : ""}`,
        d,
        id: "step-line-path",
        strokeLinecap: "square",
        strokeLinejoin: "miter",
        type: "path",
      },
    ];

    const showDot = spec.showDot ?? true;
    if (showDot && last) {
      const r = spec.dotRadius ?? 2.4;
      const dotRadius = coerceFiniteNonNegative(
        r,
        2.4,
        warnings,
        "Non-finite dot radius; defaulted to 2.4.",
      );
      marks.push({
        className: "mv-step-line-dot",
        cx: last.x,
        cy: last.y,
        id: "step-line-dot",
        r: dotRadius,
        type: "circle",
      });
    }

    return marks;
  },
  normalize(_spec, data) {
    const series = data.filter(isFiniteNumber);
    const min = series.length > 0 ? Math.min(...series) : 0;
    const max = series.length > 0 ? Math.max(...series) : 1;
    return { max, min, series, type: "step-line" as const };
  },
  type: "step-line",
} satisfies ChartDefinition<
  "step-line",
  StepLineSpec,
  SparklineData,
  NormalizedStepLine
>;
