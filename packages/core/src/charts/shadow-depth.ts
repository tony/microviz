import type { Def, Mark } from "../model";
import type { ChartDefinition } from "./chart-definition";
import {
  coerceFiniteInt,
  coerceFiniteNonNegative,
  layoutSegmentsByPct,
  normalizeSegments,
} from "./shared";
import type {
  BitfieldData,
  NormalizedShadowDepth,
  ShadowDepthSpec,
} from "./types";

const FILTER_PREFIX = "mv-shadow-depth";

function filterId(index: number): string {
  return `${FILTER_PREFIX}-${index}`;
}

export const shadowDepthChart = {
  a11y(_spec, _normalized, _layout) {
    return { label: "Shadow depth chart", role: "img" };
  },
  category: "bars" as const,
  defaultPad: 0,
  defs(spec, normalized, _layout, warnings): Def[] {
    const segments = normalized.segments;
    if (segments.length === 0) return [];

    const maxItems = coerceFiniteInt(
      spec.maxItems ?? 4,
      4,
      1,
      warnings,
      "Non-finite shadow-depth maxItems; defaulted to 4.",
    );
    const items = Math.min(maxItems, segments.length);

    // Approximate legacy CSS box-shadows:
    // `${2 - i*0.5}px ${2 - i*0.5}px ${4 - i}px rgba(0,0,0,${0.3 - i*0.05})`
    const baseOffset = 2;
    const offsetStep = 0.5;
    const baseBlur = 4;
    const blurStep = 1;
    const baseOpacity = 0.3;
    const opacityStep = 0.05;

    const defs: Def[] = [];
    for (let i = 0; i < items; i++) {
      const offset = baseOffset - i * offsetStep;
      const blur = Math.max(0, baseBlur - i * blurStep);
      const opacity = Math.max(0, baseOpacity - i * opacityStep);
      defs.push({
        filterUnits: "objectBoundingBox",
        height: 1.8,
        id: filterId(i),
        primitives: [
          {
            dx: offset,
            dy: offset,
            floodColor: "black",
            floodOpacity: opacity,
            stdDeviation: blur / 2,
            type: "dropShadow",
          },
        ],
        type: "filter",
        width: 1.8,
        x: -0.4,
        y: -0.4,
      });
    }

    return defs;
  },
  displayName: "Shadow depth",
  emptyDataWarningMessage: "No segments data.",
  isEmpty(normalized) {
    return normalized.segments.length === 0;
  },
  marks(spec, normalized, layout, _state, _theme, warnings) {
    const segments = normalized.segments;
    if (segments.length === 0) return [];

    const gap = coerceFiniteNonNegative(
      spec.gap ?? 4,
      4,
      warnings,
      "Non-finite shadow-depth gap; defaulted to 4.",
    );
    const cornerRadius = coerceFiniteNonNegative(
      spec.cornerRadius ?? 4,
      4,
      warnings,
      "Non-finite shadow-depth cornerRadius; defaulted to 4.",
    );
    const maxItems = coerceFiniteInt(
      spec.maxItems ?? 4,
      4,
      1,
      warnings,
      "Non-finite shadow-depth maxItems; defaulted to 4.",
    );

    const items = Math.min(maxItems, segments.length);
    const visible = segments.slice(0, items);

    const usableW = Math.max(0, layout.width - layout.pad * 2);
    const usableH = Math.max(0, layout.height - layout.pad * 2);
    const x0 = layout.pad;
    const y0 = layout.pad;

    const runs = layoutSegmentsByPct(visible, usableW, gap);
    const classSuffix = spec.className ? ` ${spec.className}` : "";

    const marks: Mark[] = [];
    for (let i = 0; i < runs.length; i++) {
      const run = runs[i];
      if (!run) continue;

      const heightPct = Math.max(0.2, 1 - i * 0.1);
      const h = usableH * heightPct;
      const y = y0 + (usableH - h) / 2;

      marks.push({
        className: `mv-shadow-depth-block${classSuffix}`,
        fill: run.color,
        filter: filterId(i),
        h,
        id: `shadow-depth-block-${i}`,
        rx: cornerRadius,
        ry: cornerRadius,
        type: "rect",
        w: run.w,
        x: x0 + run.x,
        y,
      });
    }

    return marks;
  },
  normalize(_spec, data) {
    const segments = normalizeSegments(data);
    return { segments, type: "shadow-depth" as const };
  },
  preferredAspectRatio: "wide" as const,
  type: "shadow-depth",
} satisfies ChartDefinition<
  "shadow-depth",
  ShadowDepthSpec,
  BitfieldData,
  NormalizedShadowDepth
>;
