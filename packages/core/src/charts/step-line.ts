import { a11yLabelWithSeriesSummary } from "../a11y";
import type { Mark } from "../model";
import type { ChartDefinition } from "./chart-definition";
import { coerceFiniteNonNegative, isFiniteNumber } from "./shared";
import type { NormalizedStepLine, SparklineData, StepLineSpec } from "./types";

function stepLinePoints(
  series: readonly number[],
  w: number,
  h: number,
  pad: number,
): {
  last: { x: number; y: number } | null;
  points: { x: number; y: number }[];
} {
  if (series.length === 0) return { last: null, points: [] };

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
  return { last: points[points.length - 1] ?? null, points };
}

export const stepLineChart = {
  a11y(_spec, normalized, _layout) {
    return {
      label: a11yLabelWithSeriesSummary("Step line chart", normalized.series),
      role: "img",
    };
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

    const { last, points } = stepLinePoints(
      normalized.series,
      layout.width,
      layout.height,
      layout.pad,
    );

    const className = `mv-line${spec.className ? ` ${spec.className}` : ""}`;
    const marks: Mark[] = [];
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      marks.push({
        className,
        id: `step-line-h-${i - 1}`,
        strokeLinecap: "square",
        strokeLinejoin: "miter",
        type: "line",
        x1: prev.x,
        x2: curr.x,
        y1: prev.y,
        y2: prev.y,
      });
      marks.push({
        className,
        id: `step-line-v-${i - 1}`,
        strokeLinecap: "square",
        strokeLinejoin: "miter",
        type: "line",
        x1: curr.x,
        x2: curr.x,
        y1: prev.y,
        y2: curr.y,
      });
    }

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
