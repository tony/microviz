import { a11yLabelWithSegmentsSummary } from "../a11y";
import type { Def, Mark } from "../model";
import type { ChartDefinition } from "./chart-definition";
import { layoutSegmentsByPct, normalizeSegments } from "./shared";
import type {
  BitfieldData,
  NormalizedPatternTiles,
  PatternTilesSpec,
} from "./types";

const PATTERN_IDS = [
  "mv-pattern-tiles-stripes",
  "mv-pattern-tiles-dots",
  "mv-pattern-tiles-crosshatch",
  "mv-pattern-tiles-waves",
] as const;

export const patternTilesChart = {
  a11y(_spec, normalized, _layout) {
    return {
      label: a11yLabelWithSegmentsSummary(
        "Pattern tiles chart",
        normalized.segments,
      ),
      role: "img",
    };
  },
  category: "bars" as const,
  defaultPad: 0,
  defs(_spec, _normalized, _layout, _warnings): Def[] {
    return [
      {
        height: 3,
        id: PATTERN_IDS[0],
        marks: [
          {
            stroke: "white",
            strokeOpacity: 0.4,
            strokeWidth: 1.5,
            type: "line",
            x1: 0,
            x2: 0,
            y1: 0,
            y2: 3,
          },
        ],
        patternTransform: "rotate(45)",
        patternUnits: "userSpaceOnUse",
        type: "pattern",
        width: 3,
      },
      {
        height: 3,
        id: PATTERN_IDS[1],
        marks: [
          {
            cx: 1.5,
            cy: 1.5,
            fill: "white",
            fillOpacity: 0.4,
            r: 0.75,
            type: "circle",
          },
        ],
        patternUnits: "userSpaceOnUse",
        type: "pattern",
        width: 3,
      },
      {
        height: 4,
        id: PATTERN_IDS[2],
        marks: [
          {
            d: "M0 0L4 4M4 0L0 4",
            fill: "none",
            stroke: "white",
            strokeOpacity: 0.4,
            strokeWidth: 0.5,
            type: "path",
          },
        ],
        patternUnits: "userSpaceOnUse",
        type: "pattern",
        width: 4,
      },
      {
        height: 2,
        id: PATTERN_IDS[3],
        marks: [
          {
            d: "M0 1Q1 0 2 1T4 1",
            fill: "none",
            stroke: "white",
            strokeOpacity: 0.4,
            strokeWidth: 0.5,
            type: "path",
          },
        ],
        patternUnits: "userSpaceOnUse",
        type: "pattern",
        width: 4,
      },
    ];
  },
  displayName: "Pattern tiles",
  emptyDataWarningMessage: "No segments data.",
  isEmpty(normalized) {
    return normalized.segments.length === 0;
  },
  marks(spec, normalized, layout, _state, _theme, _warnings) {
    const segments = normalized.segments.slice(0, 4);
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
      const patternId = PATTERN_IDS[i % PATTERN_IDS.length];

      marks.push({
        className: `mv-pattern-tiles-seg${classSuffix}`,
        fill: run.color,
        h: usableH,
        id: `pattern-tiles-seg-${i}`,
        type: "rect",
        w: run.w,
        x: x0 + run.x,
        y: y0,
      });

      marks.push({
        className: `mv-pattern-tiles-pattern${classSuffix}`,
        fill: `url(#${patternId})`,
        h: usableH,
        id: `pattern-tiles-pattern-${i}`,
        type: "rect",
        w: run.w,
        x: x0 + run.x,
        y: y0,
      });
    }

    return marks;
  },
  normalize(_spec, data) {
    const segments = normalizeSegments(data);
    return { segments, type: "pattern-tiles" as const };
  },
  preferredAspectRatio: "wide" as const,
  type: "pattern-tiles",
} satisfies ChartDefinition<
  "pattern-tiles",
  PatternTilesSpec,
  BitfieldData,
  NormalizedPatternTiles
>;
