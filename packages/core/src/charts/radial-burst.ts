import { a11yLabelWithSegmentsSummary } from "../a11y";
import type { Mark } from "../model";
import type { ChartDefinition } from "./chart-definition";
import { normalizeSegments } from "./shared";
import type {
  BitfieldData,
  NormalizedRadialBurst,
  RadialBurstSpec,
} from "./types";

function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angle: number,
): { x: number; y: number } {
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  };
}

function wedgePath(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
): string {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);

  const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;
  return [
    `M ${cx.toFixed(2)} ${cy.toFixed(2)}`,
    `L ${start.x.toFixed(2)} ${start.y.toFixed(2)}`,
    `A ${r.toFixed(2)} ${r.toFixed(2)} 0 ${largeArcFlag} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`,
    "Z",
  ].join(" ");
}

export const radialBurstChart = {
  a11y(_spec, normalized, _layout) {
    return {
      label: a11yLabelWithSegmentsSummary(
        "Radial burst chart",
        normalized.segments,
      ),
      role: "img",
    };
  },
  category: "lines" as const,
  defaultPad: 0,
  displayName: "Radial burst",
  emptyDataWarningMessage: "No segments data.",
  isEmpty(normalized) {
    return normalized.segments.length === 0;
  },
  marks(spec, normalized, layout) {
    const segments = normalized.segments;
    if (segments.length === 0) return [];

    const usableW = Math.max(0, layout.width - layout.pad * 2);
    const usableH = Math.max(0, layout.height - layout.pad * 2);

    const r = Math.min(usableW / 2, usableH * 2);
    if (r <= 0) return [];

    const cx = layout.pad + usableW / 2;
    const cy = layout.pad + r;

    const totalPct = segments.reduce((sum, s) => sum + s.pct, 0) || 1;
    const startAngle = -Math.PI;
    const totalSweep = Math.PI;

    const classSuffix = spec.className ? ` ${spec.className}` : "";

    const marks: Mark[] = [];
    let acc = 0;
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      if (!seg) continue;
      const sweep = (seg.pct / totalPct) * totalSweep;
      const d = wedgePath(
        cx,
        cy,
        r,
        startAngle + acc,
        startAngle + acc + sweep,
      );
      marks.push({
        className: `mv-radial-burst-seg${classSuffix}`,
        d,
        fill: seg.color,
        id: `radial-burst-seg-${i}`,
        type: "path",
      });
      acc += sweep;
    }

    return marks;
  },
  normalize(_spec, data) {
    const segments = normalizeSegments(data);
    return { segments, type: "radial-burst" as const };
  },
  preferredAspectRatio: "wide" as const,
  type: "radial-burst",
} satisfies ChartDefinition<
  "radial-burst",
  RadialBurstSpec,
  BitfieldData,
  NormalizedRadialBurst
>;
