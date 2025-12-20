import { a11yLabelWithSegmentsSummary } from "../a11y";
import type { Mark } from "../model";
import { interleaveCounts } from "../utils/math";
import type { ChartDefinition } from "./chart-definition";
import {
  allocateUnitsByPct,
  coerceFiniteInt,
  coerceFiniteNonNegative,
  normalizeSegments,
} from "./shared";
import type {
  BitfieldData,
  CodeMinimapSpec,
  NormalizedCodeMinimap,
} from "./types";

const DEFAULT_WIDTH_PATTERN = [28, 20, 30, 16, 24, 28, 12, 22] as const;

export const codeMinimapChart = {
  a11y(_spec, normalized, _layout) {
    return {
      label: a11yLabelWithSegmentsSummary(
        "Code minimap chart",
        normalized.segments,
      ),
      role: "img",
    };
  },
  category: "bars" as const,
  defaultPad: 0,
  displayName: "Code minimap",
  emptyDataWarningMessage: "No segments data.",
  isEmpty(normalized) {
    return normalized.segments.length === 0;
  },
  marks(spec, normalized, layout, _state, _theme, warnings) {
    const segments = normalized.segments;
    if (segments.length === 0) return [];

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

    const counts = allocateUnitsByPct(segments, lines);
    const order = interleaveCounts(counts);

    const widthPattern =
      spec.widthPattern && spec.widthPattern.length > 0
        ? spec.widthPattern
        : DEFAULT_WIDTH_PATTERN;
    const maxToken = Math.max(...widthPattern.map((w) => Math.max(0, w)), 0);
    const scale = maxToken === 0 ? 0 : availableW / maxToken;

    const classSuffix = spec.className ? ` ${spec.className}` : "";

    const marks: Mark[] = [];
    for (let i = 0; i < lines; i++) {
      const segIdx = order[i];
      const segment =
        segIdx === undefined ? segments[segments.length - 1] : segments[segIdx];
      if (!segment) continue;

      const token = widthPattern[i % widthPattern.length] ?? 0;
      const w = Math.max(0, Math.min(availableW, Math.max(0, token) * scale));
      const y = y0 + i * (lineHeight + gapY);

      marks.push({
        className: `mv-code-minimap-line${classSuffix}`,
        fill: segment.color,
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
    const segments = normalizeSegments(data);
    return { segments, type: "code-minimap" as const };
  },
  preferredAspectRatio: "square" as const,
  type: "code-minimap",
} satisfies ChartDefinition<
  "code-minimap",
  CodeMinimapSpec,
  BitfieldData,
  NormalizedCodeMinimap
>;
