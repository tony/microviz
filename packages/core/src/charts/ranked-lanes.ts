import { a11yItemsForSegments, a11yLabelWithSegmentsSummary } from "../a11y";
import type { ChartDefinition } from "./chart-definition";
import { normalizeSegments } from "./shared";
import type {
  BitfieldData,
  NormalizedRankedLanes,
  RankedLanesSpec,
} from "./types";

export const rankedLanesChart = {
  a11y(_spec, normalized, _layout) {
    return {
      items: a11yItemsForSegments(normalized.segments, {
        idPrefix: "ranked-lanes-seg",

        labelFallback: "Segment",
      }),
      label: a11yLabelWithSegmentsSummary(
        "Ranked lanes chart",
        normalized.segments,
      ),
      role: "img",
    };
  },
  category: "bars" as const,
  defaultPad: 2,
  displayName: "Ranked lanes",
  emptyDataWarningMessage: "No segments data.",
  isEmpty(normalized) {
    return normalized.segments.length === 0;
  },
  marks(spec, normalized, layout, _state, _theme, _warnings) {
    const usableW = Math.max(0, layout.width - layout.pad * 2);
    const usableH = Math.max(0, layout.height - layout.pad * 2);
    const x0 = layout.pad;
    const y0 = layout.pad;

    const maxLanes = spec.maxLanes ?? 6;
    const segments = normalized.segments.slice(0, maxLanes);
    if (segments.length === 0) return [];
    const maxPct = Math.max(...segments.map((seg) => seg.pct), 0);

    const laneHeight = spec.laneHeight ?? 4;
    const totalLaneHeight = segments.length * laneHeight;
    const gap =
      segments.length > 1
        ? (usableH - totalLaneHeight) / (segments.length - 1)
        : 0;

    const classSuffix = spec.className ? ` ${spec.className}` : "";

    return segments.map((seg, i) => {
      const w = maxPct > 0 ? Math.max(0, (seg.pct / maxPct) * usableW) : 0;
      const y = y0 + i * (laneHeight + gap);
      const rx = Math.min(laneHeight / 2, w / 2);
      return {
        className: `mv-ranked-lanes-bar${classSuffix}`,
        fill: seg.color,
        h: laneHeight,
        id: `ranked-lanes-bar-${i}`,
        rx,
        ry: rx,
        type: "rect" as const,
        w,
        x: x0,
        y,
      };
    });
  },
  normalize(_spec, data) {
    const segments = normalizeSegments(data);
    return { segments, type: "ranked-lanes" as const };
  },
  preferredAspectRatio: "wide" as const,
  type: "ranked-lanes",
} satisfies ChartDefinition<
  "ranked-lanes",
  RankedLanesSpec,
  BitfieldData,
  NormalizedRankedLanes
>;
