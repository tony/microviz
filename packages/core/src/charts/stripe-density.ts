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
  NormalizedStripeDensity,
  StripeDensitySpec,
} from "./types";

export const stripeDensityChart = {
  a11y(_spec, normalized, _layout) {
    return {
      items: a11yItemsForSegments(normalized.segments, {
        idPrefix: "stripe-density-seg",

        labelFallback: "Segment",
      }),
      label: a11yLabelWithSegmentsSummary(
        "Stripe density chart",
        normalized.segments,
      ),
      role: "img",
    };
  },
  category: "bars" as const,
  defaultPad: 0,
  defs(spec, normalized, layout, warnings): Def[] {
    const segments = normalized.segments;
    if (segments.length === 0) return [];

    const stripeWidth = coerceFiniteNonNegative(
      spec.stripeWidth ?? 2,
      2,
      warnings,
      "Non-finite stripe-density stripeWidth; defaulted to 2.",
    );
    const minTileWidth = coerceFiniteNonNegative(
      spec.minTileWidth ?? 3,
      3,
      warnings,
      "Non-finite stripe-density minTileWidth; defaulted to 3.",
    );
    const maxTileWidth = coerceFiniteNonNegative(
      spec.maxTileWidth ?? 14,
      14,
      warnings,
      "Non-finite stripe-density maxTileWidth; defaulted to 14.",
    );
    const densityScale = coerceFiniteNonNegative(
      spec.densityScale ?? 0.25,
      0.25,
      warnings,
      "Non-finite stripe-density densityScale; defaulted to 0.25.",
    );

    const tileH = Math.max(1, layout.height - layout.pad * 2);

    return segments.map((seg, i) => {
      const tileW = Math.max(
        minTileWidth,
        maxTileWidth - seg.pct * densityScale,
      );
      return {
        height: tileH,
        id: `mv-stripe-density-${i}`,
        marks: [
          {
            fill: seg.color,
            h: tileH,
            type: "rect",
            w: stripeWidth,
            x: 0,
            y: 0,
          },
        ],
        patternUnits: "userSpaceOnUse",
        type: "pattern" as const,
        width: Math.max(1, tileW),
      };
    });
  },
  displayName: "Stripe density",
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
        className: `mv-stripe-density-seg${classSuffix}`,
        h: usableH,
        id: `stripe-density-seg-${i}`,
        type: "rect",
        w: run.w,
        x: x0 + run.x,
        y: y0,
      });
    }

    const fillRules = runs.map((_, i) => ({
      id: `mv-stripe-density-${i}`,
      match: { id: `stripe-density-seg-${i}` },
    }));

    return applyFillRules(marks, fillRules);
  },
  normalize(_spec, data) {
    const segments = normalizeSegments(data);
    return { segments, type: "stripe-density" as const };
  },
  preferredAspectRatio: "wide" as const,
  type: "stripe-density",
} satisfies ChartDefinition<
  "stripe-density",
  StripeDensitySpec,
  BitfieldData,
  NormalizedStripeDensity
>;
