import { a11yItemsForSeries, a11yLabelWithSeriesSummary } from "../a11y";
import type { ChartDefinition } from "./chart-definition";
import {
  clamp,
  coerceFiniteNonNegative,
  isFiniteNumber,
  normalizedPct,
  sparkAreaGradientId,
} from "./shared";
import type {
  NormalizedSparkArea,
  SparkAreaSpec,
  SparklineData,
} from "./types";

export const sparkAreaChart = {
  a11y(_spec, normalized, _layout) {
    return {
      items: a11yItemsForSeries(normalized.series, {
        idPrefix: "spark-area-point",
        labelPrefix: "Point",
      }),
      label: a11yLabelWithSeriesSummary("Spark area chart", normalized.series),
      role: "img",
    };
  },
  category: "lines" as const,
  defaultPad: 3,
  defs(spec, normalized, _layout, warnings) {
    const topOpacity = clamp(
      coerceFiniteNonNegative(
        spec.gradientTopOpacity ?? 0.45,
        0.45,
        warnings,
        "Non-finite spark-area gradient top opacity; defaulted to 0.45.",
      ),
      0,
      1,
    );

    const gradId = sparkAreaGradientId(normalized.series);
    return [
      {
        id: gradId,
        stops: [
          {
            color: "var(--mv-series-1, currentColor)",
            offset: 0,
            opacity: topOpacity,
          },
          {
            color: "var(--mv-series-1, currentColor)",
            offset: 1,
            opacity: 0,
          },
        ],
        type: "linearGradient",
        x1: 0,
        x2: 0,
        y1: 0,
        y2: 1,
      },
    ];
  },
  displayName: "Spark Area",
  emptyDataWarningMessage: "No series data.",
  isEmpty(normalized) {
    return normalized.series.length === 0;
  },
  marks(spec, normalized, layout, _state, _theme, warnings) {
    const series = normalized.series;
    if (series.length === 0) return [];

    const strokeWidth = coerceFiniteNonNegative(
      spec.strokeWidth ?? 2,
      2,
      warnings,
      "Non-finite spark-area stroke width; defaulted to 2.",
    );
    const dotRadius = coerceFiniteNonNegative(
      spec.dotRadius ?? 2.2,
      2.2,
      warnings,
      "Non-finite spark-area dot radius; defaulted to 2.2.",
    );

    const x0 = layout.pad;
    const x1 = layout.width - layout.pad;
    const y0 = layout.pad;
    const y1 = layout.height - layout.pad;

    const dx = series.length > 1 ? (x1 - x0) / (series.length - 1) : x1 - x0;
    const ySpan = y1 - y0 || 1;

    const points = series.map((v, i) => {
      const pct = normalizedPct(v);
      return { x: x0 + dx * i, y: y1 - (pct / 100) * ySpan };
    });

    let lineD = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
    for (let i = 1; i < points.length; i++)
      lineD += ` L ${points[i].x.toFixed(2)} ${points[i].y.toFixed(2)}`;

    const last = points[points.length - 1];
    const gradId = sparkAreaGradientId(series);
    const areaD = `${lineD} L ${(last?.x ?? x1).toFixed(2)} ${y1.toFixed(2)} L ${points[0].x.toFixed(2)} ${y1.toFixed(2)} Z`;

    const classSuffix = spec.className ? ` ${spec.className}` : "";

    return [
      {
        className: `mv-spark-area-area${classSuffix}`,
        d: areaD,
        fill: `url(#${gradId})`,
        id: "spark-area-area",
        stroke: "none",
        type: "path",
      },
      {
        className: `mv-spark-area-line${classSuffix}`,
        d: lineD,
        fill: "none",
        id: "spark-area-line",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        strokeWidth,
        type: "path",
      },
      {
        className: `mv-spark-area-dot${classSuffix}`,
        cx: last?.x ?? x1,
        cy: last?.y ?? y1,
        id: "spark-area-dot",
        r: dotRadius,
        type: "circle",
      },
    ];
  },
  normalize(_spec, data) {
    const series = data.filter(isFiniteNumber);
    return { series, type: "spark-area" };
  },
  type: "spark-area",
} satisfies ChartDefinition<
  "spark-area",
  SparkAreaSpec,
  SparklineData,
  NormalizedSparkArea
>;
