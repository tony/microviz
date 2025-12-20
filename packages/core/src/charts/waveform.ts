import type { ChartDefinition } from "./chart-definition";
import {
  allocateUnitsByPct,
  coerceFiniteInt,
  coerceFiniteNonNegative,
  expandSegmentColors,
  normalizeSegments,
} from "./shared";
import type { BitfieldData, NormalizedWaveform, WaveformSpec } from "./types";

export const waveformChart = {
  a11y(_spec, _normalized, _layout) {
    return { label: "Waveform chart", role: "img" };
  },
  category: "bars" as const,
  defaultPad: 0,
  displayName: "Waveform",
  isEmpty(normalized) {
    return normalized.segments.length === 0;
  },
  marks(spec, normalized, layout, _state, _theme, warnings) {
    const bins = coerceFiniteInt(
      spec.bins ?? 24,
      24,
      1,
      warnings,
      "Non-finite waveform bins; defaulted to 24.",
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

    const x0 = layout.pad;
    const y0 = layout.pad;

    return Array.from({ length: bins }, (_, i) => {
      const cell = cells[i] ?? cells[cells.length - 1];
      const heightPct = Math.max(
        8,
        30 + Math.sin(i * 0.5) * 25 + Math.sin(i * 0.8) * 15,
      );
      const barH = (heightPct / 100) * usableH;
      const y = y0 + (usableH - barH) / 2;
      const x = x0 + i * (barW + gap);
      return {
        className: `mv-waveform-bar${classSuffix}`,
        fill: cell?.color ?? "currentColor",
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
    const segments = normalizeSegments(data);
    return { segments, type: "waveform" };
  },
  type: "waveform",
} satisfies ChartDefinition<
  "waveform",
  WaveformSpec,
  BitfieldData,
  NormalizedWaveform
>;
