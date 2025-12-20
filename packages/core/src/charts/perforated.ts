import { a11yLabelWithSegmentsSummary } from "../a11y";
import type { Def, Mark } from "../model";
import type { ChartDefinition } from "./chart-definition";
import {
  coerceFiniteNonNegative,
  layoutSegmentsByPct,
  normalizeSegments,
} from "./shared";
import type {
  BitfieldData,
  NormalizedPerforated,
  PerforatedSpec,
} from "./types";

const SEPARATOR_PATTERN_ID = "mv-perforated-sep-dots";

export const perforatedChart = {
  a11y(_spec, normalized, _layout) {
    return {
      label: a11yLabelWithSegmentsSummary(
        "Perforated chart",
        normalized.segments,
      ),
      role: "img",
    };
  },
  category: "bars" as const,
  defaultPad: 0,
  defs(spec, _normalized, _layout, warnings): Def[] {
    const dotOpacity = coerceFiniteNonNegative(
      spec.dotOpacity ?? 0.22,
      0.22,
      warnings,
      "Non-finite perforated dotOpacity; defaulted to 0.22.",
    );
    const dotRadius = coerceFiniteNonNegative(
      spec.dotRadius ?? 1,
      1,
      warnings,
      "Non-finite perforated dotRadius; defaulted to 1.",
    );
    const patternSize = coerceFiniteNonNegative(
      spec.patternSize ?? 4,
      4,
      warnings,
      "Non-finite perforated patternSize; defaulted to 4.",
    );

    return [
      {
        height: patternSize,
        id: SEPARATOR_PATTERN_ID,
        marks: [
          {
            cx: patternSize / 2,
            cy: patternSize / 2,
            fill: "white",
            fillOpacity: dotOpacity,
            r: dotRadius,
            type: "circle",
          },
        ],
        patternUnits: "userSpaceOnUse",
        type: "pattern",
        width: patternSize,
      },
    ];
  },
  displayName: "Perforated",
  emptyDataWarningMessage: "No segments data.",
  isEmpty(normalized) {
    return normalized.segments.length === 0;
  },
  marks(spec, normalized, layout, _state, _theme, warnings) {
    const segments = normalized.segments;
    if (segments.length === 0) return [];

    const separatorWidth = coerceFiniteNonNegative(
      spec.separatorWidth ?? 1,
      1,
      warnings,
      "Non-finite perforated separatorWidth; defaulted to 1.",
    );

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
        className: `mv-perforated-seg${classSuffix}`,
        fill: run.color,
        h: usableH,
        id: `perforated-seg-${i}`,
        type: "rect",
        w: run.w,
        x: x0 + run.x,
        y: y0,
      });
    }

    for (let i = 0; i < runs.length - 1; i++) {
      const run = runs[i];
      if (!run) continue;
      const boundary = x0 + run.x + run.w;
      marks.push({
        className: `mv-perforated-sep${classSuffix}`,
        fill: `url(#${SEPARATOR_PATTERN_ID})`,
        h: usableH,
        id: `perforated-sep-${i}`,
        type: "rect",
        w: separatorWidth,
        x: boundary - separatorWidth / 2,
        y: y0,
      });
    }

    return marks;
  },
  normalize(_spec, data) {
    const segments = normalizeSegments(data);
    return { segments, type: "perforated" as const };
  },
  type: "perforated",
} satisfies ChartDefinition<
  "perforated",
  PerforatedSpec,
  BitfieldData,
  NormalizedPerforated
>;
