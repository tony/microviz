import { a11yLabelWithSegmentsSummary } from "../a11y";
import type { ChartDefinition } from "./chart-definition";
import {
  coerceFiniteNonNegative,
  layoutSegmentsByPct,
  normalizeSegments,
} from "./shared";
import type { BitfieldData, NormalizedSkyline, SkylineSpec } from "./types";

export const skylineChart = {
  a11y(_spec, normalized, _layout) {
    return {
      label: a11yLabelWithSegmentsSummary("Skyline chart", normalized.segments),
      role: "img",
    };
  },
  category: "bars" as const,
  defaultPad: 0,
  displayName: "Skyline",
  emptyDataWarningMessage: "No segments data.",
  isEmpty(normalized) {
    return normalized.segments.length === 0;
  },
  marks(spec, normalized, layout, _state, _theme, warnings) {
    const usableW = Math.max(0, layout.width - layout.pad * 2);
    const usableH = Math.max(0, layout.height - layout.pad * 2);
    const x0 = layout.pad;
    const y0 = layout.pad;

    const segments = normalized.segments;
    if (segments.length === 0) return [];

    const gap = coerceFiniteNonNegative(
      spec.gap ?? 2,
      2,
      warnings,
      "Non-finite skyline gap; defaulted to 2.",
    );

    const minHeightPct = spec.minHeightPct ?? 20;
    const maxPct = Math.max(...segments.map((s) => s.pct));

    const runs = layoutSegmentsByPct(segments, usableW, gap);
    const classSuffix = spec.className ? ` ${spec.className}` : "";

    return runs
      .map((run, i) => {
        const seg = segments[i];
        if (!seg) return null;

        // Height proportional to pct/maxPct, with minimum
        const heightPct = Math.max(minHeightPct, (seg.pct / maxPct) * 100);
        const h = (heightPct / 100) * usableH;
        const y = y0 + usableH - h; // Align to bottom

        const rx = Math.min(2, run.w / 2);

        return {
          className: `mv-skyline-bar${classSuffix}`,
          fill: run.color,
          h,
          id: `skyline-bar-${i}`,
          rx,
          ry: rx,
          type: "rect" as const,
          w: run.w,
          x: x0 + run.x,
          y,
        };
      })
      .filter((m) => m !== null);
  },
  normalize(_spec, data) {
    const segments = normalizeSegments(data);
    return { segments, type: "skyline" as const };
  },
  preferredAspectRatio: "wide" as const,
  type: "skyline",
} satisfies ChartDefinition<
  "skyline",
  SkylineSpec,
  BitfieldData,
  NormalizedSkyline
>;
