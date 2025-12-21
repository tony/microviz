import { a11yItemsForSeries, a11yLabelWithSeriesSummary } from "../a11y";
import type { Def } from "../model";
import type { ChartDefinition } from "./chart-definition";
import {
  coerceFiniteInt,
  coerceFiniteNonNegative,
  isFiniteNumber,
  normalizedPct,
} from "./shared";
import type {
  HistogramData,
  HistogramSpec,
  NormalizedHistogram,
} from "./types";

export const histogramChart = {
  a11y(_spec, normalized, _layout) {
    return {
      items: a11yItemsForSeries(normalized.series, {
        idPrefix: "histogram-bin",
        labelPrefix: "Bin",
      }),
      label: a11yLabelWithSeriesSummary("Histogram chart", normalized.series),
      role: "img",
    };
  },
  category: "bars" as const,
  defaultPad: 3,
  defs(spec, normalized, _layout, warnings): Def[] {
    if (!spec.gradient) return [];
    if (normalized.series.length === 0) return [];

    const topOpacity = coerceFiniteNonNegative(
      spec.gradientTopOpacity ?? 0.35,
      0.35,
      warnings,
      "Non-finite histogram gradientTopOpacity; defaulted to 0.35.",
    );

    return [
      {
        id: "mv-histogram-gradient",
        stops: [
          { color: "var(--mv-series-1, currentColor)", offset: 0, opacity: 1 },
          {
            color: "var(--mv-series-1, currentColor)",
            offset: 1,
            opacity: topOpacity,
          },
        ],
        type: "linearGradient" as const,
        x1: 0,
        x2: 0,
        y1: 1,
        y2: 0,
      },
    ];
  },
  displayName: "Mini histogram",
  emptyDataWarningMessage: "No series data.",
  isEmpty(normalized) {
    return normalized.series.length === 0;
  },
  marks(spec, normalized, layout, _state, _theme, warnings) {
    const w = layout.width;
    const h = layout.height;
    const pad = layout.pad;
    const bins = coerceFiniteInt(
      spec.bins ?? 18,
      18,
      1,
      warnings,
      "Non-finite histogram bins; defaulted to 18.",
    );
    const stride = Math.max(1, Math.floor(normalized.series.length / bins));
    const sampled: Array<{ key: string; value: number; srcIdx: number }> = [];

    for (let i = 0; i < normalized.series.length; i += stride) {
      sampled.push({
        key: `bar-${i}`,
        srcIdx: i,
        value: normalizedPct(normalized.series[i] ?? 0),
      });
    }

    const n = sampled.length;
    if (n === 0) return [];

    const barRadius =
      spec.barRadius === undefined
        ? undefined
        : coerceFiniteNonNegative(
            spec.barRadius,
            0,
            warnings,
            "Non-finite histogram bar radius; defaulted to 0.",
          );

    const fill = spec.gradient ? "url(#mv-histogram-gradient)" : undefined;

    if (spec.gap === undefined) {
      const bw = (w - pad * 2) / n;
      return sampled.map((bar, i) => {
        const x = pad + i * bw + 0.4;
        const barH = (bar.value / 100) * (h - pad * 2);
        const y = h - pad - barH;
        const opacity = normalized.opacities
          ? (normalized.opacities[bar.srcIdx] ?? 1)
          : 0.85;
        return {
          className: `mv-histogram-bar${spec.className ? ` ${spec.className}` : ""}`,
          fill,
          fillOpacity: opacity,
          h: barH,
          id: `histogram-bar-${bar.srcIdx}`,
          rx: barRadius,
          ry: barRadius,
          type: "rect",
          w: Math.max(1, bw - 0.8),
          x,
          y,
        };
      });
    }

    const gap = coerceFiniteNonNegative(
      spec.gap,
      0,
      warnings,
      "Non-finite histogram gap; defaulted to 0.",
    );
    const usableW = Math.max(0, w - pad * 2);
    const totalGap = gap * Math.max(0, n - 1);
    const availableW = Math.max(0, usableW - totalGap);
    const barW = n > 0 ? availableW / n : 0;

    const x0 = pad;
    const xEnd = pad + usableW;
    return sampled.map((bar, i) => {
      const x = x0 + i * (barW + gap);
      const barWidth = i === n - 1 ? Math.max(0, xEnd - x) : barW;
      const barH = (bar.value / 100) * (h - pad * 2);
      const y = h - pad - barH;
      const opacity = normalized.opacities
        ? (normalized.opacities[bar.srcIdx] ?? 1)
        : 0.85;
      return {
        className: `mv-histogram-bar${spec.className ? ` ${spec.className}` : ""}`,
        fill,
        fillOpacity: opacity,
        h: barH,
        id: `histogram-bar-${bar.srcIdx}`,
        rx: barRadius,
        ry: barRadius,
        type: "rect",
        w: barWidth,
        x,
        y,
      };
    });
  },
  normalize(_spec, data) {
    const series = data.series.filter(isFiniteNumber);
    const opacities = data.opacities?.filter(isFiniteNumber);
    return { opacities, series, type: "histogram" };
  },
  type: "histogram",
} satisfies ChartDefinition<
  "histogram",
  HistogramSpec,
  HistogramData,
  NormalizedHistogram
>;
