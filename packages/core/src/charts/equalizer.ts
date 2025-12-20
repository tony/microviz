import type { ChartDefinition } from "./chart-definition";
import {
  allocateUnitsByPct,
  coerceFiniteInt,
  coerceFiniteNonNegative,
  expandSegmentColors,
  normalizeSegments,
} from "./shared";
import type { BitfieldData, EqualizerSpec, NormalizedEqualizer } from "./types";

/**
 * Equalizer chart: Vertical bars that grow from the bottom (audio visualizer style).
 * Unlike waveform which centers bars vertically, equalizer bars are anchored at the bottom.
 */
export const equalizerChart = {
  a11y(_spec, _normalized, _layout) {
    return { label: "Equalizer chart", role: "img" };
  },
  category: "bars" as const,
  defaultPad: 0,
  displayName: "Equalizer",
  emptyDataWarningMessage: "No segments data.",
  isEmpty(normalized) {
    return normalized.segments.length === 0;
  },
  marks(spec, normalized, layout, _state, _theme, warnings) {
    const bins = coerceFiniteInt(
      spec.bins ?? 16,
      16,
      1,
      warnings,
      "Non-finite equalizer bins; defaulted to 16.",
    );

    const segments = normalized.segments;
    if (segments.length === 0) return [];

    const counts = allocateUnitsByPct(segments, bins);
    const cells = expandSegmentColors(segments, counts);
    if (cells.length === 0) return [];

    const usableW = Math.max(0, layout.width - layout.pad * 2);
    const usableH = Math.max(0, layout.height - layout.pad * 2);

    const gap = coerceFiniteNonNegative(
      spec.gap ?? 1,
      1,
      warnings,
      "Non-finite equalizer gap; defaulted to 1.",
    );
    const barWidthRequested = coerceFiniteNonNegative(
      spec.barWidth ?? 4,
      4,
      warnings,
      "Non-finite equalizer bar width; defaulted to 4.",
    );

    const totalGap = gap * Math.max(0, bins - 1);
    const maxBarWidth = bins === 0 ? 0 : (usableW - totalGap) / bins;
    const barW = Math.max(0, Math.min(barWidthRequested, maxBarWidth));
    if (barW <= 0) return [];

    const classSuffix = spec.className ? ` ${spec.className}` : "";

    const x0 = layout.pad;
    const y0 = layout.pad;

    return Array.from({ length: bins }, (_, i) => {
      const cell = cells[i] ?? cells[cells.length - 1];
      // Height varies based on position - creates audio visualizer effect
      const heightPct = Math.max(
        15,
        40 + Math.sin(i * 0.6) * 30 + Math.sin(i * 1.1) * 20,
      );
      const barH = (heightPct / 100) * usableH;
      // Bars grow from bottom (key difference from waveform)
      const y = y0 + usableH - barH;
      const x = x0 + i * (barW + gap);
      return {
        className: `mv-equalizer-bar${classSuffix}`,
        fill: cell?.color ?? "currentColor",
        h: barH,
        id: `equalizer-bar-${i}`,
        type: "rect",
        w: barW,
        x,
        y,
      };
    });
  },
  normalize(_spec, data) {
    const segments = normalizeSegments(data);
    return { segments, type: "equalizer" as const };
  },
  type: "equalizer",
} satisfies ChartDefinition<
  "equalizer",
  EqualizerSpec,
  BitfieldData,
  NormalizedEqualizer
>;
