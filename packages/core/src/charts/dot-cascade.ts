import { a11yLabelWithSegmentsSummary } from "../a11y";
import type { Mark } from "../model";
import type { ChartDefinition } from "./chart-definition";
import {
  allocateUnitsByPct,
  clamp,
  coerceFiniteInt,
  coerceFiniteNonNegative,
  normalizeSegments,
} from "./shared";
import type {
  BitfieldData,
  DotCascadeSpec,
  NormalizedDotCascade,
} from "./types";

export const dotCascadeChart = {
  a11y(_spec, normalized, _layout) {
    return {
      label: a11yLabelWithSegmentsSummary(
        "Dot cascade chart",
        normalized.segments,
      ),
      role: "img",
    };
  },
  category: "dots" as const,
  defaultPad: 0,
  displayName: "Dot cascade",
  isEmpty(normalized) {
    return normalized.segments.length === 0;
  },
  marks(spec, normalized, layout, _state, _theme, warnings) {
    const totalDots = coerceFiniteInt(
      spec.dots ?? 16,
      16,
      1,
      warnings,
      "Non-finite dot-cascade dot count; defaulted to 16.",
    );
    const dotRadius = coerceFiniteNonNegative(
      spec.dotRadius ?? 4,
      4,
      warnings,
      "Non-finite dot-cascade dot radius; defaulted to 4.",
    );

    const segments = normalized.segments;
    if (segments.length === 0) return [];

    const counts = allocateUnitsByPct(segments, totalDots);

    const usableW = Math.max(0, layout.width - layout.pad * 2);
    const yMin = layout.pad + dotRadius;
    const yMax = layout.height - layout.pad - dotRadius;

    const classSuffix = spec.className ? ` ${spec.className}` : "";

    const marks: Mark[] = [];
    let idx = 0;
    for (let segI = 0; segI < segments.length; segI++) {
      const seg = segments[segI];
      if (!seg) continue;
      const num = counts[segI] ?? 0;
      for (let j = 0; j < num; j++) {
        const cx = layout.pad + ((idx + 0.5) / totalDots) * usableW;
        const yRaw =
          segI * 4 + (num <= 1 ? 0 : (j / (num - 1)) * 6) + layout.pad;
        const cy = clamp(yRaw, yMin, yMax);
        marks.push({
          className: `mv-dot-cascade-dot${classSuffix}`,
          cx,
          cy,
          fill: seg.color,
          id: `dot-cascade-dot-${idx}`,
          r: dotRadius,
          type: "circle",
        });
        idx += 1;
        if (idx >= totalDots) break;
      }
      if (idx >= totalDots) break;
    }

    return marks;
  },
  normalize(_spec, data) {
    const segments = normalizeSegments(data);
    return { segments, type: "dot-cascade" };
  },
  preferredAspectRatio: "wide" as const,
  type: "dot-cascade",
} satisfies ChartDefinition<
  "dot-cascade",
  DotCascadeSpec,
  BitfieldData,
  NormalizedDotCascade
>;
