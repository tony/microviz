import { a11yItemsForSeries, a11yLabelWithSeriesSummary } from "../a11y";
import type { Mark } from "../model";
import type { ChartDefinition } from "./chart-definition";
import {
  coerceFiniteNonNegative,
  isFiniteNumber,
  sparklineSeries,
} from "./shared";
import type {
  NormalizedSparkline,
  SparklineData,
  SparklineSpec,
} from "./types";

export const sparklineChart = {
  a11y(_spec, normalized, _layout) {
    return {
      items: a11yItemsForSeries(normalized.series, {
        idPrefix: "sparkline-point",
        labelPrefix: "Point",
      }),
      label: a11yLabelWithSeriesSummary("Sparkline chart", normalized.series),
      role: "img",
    };
  },
  category: "lines" as const,
  defaultPad: 3,
  displayName: "Sparkline",
  emptyDataHint: "Provide an array of numbers",
  emptyDataWarningMessage: "No series data.",
  exampleHtml:
    '<microviz-sparkline data="[10, 25, 15, 30, 20]"></microviz-sparkline>',
  isEmpty(normalized) {
    return normalized.series.length === 0;
  },
  marks(spec, normalized, layout, _state, _theme, warnings) {
    const { last, points } = sparklineSeries(
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
        id: `sparkline-line-${i - 1}`,
        strokeLinecap: "round",
        type: "line",
        x1: prev.x,
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
        className: "mv-sparkline-dot",
        cx: last.x,
        cy: last.y,
        id: "sparkline-dot",
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
    return { max, min, series, type: "sparkline" };
  },
  preferredAspectRatio: "wide" as const,
  type: "sparkline",
} satisfies ChartDefinition<
  "sparkline",
  SparklineSpec,
  SparklineData,
  NormalizedSparkline
>;
