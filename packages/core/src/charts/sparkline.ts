import { a11yLabelWithSeriesSummary } from "../a11y";
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
      label: a11yLabelWithSeriesSummary("Sparkline chart", normalized.series),
      role: "img",
    };
  },
  category: "lines" as const,
  defaultPad: 3,
  displayName: "Sparkline",
  emptyDataWarningMessage: "No series data.",
  isEmpty(normalized) {
    return normalized.series.length === 0;
  },
  marks(spec, normalized, layout, _state, _theme, warnings) {
    const { d, last } = sparklineSeries(
      normalized.series,
      layout.width,
      layout.height,
      layout.pad,
    );

    const marks: Mark[] = [
      {
        className: `mv-line${spec.className ? ` ${spec.className}` : ""}`,
        d,
        id: "sparkline-line",
        strokeLinecap: "round",
        strokeLinejoin: "round",
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
  type: "sparkline",
} satisfies ChartDefinition<
  "sparkline",
  SparklineSpec,
  SparklineData,
  NormalizedSparkline
>;
