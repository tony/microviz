import { a11yLabelWithSegmentsSummary } from "../a11y";
import type { Mark } from "../model";
import type { ChartDefinition } from "./chart-definition";
import { layoutSegmentsByPct, normalizeSegments } from "./shared";
import type {
  BitfieldData,
  NormalizedStackedBar,
  StackedBarSpec,
} from "./types";

export const stackedBarChart = {
  a11y(_spec, normalized, _layout) {
    return {
      label: a11yLabelWithSegmentsSummary(
        "Stacked bar chart",
        normalized.segments,
      ),
      role: "img",
    };
  },
  category: "bars" as const,
  defaultPad: 0,
  displayName: "Stacked Bar",
  emptyDataWarningMessage: "No segments data.",
  isEmpty(normalized) {
    return normalized.segments.length === 0;
  },
  marks(spec, normalized, layout, _state, _theme, _warnings) {
    const usableW = Math.max(0, layout.width - layout.pad * 2);
    const usableH = Math.max(0, layout.height - layout.pad * 2);
    const x0 = layout.pad;
    const y0 = layout.pad;

    const segments = normalized.segments;
    if (segments.length === 0) return [];

    const runs = layoutSegmentsByPct(segments, usableW, 0);
    const classSuffix = spec.className ? ` ${spec.className}` : "";

    const baseRadius = Math.min(usableH / 2, 4);
    const hasRadius = baseRadius > 0 && runs.length > 0;

    const marks: Mark[] = [];
    for (let i = 0; i < runs.length; i++) {
      const run = runs[i];
      if (!run) continue;
      const x = x0 + run.x;
      const w = run.w;
      const fill = run.color;
      const className = `mv-stacked-bar-seg${classSuffix}`;

      if (!hasRadius) {
        marks.push({
          className,
          fill,
          h: usableH,
          id: `stacked-bar-seg-${i}`,
          type: "rect",
          w,
          x,
          y: y0,
        });
        continue;
      }

      const isFirst = i === 0;
      const isLast = i === runs.length - 1;
      const isSingle = runs.length === 1;
      const radius = Math.min(baseRadius, w / 2);

      if (isSingle) {
        marks.push({
          className,
          fill,
          h: usableH,
          id: `stacked-bar-seg-${i}`,
          rx: radius,
          ry: radius,
          type: "rect",
          w,
          x,
          y: y0,
        });
        continue;
      }

      if (isFirst) {
        marks.push({
          className,
          fill,
          h: usableH,
          id: `stacked-bar-seg-${i}`,
          rx: radius,
          ry: radius,
          type: "rect",
          w,
          x,
          y: y0,
        });
        const innerW = Math.max(0, w - radius);
        if (innerW > 0) {
          marks.push({
            className,
            fill,
            h: usableH,
            id: `stacked-bar-seg-${i}-inner`,
            type: "rect",
            w: innerW,
            x: x + radius,
            y: y0,
          });
        }
        continue;
      }

      if (isLast) {
        marks.push({
          className,
          fill,
          h: usableH,
          id: `stacked-bar-seg-${i}`,
          rx: radius,
          ry: radius,
          type: "rect",
          w,
          x,
          y: y0,
        });
        const innerW = Math.max(0, w - radius);
        if (innerW > 0) {
          marks.push({
            className,
            fill,
            h: usableH,
            id: `stacked-bar-seg-${i}-inner`,
            type: "rect",
            w: innerW,
            x,
            y: y0,
          });
        }
        continue;
      }

      marks.push({
        className,
        fill,
        h: usableH,
        id: `stacked-bar-seg-${i}`,
        type: "rect",
        w,
        x,
        y: y0,
      });
    }

    return marks;
  },
  normalize(_spec, data) {
    const segments = normalizeSegments(data);
    return { segments, type: "stacked-bar" };
  },
  type: "stacked-bar",
} satisfies ChartDefinition<
  "stacked-bar",
  StackedBarSpec,
  BitfieldData,
  NormalizedStackedBar
>;
