import { a11yLabelWithSegmentsSummary } from "../a11y";
import type { Mark } from "../model";
import type { ChartDefinition } from "./chart-definition";
import {
  clamp,
  coerceFiniteNonNegative,
  layoutSegmentsByPct,
  normalizeSegments,
} from "./shared";
import type {
  BitfieldData,
  NormalizedSegmentedPill,
  SegmentedPillSpec,
} from "./types";

const DEFAULT_SEPARATOR_STROKE = "rgba(255,255,255,0.2)";

export const segmentedPillChart = {
  a11y(_spec, normalized, _layout) {
    return {
      label: a11yLabelWithSegmentsSummary(
        "Segmented pill chart",
        normalized.segments,
      ),
      role: "img",
    };
  },
  category: "bars" as const,
  defaultPad: 0,
  displayName: "Segmented Pill",
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
      const className = `mv-segmented-pill-seg${classSuffix}`;

      if (!hasRadius) {
        marks.push({
          className,
          fill,
          h: usableH,
          id: `segmented-pill-seg-${i}`,
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
          id: `segmented-pill-seg-${i}`,
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
          id: `segmented-pill-seg-${i}`,
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
            id: `segmented-pill-seg-${i}-inner`,
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
          id: `segmented-pill-seg-${i}`,
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
            id: `segmented-pill-seg-${i}-inner`,
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
        id: `segmented-pill-seg-${i}`,
        type: "rect",
        w,
        x,
        y: y0,
      });
    }

    const separatorStroke =
      typeof spec.separatorStroke === "string" && spec.separatorStroke.trim()
        ? spec.separatorStroke
        : DEFAULT_SEPARATOR_STROKE;
    const separatorStrokeOpacity = clamp(
      coerceFiniteNonNegative(
        spec.separatorStrokeOpacity ?? 1,
        1,
        warnings,
        "Non-finite segmented-pill separatorStrokeOpacity; defaulted to 1.",
      ),
      0,
      1,
    );
    const separatorStrokeWidth = coerceFiniteNonNegative(
      spec.separatorStrokeWidth ?? 0.5,
      0.5,
      warnings,
      "Non-finite segmented-pill separatorStrokeWidth; defaulted to 0.5.",
    );

    if (separatorStrokeWidth > 0 && runs.length > 1) {
      for (let i = 0; i < runs.length - 1; i++) {
        const run = runs[i];
        if (!run) continue;
        const x = x0 + run.x + run.w;
        marks.push({
          className: `mv-segmented-pill-sep${classSuffix}`,
          id: `segmented-pill-sep-${i}`,
          stroke: separatorStroke,
          strokeOpacity: separatorStrokeOpacity,
          strokeWidth: separatorStrokeWidth,
          type: "line",
          x1: x,
          x2: x,
          y1: y0,
          y2: y0 + usableH,
        });
      }
    }

    return marks;
  },
  normalize(_spec, data) {
    const segments = normalizeSegments(data);
    return { segments, type: "segmented-pill" as const };
  },
  preferredAspectRatio: "wide" as const,
  type: "segmented-pill",
} satisfies ChartDefinition<
  "segmented-pill",
  SegmentedPillSpec,
  BitfieldData,
  NormalizedSegmentedPill
>;
