import { a11yLabelWithSegmentsSummary } from "../a11y";
import type { ChartDefinition } from "./chart-definition";
import { coerceFiniteNonNegative, normalizeSegments } from "./shared";
import type { BitfieldData, DonutSpec, NormalizedDonut } from "./types";

/**
 * Donut chart: Pie chart with a hole in the center.
 * Each segment is a filled arc wedge.
 */
export const donutChart = {
  a11y(_spec, normalized, _layout) {
    return {
      label: a11yLabelWithSegmentsSummary("Donut chart", normalized.segments),
      role: "img",
    };
  },
  category: "lines" as const,
  defaultPad: 2,
  displayName: "Donut",
  emptyDataWarningMessage: "No segments data.",
  isEmpty(normalized) {
    return normalized.segments.length === 0;
  },
  marks(spec, normalized, layout, _state, _theme, warnings) {
    const segments = normalized.segments;
    if (segments.length === 0) return [];

    const usableW = Math.max(0, layout.width - layout.pad * 2);
    const usableH = Math.max(0, layout.height - layout.pad * 2);

    const cx = layout.pad + usableW / 2;
    const cy = layout.pad + usableH / 2;
    const outerRadius = Math.min(usableW, usableH) / 2;

    // Inner radius as proportion of outer radius (default 0.5 = 50% hole)
    const innerRadiusPct = coerceFiniteNonNegative(
      spec.innerRadius ?? 0.5,
      0.5,
      warnings,
      "Non-finite donut inner radius; defaulted to 0.5.",
    );
    const innerRadius =
      outerRadius * Math.max(0, Math.min(0.95, innerRadiusPct));

    if (outerRadius <= 0) return [];

    const classSuffix = spec.className ? ` ${spec.className}` : "";

    // Calculate total percentage
    const totalPct = segments.reduce((sum, s) => sum + s.pct, 0);
    if (totalPct <= 0) return [];

    let startAngle = -Math.PI / 2; // Start from top (12 o'clock)

    return segments.map((segment, i) => {
      const sweepAngle = (segment.pct / totalPct) * Math.PI * 2;
      const endAngle = startAngle + sweepAngle;

      // Generate arc path for this segment
      const d = createArcPath(
        cx,
        cy,
        outerRadius,
        innerRadius,
        startAngle,
        endAngle,
      );

      startAngle = endAngle;

      return {
        className: `mv-donut-segment${classSuffix}`,
        d,
        fill: segment.color ?? "currentColor",
        id: `donut-segment-${i}`,
        type: "path" as const,
      };
    });
  },
  normalize(_spec, data) {
    const segments = normalizeSegments(data);
    return { segments, type: "donut" as const };
  },
  preferredAspectRatio: "square" as const,
  type: "donut",
} satisfies ChartDefinition<"donut", DonutSpec, BitfieldData, NormalizedDonut>;

/**
 * Creates an SVG path for a donut segment (arc wedge with inner hole).
 */
function createArcPath(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number,
): string {
  // Handle full circle case (or nearly full)
  const isFullCircle = Math.abs(endAngle - startAngle) >= Math.PI * 2 - 0.001;

  if (isFullCircle) {
    // For full circle, draw two half-arcs (SVG can't draw a single arc for 360°)
    const midAngle = startAngle + Math.PI;
    return (
      createHalfArcPath(cx, cy, outerR, innerR, startAngle, midAngle) +
      " " +
      createHalfArcPath(cx, cy, outerR, innerR, midAngle, endAngle)
    );
  }

  // Calculate start and end points
  const outerStart = polarToCartesian(cx, cy, outerR, startAngle);
  const outerEnd = polarToCartesian(cx, cy, outerR, endAngle);
  const innerStart = polarToCartesian(cx, cy, innerR, startAngle);
  const innerEnd = polarToCartesian(cx, cy, innerR, endAngle);

  // Large arc flag: 1 if arc spans > 180 degrees
  const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;

  // Path: outer arc -> line to inner -> inner arc (reversed) -> close
  return [
    `M ${outerStart.x.toFixed(2)} ${outerStart.y.toFixed(2)}`,
    `A ${outerR.toFixed(2)} ${outerR.toFixed(2)} 0 ${largeArcFlag} 1 ${outerEnd.x.toFixed(2)} ${outerEnd.y.toFixed(2)}`,
    `L ${innerEnd.x.toFixed(2)} ${innerEnd.y.toFixed(2)}`,
    `A ${innerR.toFixed(2)} ${innerR.toFixed(2)} 0 ${largeArcFlag} 0 ${innerStart.x.toFixed(2)} ${innerStart.y.toFixed(2)}`,
    "Z",
  ].join(" ");
}

/**
 * Creates half of a full-circle arc path (used when drawing 100% segments).
 */
function createHalfArcPath(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number,
): string {
  const outerStart = polarToCartesian(cx, cy, outerR, startAngle);
  const outerEnd = polarToCartesian(cx, cy, outerR, endAngle);
  const innerStart = polarToCartesian(cx, cy, innerR, startAngle);
  const innerEnd = polarToCartesian(cx, cy, innerR, endAngle);

  return [
    `M ${outerStart.x.toFixed(2)} ${outerStart.y.toFixed(2)}`,
    `A ${outerR.toFixed(2)} ${outerR.toFixed(2)} 0 0 1 ${outerEnd.x.toFixed(2)} ${outerEnd.y.toFixed(2)}`,
    `L ${innerEnd.x.toFixed(2)} ${innerEnd.y.toFixed(2)}`,
    `A ${innerR.toFixed(2)} ${innerR.toFixed(2)} 0 0 0 ${innerStart.x.toFixed(2)} ${innerStart.y.toFixed(2)}`,
    "Z",
  ].join(" ");
}

function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angle: number,
): { x: number; y: number } {
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  };
}
