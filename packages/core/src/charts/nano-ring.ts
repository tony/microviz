import { a11yLabelWithSegmentsSummary } from "../a11y";
import type { Mark } from "../model";
import type { ChartDefinition } from "./chart-definition";
import { coerceFiniteNonNegative, normalizeSegments } from "./shared";
import type { BitfieldData, NanoRingSpec, NormalizedNanoRing } from "./types";

/**
 * Nano-ring chart: A compact version of segmented-ring optimized for small viewports.
 * Uses thinner strokes and smaller gaps for 16x16 to 32x32 displays.
 */
export const nanoRingChart = {
  a11y(_spec, normalized, _layout) {
    return {
      label: a11yLabelWithSegmentsSummary(
        "Nano ring chart",
        normalized.segments,
      ),
      role: "img",
    };
  },
  category: "lines" as const,
  defaultPad: 1,
  displayName: "Nano ring",
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

    // Center of the chart
    const cx = pad + usableW / 2;
    const cy = pad + usableH / 2;

    // Smaller stroke for compact display
    const strokeWidth = coerceFiniteNonNegative(
      spec.strokeWidth ?? 2,
      2,
      warnings,
      "Non-finite nano-ring strokeWidth; defaulted to 2.",
    );

    const maxRadius = Math.min(usableW, usableH) / 2 - strokeWidth / 2;
    if (maxRadius <= 0) return [];

    // Smaller gap for compact display
    const gapSize = coerceFiniteNonNegative(
      spec.gapSize ?? 2,
      2,
      warnings,
      "Non-finite nano-ring gapSize; defaulted to 2.",
    );

    const circumference = 2 * Math.PI * maxRadius;
    const totalGap = gapSize * segments.length;
    const usableCircumference = Math.max(0, circumference - totalGap);

    // Normalize percentages to ensure they sum to 100
    const totalPct = segments.reduce((sum, s) => sum + s.pct, 0);
    const normalizedSegments =
      totalPct > 0
        ? segments.map((s) => ({ ...s, pct: (s.pct / totalPct) * 100 }))
        : segments;

    const classSuffix = spec.className ? ` ${spec.className}` : "";
    const marks: Mark[] = [];

    let offset = 0;
    for (let i = 0; i < normalizedSegments.length; i++) {
      const seg = normalizedSegments[i];
      if (!seg) continue;

      const pct = Math.max(0, Math.min(100, seg.pct));
      const segmentLength = (pct / 100) * usableCircumference;

      if (segmentLength <= 0) {
        offset += gapSize;
        continue;
      }

      marks.push({
        className: `mv-nano-ring-seg${classSuffix}`,
        cx,
        cy,
        fill: "none",
        id: `nano-ring-seg-${i}`,
        r: maxRadius,
        stroke: seg.color,
        // Dash pattern: segment length, then rest of circumference
        strokeDasharray: `${segmentLength.toFixed(2)} ${circumference.toFixed(2)}`,
        // Offset to position segment correctly, starting from top (12 o'clock)
        strokeDashoffset: String(circumference * 0.25 - offset),
        strokeLinecap: "round",
        strokeWidth,
        type: "circle" as const,
      });

      offset += segmentLength + gapSize;
    }

    return marks;
  },
  normalize(_spec, data) {
    const segments = normalizeSegments(data);
    return { segments, type: "nano-ring" as const };
  },
  preferredAspectRatio: "square" as const,
  type: "nano-ring",
} satisfies ChartDefinition<
  "nano-ring",
  NanoRingSpec,
  BitfieldData,
  NormalizedNanoRing
>;
