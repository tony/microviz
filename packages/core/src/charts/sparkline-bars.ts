import { a11yLabelWithSeriesSummary } from "../a11y";
import type { ChartDefinition } from "./chart-definition";
import { coerceFiniteNonNegative, isFiniteNumber } from "./shared";
import type {
  NormalizedSparklineBars,
  SparklineBarsSpec,
  SparklineData,
} from "./types";

/**
 * Sparkline-bars chart: Vertical bars directly from series data.
 * One bar per data point with height based on min-max normalized value.
 * The bar chart equivalent of a sparkline.
 */
export const sparklineBarsChart = {
  a11y(_spec, normalized, _layout) {
    return {
      label: a11yLabelWithSeriesSummary(
        "Sparkline bars chart",
        normalized.series,
      ),
      role: "img",
    };
  },
  category: "bars" as const,
  defaultPad: 2,
  displayName: "Sparkline bars",
  emptyDataWarningMessage: "No series data.",
  isEmpty(normalized) {
    return normalized.series.length === 0;
  },
  marks(spec, normalized, layout, _state, _theme, warnings) {
    const { series, min, max } = normalized;
    if (series.length === 0) return [];

    const usableW = Math.max(0, layout.width - layout.pad * 2);
    const usableH = Math.max(0, layout.height - layout.pad * 2);

    const gap = coerceFiniteNonNegative(
      spec.gap ?? 1,
      1,
      warnings,
      "Non-finite sparkline-bars gap; defaulted to 1.",
    );

    const n = series.length;
    const totalGap = gap * Math.max(0, n - 1);
    const barW = n === 0 ? 0 : (usableW - totalGap) / n;
    if (barW <= 0) return [];

    const denom = max - min || 1;
    const classSuffix = spec.className ? ` ${spec.className}` : "";

    const x0 = layout.pad;
    const y0 = layout.pad;

    const colors = spec.colors;
    const fallbackColor =
      colors && colors.length > 0 ? colors[colors.length - 1] : undefined;

    const barRadius =
      spec.barRadius === undefined
        ? undefined
        : coerceFiniteNonNegative(
            spec.barRadius,
            0,
            warnings,
            "Non-finite sparkline-bars barRadius; defaulted to 0.",
          );

    return series.map((value, i) => {
      // Normalize value to 0-1 range, then scale to usable height
      // Ensure minimum height of 2px for visibility
      const normalizedValue = (value - min) / denom;
      const barH = Math.max(2, normalizedValue * usableH);
      const x = x0 + i * (barW + gap);
      const y = y0 + usableH - barH;

      return {
        className: `mv-sparkline-bars-bar${classSuffix}`,
        fill: colors ? (colors[i] ?? fallbackColor) : undefined,
        h: barH,
        id: `sparkline-bars-bar-${i}`,
        rx: barRadius,
        ry: barRadius,
        type: "rect" as const,
        w: barW,
        x,
        y,
      };
    });
  },
  normalize(_spec, data) {
    const series = data.filter(isFiniteNumber);
    const min = series.length > 0 ? Math.min(...series) : 0;
    const max = series.length > 0 ? Math.max(...series) : 1;
    return { max, min, series, type: "sparkline-bars" as const };
  },
  type: "sparkline-bars",
} satisfies ChartDefinition<
  "sparkline-bars",
  SparklineBarsSpec,
  SparklineData,
  NormalizedSparklineBars
>;
