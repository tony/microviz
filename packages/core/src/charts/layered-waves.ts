import { a11yItemsForSegments, a11yLabelWithSegmentsSummary } from "../a11y";
import type { Mark } from "../model";
import type { ChartDefinition } from "./chart-definition";
import { coerceFiniteNonNegative, normalizeSegments } from "./shared";
import type {
  BitfieldData,
  LayeredWavesSpec,
  NormalizedLayeredWaves,
} from "./types";

export const layeredWavesChart = {
  a11y(_spec, normalized, _layout) {
    return {
      items: a11yItemsForSegments(normalized.segments, {
        idPrefix: "layered-waves-seg",

        labelFallback: "Segment",
      }),
      label: a11yLabelWithSegmentsSummary(
        "Layered waves chart",
        normalized.segments,
      ),
      role: "img",
    };
  },
  category: "bars" as const,
  defaultPad: 0,
  displayName: "Layered waves",
  emptyDataWarningMessage: "No segments data.",
  isEmpty(normalized) {
    return normalized.segments.length === 0;
  },
  marks(spec, normalized, layout, _state, _theme, warnings) {
    const { segments } = normalized;
    if (segments.length === 0) return [];

    const { width, height, pad } = layout;
    const usableW = Math.max(0, width - pad * 2);
    const usableH = Math.max(0, height - pad * 2);
    const x0 = pad;
    const y0 = pad;

    const waveOffset = coerceFiniteNonNegative(
      spec.waveOffset ?? 12,
      12,
      warnings,
      "Non-finite layered-waves waveOffset; defaulted to 12.",
    );

    const baseOpacity = coerceFiniteNonNegative(
      spec.baseOpacity ?? 0.6,
      0.6,
      warnings,
      "Non-finite layered-waves baseOpacity; defaulted to 0.6.",
    );

    const cornerRadius = coerceFiniteNonNegative(
      spec.cornerRadius ?? 8,
      8,
      warnings,
      "Non-finite layered-waves cornerRadius; defaulted to 8.",
    );

    const classSuffix = spec.className ? ` ${spec.className}` : "";

    // Create overlapping wave layers from back to front
    // Each wave starts further right, but widths reflect cumulative segment pct.
    const marks: Mark[] = [];
    const count = segments.length;
    const totalPct = segments.reduce((sum, s) => sum + s.pct, 0) || 1;
    const cumulativeFromEnd: number[] = [];
    let runningTotal = 0;
    for (let i = segments.length - 1; i >= 0; i--) {
      runningTotal += segments[i]?.pct ?? 0;
      cumulativeFromEnd[i] = runningTotal;
    }

    for (const [i, seg] of segments.entries()) {
      // Calculate offset for this wave (back waves start at 0, front waves offset right)
      const xOffset = i * waveOffset;
      const availableW = usableW - xOffset;
      if (availableW <= 0) continue;
      const cumPct = cumulativeFromEnd[i] ?? 0;
      const pctW = (cumPct / totalPct) * usableW;
      const waveW = Math.min(pctW, availableW);

      if (waveW <= 0) continue;

      // Opacity varies by layer (back = more transparent, front = more opaque)
      const layerOpacity =
        baseOpacity + ((1 - baseOpacity) * i) / Math.max(1, count - 1);

      const rx = Math.min(cornerRadius, waveW / 2, usableH / 2);
      const ry = rx;

      marks.push({
        className: `mv-layered-waves-wave${classSuffix}`,
        fill: seg.color,
        fillOpacity: layerOpacity,
        h: usableH,
        id: `layered-waves-wave-${i}`,
        rx,
        ry,
        type: "rect" as const,
        w: waveW,
        x: x0 + xOffset,
        y: y0,
      });
    }

    return marks;
  },
  normalize(_spec, data) {
    const segments = normalizeSegments(data);
    return { segments, type: "layered-waves" as const };
  },
  preferredAspectRatio: "wide" as const,
  type: "layered-waves",
} satisfies ChartDefinition<
  "layered-waves",
  LayeredWavesSpec,
  BitfieldData,
  NormalizedLayeredWaves
>;
