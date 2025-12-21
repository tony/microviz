import { a11yLabelWithSegmentsSummary } from "../a11y";
import type { ChartDefinition } from "./chart-definition";
import {
  allocateUnitsByPct,
  coerceFiniteInt,
  coerceFiniteNonNegative,
  expandSegmentColors,
  normalizeSegments,
} from "./shared";
import type { BitfieldData, DotRowSpec, NormalizedDotRow } from "./types";

export const dotRowChart = {
  a11y(_spec, normalized, _layout) {
    return {
      label: a11yLabelWithSegmentsSummary("Dot row chart", normalized.segments),
      role: "img",
    };
  },
  category: "dots" as const,
  defaultPad: 0,
  displayName: "Dot row",
  emptyDataWarningMessage: "No segments data.",
  isEmpty(normalized) {
    return normalized.segments.length === 0;
  },
  marks(spec, normalized, layout, _state, _theme, warnings) {
    const dots = coerceFiniteInt(
      spec.dots ?? 12,
      12,
      1,
      warnings,
      "Non-finite dot-row dots; defaulted to 12.",
    );

    const segments = normalized.segments;
    if (segments.length === 0) return [];

    const counts = allocateUnitsByPct(segments, dots);
    const cells = expandSegmentColors(segments, counts);
    if (cells.length === 0) return [];

    const usableW = Math.max(0, layout.width - layout.pad * 2);
    const usableH = Math.max(0, layout.height - layout.pad * 2);
    const gapRequested = coerceFiniteNonNegative(
      spec.gap ?? 4,
      4,
      warnings,
      "Non-finite dot-row gap; defaulted to 4.",
    );
    const gap = dots <= 1 ? 0 : Math.min(gapRequested, usableW / (dots - 1));
    const availableW = Math.max(0, usableW - gap * Math.max(0, dots - 1));
    const maxDotDiameter = dots === 0 ? 0 : availableW / dots;

    const defaultRadius = Math.min(usableH, 12) / 2;
    const radiusRequested = coerceFiniteNonNegative(
      spec.dotRadius ?? defaultRadius,
      defaultRadius,
      warnings,
      "Non-finite dot-row dot radius; defaulted to auto.",
    );
    const dotRadius = Math.min(
      radiusRequested,
      usableH / 2,
      maxDotDiameter / 2,
    );

    const classSuffix = spec.className ? ` ${spec.className}` : "";
    const x0 = layout.pad;
    const cy = layout.pad + usableH / 2;
    const step = dotRadius * 2 + gap;

    return Array.from({ length: dots }, (_, i) => {
      const cell = cells[i] ?? cells[cells.length - 1];
      return {
        className: `mv-dot-row-dot${classSuffix}`,
        cx: x0 + dotRadius + i * step,
        cy,
        fill: cell?.color ?? "currentColor",
        id: `dot-row-dot-${i}`,
        r: dotRadius,
        type: "circle",
      };
    });
  },
  normalize(_spec, data) {
    const segments = normalizeSegments(data);
    return { segments, type: "dot-row" };
  },
  type: "dot-row",
} satisfies ChartDefinition<
  "dot-row",
  DotRowSpec,
  BitfieldData,
  NormalizedDotRow
>;
