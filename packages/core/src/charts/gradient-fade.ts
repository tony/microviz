import { a11yItemsForSegments, a11yLabelWithSegmentsSummary } from "../a11y";
import type { Def, Mark } from "../model";
import { applyFillRules } from "../utils/defs";
import type { ChartDefinition } from "./chart-definition";
import {
  coerceFiniteNonNegative,
  layoutSegmentsByPct,
  normalizeSegments,
} from "./shared";
import type {
  BitfieldData,
  GradientFadeSpec,
  NormalizedGradientFade,
} from "./types";

export const gradientFadeChart = {
  a11y(_spec, normalized, _layout) {
    return {
      items: a11yItemsForSegments(normalized.segments, {
        idPrefix: "gradient-fade-seg",

        labelFallback: "Segment",
      }),
      label: a11yLabelWithSegmentsSummary(
        "Gradient fade chart",
        normalized.segments,
      ),
      role: "img",
    };
  },
  category: "bars" as const,
  defaultPad: 0,
  defs(spec, normalized, _layout, warnings): Def[] {
    const segments = normalized.segments;
    if (segments.length === 0) return [];

    const midOpacity = coerceFiniteNonNegative(
      spec.midOpacity ?? 0.7,
      0.7,
      warnings,
      "Non-finite gradient-fade midOpacity; defaulted to 0.7.",
    );
    const endOpacity = coerceFiniteNonNegative(
      spec.endOpacity ?? 0.35,
      0.35,
      warnings,
      "Non-finite gradient-fade endOpacity; defaulted to 0.35.",
    );

    return segments.map((seg, i) => ({
      id: `mv-gradient-fade-${i}`,
      stops: [
        { color: seg.color, offset: 0, opacity: 1 },
        { color: seg.color, offset: 0.5, opacity: midOpacity },
        { color: seg.color, offset: 1, opacity: endOpacity },
      ],
      type: "linearGradient" as const,
      x1: 0,
      x2: 1,
      y1: 0,
      y2: 0,
    }));
  },
  displayName: "Gradient fade",
  emptyDataWarningMessage: "No segments data.",
  isEmpty(normalized) {
    return normalized.segments.length === 0;
  },
  marks(spec, normalized, layout, _state, _theme, _warnings) {
    const segments = normalized.segments;
    if (segments.length === 0) return [];

    const usableW = Math.max(0, layout.width - layout.pad * 2);
    const usableH = Math.max(0, layout.height - layout.pad * 2);
    const x0 = layout.pad;
    const y0 = layout.pad;

    const runs = layoutSegmentsByPct(segments, usableW, 0);
    const classSuffix = spec.className ? ` ${spec.className}` : "";

    const marks: Mark[] = [];
    for (let i = 0; i < runs.length; i++) {
      const run = runs[i];
      if (!run) continue;
      marks.push({
        className: `mv-gradient-fade-seg${classSuffix}`,
        h: usableH,
        id: `gradient-fade-seg-${i}`,
        type: "rect",
        w: run.w,
        x: x0 + run.x,
        y: y0,
      });
    }

    const fillRules = runs.map((_run, i) => ({
      id: `mv-gradient-fade-${i}`,
      match: { id: `gradient-fade-seg-${i}` },
    }));

    return applyFillRules(marks, fillRules);
  },
  normalize(_spec, data) {
    const segments = normalizeSegments(data);
    return { segments, type: "gradient-fade" as const };
  },
  preferredAspectRatio: "wide" as const,
  type: "gradient-fade",
} satisfies ChartDefinition<
  "gradient-fade",
  GradientFadeSpec,
  BitfieldData,
  NormalizedGradientFade
>;
