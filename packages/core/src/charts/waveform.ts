import { a11yLabelWithSeriesSummary } from "../a11y";
import type { ChartDefinition } from "./chart-definition";
import {
  clamp,
  coerceFiniteInt,
  coerceFiniteNonNegative,
  isFiniteNumber,
  resampleSeries,
} from "./shared";
import type { NormalizedWaveform, SparklineData, WaveformSpec } from "./types";

export const waveformChart = {
  a11y(_spec, normalized, _layout) {
    return {
      label: a11yLabelWithSeriesSummary("Waveform chart", normalized.series),
      role: "img",
    };
  },
  category: "bars" as const,
  defaultPad: 0,
  displayName: "Waveform",
  emptyDataWarningMessage: "No series data.",
  isEmpty(normalized) {
    return normalized.series.length === 0;
  },
  marks(spec, normalized, layout, _state, _theme, warnings) {
    const bins = coerceFiniteInt(
      spec.bins ?? normalized.series.length,
      normalized.series.length,
      1,
      warnings,
      "Non-finite waveform bins; defaulted to 24.",
    );

    const series = normalized.series;
    if (series.length === 0) return [];

    const values = resampleSeries(series, bins);
    if (values.length === 0) return [];

    const usableW = Math.max(0, layout.width - layout.pad * 2);
    const usableH = Math.max(0, layout.height - layout.pad * 2);

    const gap = coerceFiniteNonNegative(
      spec.gap ?? 1,
      1,
      warnings,
      "Non-finite waveform gap; defaulted to 1.",
    );
    const barWidthRequested = coerceFiniteNonNegative(
      spec.barWidth ?? 6,
      6,
      warnings,
      "Non-finite waveform bar width; defaulted to 6.",
    );

    const totalGap = gap * Math.max(0, bins - 1);
    const maxBarWidth = bins === 0 ? 0 : (usableW - totalGap) / bins;
    const barW = Math.max(0, Math.min(barWidthRequested, maxBarWidth));
    if (barW <= 0) return [];

    const classSuffix = spec.className ? ` ${spec.className}` : "";
    const denom = normalized.max - normalized.min || 1;
    const colors = spec.colors;
    const fallbackColor = colors?.[colors.length - 1];

    const x0 = layout.pad;
    const y0 = layout.pad;

    return values.map((value, i) => {
      const normalizedValue = clamp((value - normalized.min) / denom, 0, 1);
      const barH = Math.max(2, normalizedValue * usableH);
      const y = y0 + (usableH - barH) / 2;
      const x = x0 + i * (barW + gap);
      return {
        className: `mv-waveform-bar${classSuffix}`,
        fill: colors ? (colors[i] ?? fallbackColor) : undefined,
        h: barH,
        id: `waveform-bar-${i}`,
        type: "rect",
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
    return { max, min, series, type: "waveform" };
  },
  preferredAspectRatio: "wide" as const,
  type: "waveform",
} satisfies ChartDefinition<
  "waveform",
  WaveformSpec,
  SparklineData,
  NormalizedWaveform
>;
