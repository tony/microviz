import type { Mark } from "../model";
import type { ChartDefinition } from "./chart-definition";
import {
  clamp,
  coerceFiniteInt,
  coerceFiniteNonNegative,
  isFiniteNumber,
  normalizedPct,
} from "./shared";
import type {
  DotMatrixData,
  DotMatrixSpec,
  NormalizedDotMatrix,
} from "./types";

export const dotMatrixChart = {
  a11y(_spec, _normalized, _layout) {
    return { label: "Dot matrix chart", role: "img" };
  },
  category: "dots" as const,
  defaultPad: 0,
  displayName: "Dot matrix",
  emptyDataWarningMessage: "No series data.",
  isEmpty(normalized) {
    return normalized.series.length === 0;
  },
  marks(spec, normalized, layout, _state, _theme, warnings) {
    const totalSeries = normalized.series.length;
    if (totalSeries === 0) return [];

    const colsRequested = coerceFiniteInt(
      spec.cols ?? 32,
      32,
      1,
      warnings,
      "Non-finite dot-matrix cols; defaulted to 32.",
    );
    const cols = Math.max(1, Math.min(totalSeries, colsRequested));

    const maxDots = coerceFiniteInt(
      spec.maxDots ?? 4,
      4,
      1,
      warnings,
      "Non-finite dot-matrix max dots; defaulted to 4.",
    );

    const start = Math.max(0, totalSeries - cols);
    const sampled = normalized.series.slice(start);
    const maxValue = Math.max(...sampled.map(normalizedPct), 1);

    const usableW = Math.max(0, layout.width - layout.pad * 2);
    const usableH = Math.max(0, layout.height - layout.pad * 2);
    const cellW = usableW / cols;
    const cellH = usableH / maxDots;

    const defaultDotRadius = Math.min(cellW, cellH) * 0.35;
    const dotRadius = coerceFiniteNonNegative(
      spec.dotRadius ?? defaultDotRadius,
      defaultDotRadius,
      warnings,
      "Non-finite dot-matrix dot radius; defaulted to auto.",
    );

    const classSuffix = spec.className ? ` ${spec.className}` : "";

    const marks: Mark[] = [];
    let dotIndex = 0;
    for (let i = 0; i < cols; i++) {
      const value = normalizedPct(sampled[i] ?? 0);
      const t = maxValue === 0 ? 0 : clamp(value / maxValue, 0, 1);
      const dots = Math.ceil(t * maxDots);

      const baseOpacity = 0.4 + t * 0.6;
      const fadeOpacity = normalized.opacities
        ? (normalized.opacities[start + i] ?? 1)
        : 1;
      const opacity = clamp(baseOpacity * fadeOpacity, 0, 1);

      const cx = layout.pad + (i + 0.5) * cellW;

      for (let j = 0; j < dots; j++) {
        const cy = layout.pad + usableH - (j + 0.5) * cellH;
        marks.push({
          className: `mv-dot-matrix-dot${classSuffix}`,
          cx,
          cy,
          fillOpacity: opacity,
          id: `dot-matrix-dot-${dotIndex++}`,
          r: dotRadius,
          type: "circle",
        });
      }
    }

    return marks;
  },
  normalize(_spec, data) {
    const series = data.series.filter(isFiniteNumber);
    const opacities = data.opacities?.filter(isFiniteNumber);
    return { opacities, series, type: "dot-matrix" };
  },
  type: "dot-matrix",
} satisfies ChartDefinition<
  "dot-matrix",
  DotMatrixSpec,
  DotMatrixData,
  NormalizedDotMatrix
>;
