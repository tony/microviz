import { a11yItemsForSegments, a11yLabelWithSegmentsSummary } from "../a11y";
import type { Def, Mark } from "../model";
import type { ChartDefinition } from "./chart-definition";
import {
  coerceFiniteNonNegative,
  layoutSegmentsByPct,
  normalizeSegments,
} from "./shared";
import type {
  BitfieldData,
  BulletGaugeSpec,
  NormalizedBulletGauge,
} from "./types";

const CLIP_ID = "bullet-gauge-clip";

export const bulletGaugeChart = {
  a11y(_spec, normalized, _layout) {
    return {
      items: a11yItemsForSegments(normalized.segments, {
        idPrefix: "bullet-gauge-seg",
        labelFallback: "Segment",
      }),
      label: a11yLabelWithSegmentsSummary(
        "Bullet gauge chart",
        normalized.segments,
      ),
      role: "img",
    };
  },
  category: "bars" as const,
  defaultPad: 0,
  defs(_spec, _normalized, layout) {
    const usableW = Math.max(0, layout.width - layout.pad * 2);
    const usableH = Math.max(0, layout.height - layout.pad * 2);
    const x0 = layout.pad;
    const y0 = layout.pad;
    const rx = usableH / 2;
    const ry = usableH / 2;

    const defs: Def[] = [
      {
        h: usableH,
        id: CLIP_ID,
        rx,
        ry,
        type: "clipRect",
        w: usableW,
        x: x0,
        y: y0,
      },
    ];
    return defs;
  },
  displayName: "Bullet gauge",
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
      spec.gap ?? 0,
      0,
      warnings,
      "Non-finite bullet-gauge gap; defaulted to 0.",
    );

    // Marker position (default 50% = center)
    const markerPosition = spec.markerPosition ?? 50;
    const markerOpacity = spec.markerOpacity ?? 0.4;
    const markerWidth = spec.markerWidth ?? 2;

    // Rounded corners for pill shape
    const rx = usableH / 2;
    const ry = usableH / 2;

    const runs = layoutSegmentsByPct(segments, usableW, gap);
    const classSuffix = spec.className ? ` ${spec.className}` : "";

    const marks: Mark[] = [];

    // Background track (pill shape)
    marks.push({
      className: `mv-bullet-gauge-track${classSuffix}`,
      fill: "rgba(0,0,0,0.1)",
      h: usableH,
      id: "bullet-gauge-track",
      rx,
      ry,
      type: "rect" as const,
      w: usableW,
      x: x0,
      y: y0,
    });

    // Segment rects (clipped to pill shape via clipPath)
    for (let i = 0; i < runs.length; i++) {
      const run = runs[i];
      if (!run) continue;

      marks.push({
        className: `mv-bullet-gauge-seg${classSuffix}`,
        clipPath: CLIP_ID,
        fill: run.color,
        h: usableH,
        id: `bullet-gauge-seg-${i}`,
        rx: 0,
        ry: 0,
        type: "rect" as const,
        w: run.w,
        x: x0 + run.x,
        y: y0,
      });
    }

    // Marker line at specified position
    const markerX = x0 + (markerPosition / 100) * usableW;
    marks.push({
      className: `mv-bullet-gauge-marker${classSuffix}`,
      id: "bullet-gauge-marker",
      stroke: "#ffffff",
      strokeOpacity: markerOpacity,
      strokeWidth: markerWidth,
      type: "line" as const,
      x1: markerX,
      x2: markerX,
      y1: y0,
      y2: y0 + usableH,
    });

    return marks;
  },
  normalize(_spec, data) {
    const segments = normalizeSegments(data);
    return { segments, type: "bullet-gauge" as const };
  },
  preferredAspectRatio: "wide" as const,
  type: "bullet-gauge",
} satisfies ChartDefinition<
  "bullet-gauge",
  BulletGaugeSpec,
  BitfieldData,
  NormalizedBulletGauge
>;
