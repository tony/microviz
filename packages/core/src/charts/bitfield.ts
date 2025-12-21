import { a11yLabelWithSegmentsSummary } from "../a11y";
import type { Mark } from "../model";
import type { ChartDefinition } from "./chart-definition";
import {
  clamp,
  coerceFiniteInt,
  coerceFiniteNonNegative,
  normalizeSegments,
} from "./shared";
import type { BitfieldData, BitfieldSpec, NormalizedBitfield } from "./types";

export const bitfieldChart = {
  a11y(_spec, normalized, _layout) {
    return {
      label: a11yLabelWithSegmentsSummary(
        "Bitfield chart",
        normalized.segments,
      ),
      role: "img",
    };
  },
  category: "dots" as const,
  defaultPad: 0,
  displayName: "Bitfield",
  emptyDataWarningMessage: "No segments data.",
  isEmpty(normalized) {
    return normalized.segments.length === 0;
  },
  marks(spec, normalized, layout, _state, _theme, warnings) {
    const cellSize = coerceFiniteInt(
      spec.cellSize ?? 4,
      4,
      1,
      warnings,
      "Non-finite bitfield cell size; defaulted to 4.",
    );
    const dotRadius = coerceFiniteNonNegative(
      spec.dotRadius ?? 1.6,
      1.6,
      warnings,
      "Non-finite bitfield dot radius; defaulted to 1.6.",
    );

    const cols = Math.max(1, Math.floor(layout.width / cellSize));
    const rows = Math.max(1, Math.floor(layout.height / cellSize));

    const marks: Mark[] = [];
    const segments = normalized.segments;
    if (segments.length === 0) return marks;

    const cumulative: number[] = [];
    let acc = 0;
    for (const seg of segments) {
      acc += seg.pct;
      cumulative.push(acc);
    }

    function colorAtPct(pct: number): string {
      const t = clamp(pct, 0, 100);
      const idx = cumulative.findIndex((v) => t <= v);
      const fallback = segments[segments.length - 1];
      if (!fallback) return "currentColor";
      const segment = idx === -1 ? fallback : (segments[idx] ?? fallback);
      return segment.color;
    }

    let cellIndex = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cx = (c + 0.5) * cellSize;
        const cy = (r + 0.5) * cellSize;
        const pct = ((c + 0.5) / cols) * 100;
        marks.push({
          className: "mv-bitfield-dot",
          cx,
          cy,
          fill: colorAtPct(pct),
          id: `bitfield-dot-${cellIndex++}`,
          r: dotRadius,
          type: "circle",
        });
      }
    }

    return marks;
  },
  normalize(_spec, data) {
    const segments = normalizeSegments(data);
    return { segments, type: "bitfield" };
  },
  type: "bitfield",
} satisfies ChartDefinition<
  "bitfield",
  BitfieldSpec,
  BitfieldData,
  NormalizedBitfield
>;
