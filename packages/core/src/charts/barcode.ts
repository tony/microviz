import type { Mark } from "../model";
import { interleaveCounts } from "../utils/math";
import type { ChartDefinition } from "./chart-definition";
import {
  allocateUnitsByPct,
  coerceFiniteInt,
  coerceFiniteNonNegative,
  distributeTrackWidths,
  expandSegmentColors,
  isIntegerish,
  normalizeSegments,
} from "./shared";
import type { BarcodeSpec, BitfieldData, NormalizedBarcode } from "./types";

export const barcodeChart = {
  a11y(_spec, _normalized, _layout) {
    return { label: "Barcode chart", role: "img" };
  },
  category: "grids" as const,
  defaultPad: 0,
  displayName: "Barcode",
  emptyDataWarningMessage: "No segments data.",
  isEmpty(normalized) {
    return normalized.segments.length === 0;
  },
  marks(spec, normalized, layout, _state, _theme, warnings) {
    const bins = coerceFiniteInt(
      spec.bins ?? 48,
      48,
      1,
      warnings,
      "Non-finite barcode bins; defaulted to 48.",
    );

    const segments = normalized.segments;
    if (segments.length === 0) return [];

    const counts = allocateUnitsByPct(segments, bins);
    const useInterleave = spec.interleave === true;
    const interleaved = useInterleave ? interleaveCounts(counts) : null;
    const cells = useInterleave ? null : expandSegmentColors(segments, counts);

    function fillAt(i: number): string {
      if (useInterleave) {
        const segIdx =
          interleaved?.[i] ?? interleaved?.[interleaved.length - 1];
        const fallback = segments[segments.length - 1];
        const seg =
          segIdx === undefined ? fallback : (segments[segIdx] ?? fallback);
        return seg?.color ?? "currentColor";
      }

      const cell = cells?.[i] ?? cells?.[cells.length - 1];
      return cell?.color ?? "currentColor";
    }

    const usableW = Math.max(0, layout.width - layout.pad * 2);
    const usableH = Math.max(0, layout.height - layout.pad * 2);
    const gapRequested = coerceFiniteNonNegative(
      spec.gap ?? 1,
      1,
      warnings,
      "Non-finite barcode gap; defaulted to 1.",
    );
    const gap = bins <= 1 ? 0 : Math.min(gapRequested, usableW / (bins - 1));

    const x0 = layout.pad;
    const y0 = layout.pad;

    const classSuffix = spec.className ? ` ${spec.className}` : "";

    const canSnap =
      isIntegerish(x0) &&
      isIntegerish(y0) &&
      isIntegerish(usableW) &&
      isIntegerish(usableH) &&
      isIntegerish(gap);

    if (canSnap) {
      const x0Px = Math.round(x0);
      const y0Px = Math.round(y0);
      const usableWPx = Math.round(usableW);
      const usableHPx = Math.round(usableH);
      const gapPx = bins <= 1 ? 0 : Math.round(gap);
      const totalGapPx = gapPx * Math.max(0, bins - 1);
      const availableWPx = Math.max(0, usableWPx - totalGapPx);
      const widths = distributeTrackWidths(availableWPx, bins);

      let x = x0Px;
      return widths.map((w, i) => {
        const mark: Mark = {
          className: `mv-barcode-bin${classSuffix}`,
          fill: fillAt(i),
          h: usableHPx,
          id: `barcode-bin-${i}`,
          type: "rect",
          w,
          x,
          y: y0Px,
        };
        if (i < widths.length - 1) x += w + gapPx;
        return mark;
      });
    }

    const totalGap = gap * Math.max(0, bins - 1);
    const binW = Math.max(0, (usableW - totalGap) / bins);
    const xEnd = x0 + usableW;

    return Array.from({ length: bins }, (_, i) => {
      const x = x0 + i * (binW + gap);
      const w = i === bins - 1 ? xEnd - x : binW;
      return {
        className: `mv-barcode-bin${classSuffix}`,
        fill: fillAt(i),
        h: usableH,
        id: `barcode-bin-${i}`,
        type: "rect",
        w,
        x,
        y: y0,
      };
    });
  },
  normalize(_spec, data) {
    const segments = normalizeSegments(data);
    return { segments, type: "barcode" };
  },
  type: "barcode",
} satisfies ChartDefinition<
  "barcode",
  BarcodeSpec,
  BitfieldData,
  NormalizedBarcode
>;
