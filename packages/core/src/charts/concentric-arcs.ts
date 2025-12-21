import { a11yItemsForSegments, a11yLabelWithSegmentsSummary } from "../a11y";
import type { Mark } from "../model";
import type { ChartDefinition } from "./chart-definition";
import { coerceFiniteInt, coerceFiniteNonNegative } from "./shared";
import type {
  BitfieldData,
  ConcentricArcsSpec,
  NormalizedConcentricArcs,
} from "./types";

export const concentricArcsChart = {
  a11y(_spec, normalized, _layout) {
    return {
      items: a11yItemsForSegments(normalized.arcs, {
        idPrefix: "concentric-arcs-ring",
      }),
      label: a11yLabelWithSegmentsSummary(
        "Concentric arcs chart",
        normalized.arcs,
      ),
      role: "img",
    };
  },
  category: "lines" as const,
  defaultPad: 2,
  displayName: "Concentric arcs",
  emptyDataWarningMessage: "No arcs data.",
  isEmpty(normalized) {
    return normalized.arcs.length === 0;
  },
  marks(spec, normalized, layout, _state, _theme, warnings) {
    const { arcs } = normalized;
    if (arcs.length === 0) return [];

    const { width, height, pad } = layout;
    const usableW = Math.max(0, width - pad * 2);
    const usableH = Math.max(0, height - pad * 2);

    // Center of the chart
    const cx = pad + usableW / 2;
    const cy = pad + usableH / 2;

    // Maximum radius fits in the smaller dimension
    const maxRadius = Math.min(usableW, usableH) / 2;

    const ringCount = coerceFiniteInt(
      spec.rings ?? arcs.length,
      arcs.length,
      1,
      warnings,
      "Non-finite concentric-arcs rings; defaulted to arc count.",
    );

    const strokeWidth = coerceFiniteNonNegative(
      spec.strokeWidth ?? 3,
      3,
      warnings,
      "Non-finite concentric-arcs strokeWidth; defaulted to 3.",
    );

    const ringGap = coerceFiniteNonNegative(
      spec.ringGap ?? 2,
      2,
      warnings,
      "Non-finite concentric-arcs ringGap; defaulted to 2.",
    );

    // Calculate radius for each ring (outermost first)
    const ringStep = strokeWidth + ringGap;
    const innerMostRadius = maxRadius - (ringCount - 1) * ringStep;

    if (innerMostRadius < strokeWidth / 2) {
      // Not enough space for all rings
      return [];
    }

    const classSuffix = spec.className ? ` ${spec.className}` : "";
    const marks: Mark[] = [];

    for (let i = 0; i < ringCount; i++) {
      const arc = arcs[i % arcs.length];
      if (!arc) continue;

      // Radius increases from center outward
      const r = innerMostRadius + i * ringStep;
      const circumference = 2 * Math.PI * r;

      // Calculate dash based on percentage
      const pct = Math.max(0, Math.min(100, arc.pct));
      const dashLength = (pct / 100) * circumference;
      const gapLength = circumference - dashLength;

      marks.push({
        className: `mv-concentric-arcs-ring${classSuffix}`,
        cx,
        cy,
        fill: "none",
        id: `concentric-arcs-ring-${i}`,
        r,
        stroke: arc.color,
        // Dash pattern: visible arc, then gap
        strokeDasharray: `${dashLength.toFixed(2)} ${gapLength.toFixed(2)}`,
        // Rotate to start from top (12 o'clock position)
        strokeDashoffset: String(circumference * 0.25),
        strokeLinecap: "round",
        strokeWidth,
        type: "circle" as const,
      });
    }

    return marks;
  },
  normalize(_spec, data) {
    // Filter valid arcs and normalize
    const arcs = data
      .filter((s) => Number.isFinite(s.pct) && s.pct > 0 && s.color.length > 0)
      .map((s) => ({
        color: s.color,
        name: s.name,
        pct: Math.max(0, Math.min(100, s.pct)),
      }));
    return { arcs, type: "concentric-arcs" as const };
  },
  preferredAspectRatio: "square" as const,
  type: "concentric-arcs",
} satisfies ChartDefinition<
  "concentric-arcs",
  ConcentricArcsSpec,
  BitfieldData,
  NormalizedConcentricArcs
>;
