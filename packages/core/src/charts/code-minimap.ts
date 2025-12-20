import { a11yLabelWithSeriesSummary } from "../a11y";
import type { Mark } from "../model";
import type { ChartDefinition } from "./chart-definition";
import {
  clamp,
  coerceFiniteInt,
  coerceFiniteNonNegative,
  isFiniteNumber,
  resampleSeries,
} from "./shared";
import type {
  CodeMinimapSpec,
  NormalizedCodeMinimap,
  SparklineData,
} from "./types";

const DEFAULT_WIDTH_PATTERN = [28, 20, 30, 16, 24, 28, 12, 22] as const;

export const codeMinimapChart = {
  a11y(_spec, normalized, _layout) {
    return {
      label: a11yLabelWithSeriesSummary(
        "Code minimap chart",
        normalized.series,
      ),
      role: "img",
    };
  },
  category: "bars" as const,
  defaultPad: 0,
  displayName: "Code minimap",
  emptyDataWarningMessage: "No series data.",
  isEmpty(normalized) {
    return normalized.series.length === 0;
  },
  marks(spec, normalized, layout, _state, _theme, warnings) {
    const series = normalized.series;
    if (series.length === 0) return [];

    const linesRequested = coerceFiniteInt(
      spec.lines ?? 8,
      8,
      1,
      warnings,
      "Non-finite code-minimap lines; defaulted to 8.",
    );
    const lineHeight = coerceFiniteNonNegative(
      spec.lineHeight ?? 2,
      2,
      warnings,
      "Non-finite code-minimap lineHeight; defaulted to 2.",
    );
    const gapY = coerceFiniteNonNegative(
      spec.gapY ?? 2,
      2,
      warnings,
      "Non-finite code-minimap gapY; defaulted to 2.",
    );
    const insetX = coerceFiniteNonNegative(
      spec.insetX ?? 2,
      2,
      warnings,
      "Non-finite code-minimap insetX; defaulted to 2.",
    );
    const insetY = coerceFiniteNonNegative(
      spec.insetY ?? 1,
      1,
      warnings,
      "Non-finite code-minimap insetY; defaulted to 1.",
    );
    const lineRadius = coerceFiniteNonNegative(
      spec.lineRadius ?? 1,
      1,
      warnings,
      "Non-finite code-minimap lineRadius; defaulted to 1.",
    );

    const usableW = Math.max(0, layout.width - layout.pad * 2);
    const usableH = Math.max(0, layout.height - layout.pad * 2);

    const x0 = layout.pad + insetX;
    const y0 = layout.pad + insetY;

    const availableW = Math.max(0, usableW - insetX);
    const availableH = Math.max(0, usableH - insetY);

    const maxLinesByHeight =
      lineHeight + gapY <= 0
        ? 0
        : Math.max(0, Math.floor((availableH + gapY) / (lineHeight + gapY)));
    const lines = Math.min(linesRequested, maxLinesByHeight);
    if (lines <= 0) return [];

    const values = resampleSeries(series, lines);
    const denom = normalized.max - normalized.min || 1;

    const widthPattern =
      spec.widthPattern && spec.widthPattern.length > 0
        ? spec.widthPattern
        : DEFAULT_WIDTH_PATTERN;
    const maxToken = Math.max(...widthPattern.map((w) => Math.max(0, w)), 0);
    const scale = maxToken === 0 ? 0 : 1 / maxToken;

    const classSuffix = spec.className ? ` ${spec.className}` : "";
    const colors = spec.colors;
    const fallbackColor = colors?.[colors.length - 1];

    const marks: Mark[] = [];
    for (let i = 0; i < lines; i++) {
      const value = values[i];
      const normalizedValue =
        value === undefined
          ? 0
          : clamp((value - normalized.min) / denom, 0, 1);

      const token = widthPattern[i % widthPattern.length] ?? 0;
      const patternScale = clamp(Math.max(0, token) * scale, 0, 1);
      const combinedScale = clamp(
        normalizedValue * 0.75 + patternScale * 0.25,
        0,
        1,
      );
      const baseW = combinedScale * availableW;
      const w =
        availableW <= 0 ? 0 : Math.max(1, Math.min(availableW, baseW));
      const y = y0 + i * (lineHeight + gapY);

      marks.push({
        className: `mv-code-minimap-line${classSuffix}`,
        fill: colors ? (colors[i] ?? fallbackColor) : undefined,
        h: lineHeight,
        id: `code-minimap-line-${i}`,
        rx: lineRadius,
        ry: lineRadius,
        type: "rect",
        w,
        x: x0,
        y,
      });
    }

    return marks;
  },
  normalize(_spec, data) {
    const series = data.filter(isFiniteNumber);
    const min = series.length > 0 ? Math.min(...series) : 0;
    const max = series.length > 0 ? Math.max(...series) : 1;
    return { max, min, series, type: "code-minimap" as const };
  },
  preferredAspectRatio: "square" as const,
  type: "code-minimap",
} satisfies ChartDefinition<
  "code-minimap",
  CodeMinimapSpec,
  SparklineData,
  NormalizedCodeMinimap
>;
