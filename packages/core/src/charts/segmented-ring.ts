import type { Mark } from "../model";
import type { ChartDefinition } from "./chart-definition";
import { coerceFiniteNonNegative, normalizeSegments } from "./shared";
import type {
  BitfieldData,
  NormalizedSegmentedRing,
  SegmentedRingSpec,
} from "./types";

export const segmentedRingChart = {
  a11y(_spec, _normalized, _layout) {
    return { label: "Segmented ring chart", role: "img" };
  },
  category: "lines" as const,
  defaultPad: 2,
  displayName: "Segmented ring",
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

    // Radius fits in the smaller dimension
    const strokeWidth = coerceFiniteNonNegative(
      spec.strokeWidth ?? 3,
      3,
      warnings,
      "Non-finite segmented-ring strokeWidth; defaulted to 3.",
    );

    const maxRadius = Math.min(usableW, usableH) / 2 - strokeWidth / 2;
    if (maxRadius <= 0) return [];

    const gapSize = coerceFiniteNonNegative(
      spec.gapSize ?? 4,
      4,
      warnings,
      "Non-finite segmented-ring gapSize; defaulted to 4.",
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
        className: `mv-segmented-ring-seg${classSuffix}`,
        cx,
        cy,
        fill: "none",
        id: `segmented-ring-seg-${i}`,
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
    return { segments, type: "segmented-ring" as const };
  },
  preferredAspectRatio: "square" as const,
  type: "segmented-ring",
} satisfies ChartDefinition<
  "segmented-ring",
  SegmentedRingSpec,
  BitfieldData,
  NormalizedSegmentedRing
>;
