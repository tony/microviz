import { a11yLabelWithSegmentsSummary } from "../a11y";
import type { Mark } from "../model";
import type { ChartDefinition } from "./chart-definition";
import {
  clamp,
  coerceFiniteInt,
  coerceFiniteNonNegative,
  normalizeSegments,
} from "./shared";
import type {
  BitfieldData,
  ConcentricArcsHorizSpec,
  NormalizedConcentricArcsHoriz,
} from "./types";

function fmt(x: number): string {
  return x.toFixed(2);
}

export const concentricArcsHorizChart = {
  a11y(_spec, normalized, _layout) {
    return {
      label: a11yLabelWithSegmentsSummary(
        "Concentric arcs (horizontal) chart",
        normalized.arcs,
      ),
      role: "img",
    };
  },
  category: "bars" as const,
  defaultPad: 0,
  displayName: "Concentric arcs (horiz)",
  emptyDataWarningMessage: "No segments data.",
  isEmpty(normalized) {
    return normalized.arcs.length === 0;
  },
  marks(spec, normalized, layout, _state, _theme, warnings) {
    const arcs = normalized.arcs;
    if (arcs.length === 0) return [];

    const maxArcs = coerceFiniteInt(
      spec.maxArcs ?? 4,
      4,
      1,
      warnings,
      "Non-finite concentric-arcs-horiz maxArcs; defaulted to 4.",
    );
    const step = coerceFiniteNonNegative(
      spec.step ?? 10,
      10,
      warnings,
      "Non-finite concentric-arcs-horiz step; defaulted to 10.",
    );
    const strokeWidth = coerceFiniteNonNegative(
      spec.strokeWidth ?? 3,
      3,
      warnings,
      "Non-finite concentric-arcs-horiz strokeWidth; defaulted to 3.",
    );

    const usableW = Math.max(0, layout.width - layout.pad * 2);
    const usableH = Math.max(0, layout.height - layout.pad * 2);
    const x0 = layout.pad;
    const y0 = layout.pad;

    const count = Math.min(maxArcs, arcs.length);
    const classSuffix = spec.className ? ` ${spec.className}` : "";

    const marks: Mark[] = [];
    for (let i = 0; i < count; i++) {
      const arc = arcs[i];
      if (!arc) continue;

      const h = Math.max(0, usableH - i * step);
      if (!(h > 0)) continue;
      const yTop = y0 + i * (step / 2);
      const yBottom = yTop + h;

      const pct = clamp(arc.pct, 0, 100);
      const w = Math.round((pct / 100) * usableW);
      if (!(w > 0)) continue;

      const xRight = x0 + w;
      const r = Math.min(h / 2, w);
      const xInner = xRight - r;
      const yArcTop = yTop + r;
      const yArcBottom = yBottom - r;

      const d = `M ${fmt(x0)} ${fmt(yTop)} L ${fmt(xInner)} ${fmt(yTop)} Q ${fmt(xRight)} ${fmt(yTop)} ${fmt(xRight)} ${fmt(yArcTop)} L ${fmt(xRight)} ${fmt(yArcBottom)} Q ${fmt(xRight)} ${fmt(yBottom)} ${fmt(xInner)} ${fmt(yBottom)} L ${fmt(x0)} ${fmt(yBottom)}`;

      marks.push({
        className: `mv-concentric-arcs-horiz-arc${classSuffix}`,
        d,
        fill: "none",
        id: `concentric-arcs-horiz-arc-${i}`,
        stroke: arc.color,
        strokeLinecap: "butt",
        strokeWidth,
        type: "path",
      });
    }

    return marks;
  },
  normalize(_spec, data) {
    const arcs = normalizeSegments(data);
    return { arcs, type: "concentric-arcs-horiz" as const };
  },
  preferredAspectRatio: "wide" as const,
  type: "concentric-arcs-horiz",
} satisfies ChartDefinition<
  "concentric-arcs-horiz",
  ConcentricArcsHorizSpec,
  BitfieldData,
  NormalizedConcentricArcsHoriz
>;
