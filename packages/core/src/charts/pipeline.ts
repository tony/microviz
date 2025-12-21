import { a11yLabelWithSegmentsSummary } from "../a11y";
import type { Mark } from "../model";
import type { ChartDefinition } from "./chart-definition";
import {
  clamp,
  coerceFiniteNonNegative,
  layoutSegmentsByPct,
  normalizeSegments,
} from "./shared";
import type { BitfieldData, NormalizedPipeline, PipelineSpec } from "./types";

// Pipeline chart: overlapping chevron segments.
function pipelinePath(options: {
  height: number;
  isFirst: boolean;
  isLast: boolean;
  overlap: number;
  width: number;
  x: number;
  y: number;
}): string {
  const h = Math.max(0, options.height);
  const w = Math.max(0, options.width);
  const x = options.x;
  const y = options.y;
  const midY = y + h / 2;
  const yBottom = y + h;

  const overlap = Math.min(Math.max(0, options.overlap), w);
  const xRight = x + w;
  const xRightBase = x + Math.max(0, w - overlap);
  const notchX = x + overlap;

  if (options.isFirst) {
    return `M ${x.toFixed(2)} ${y.toFixed(2)} L ${xRightBase.toFixed(2)} ${y.toFixed(2)} L ${xRight.toFixed(2)} ${midY.toFixed(2)} L ${xRightBase.toFixed(2)} ${yBottom.toFixed(2)} L ${x.toFixed(2)} ${yBottom.toFixed(2)} Z`;
  }

  if (options.isLast) {
    return `M ${x.toFixed(2)} ${y.toFixed(2)} L ${xRight.toFixed(2)} ${y.toFixed(2)} L ${xRight.toFixed(2)} ${yBottom.toFixed(2)} L ${x.toFixed(2)} ${yBottom.toFixed(2)} L ${notchX.toFixed(2)} ${midY.toFixed(2)} Z`;
  }

  return `M ${x.toFixed(2)} ${y.toFixed(2)} L ${xRightBase.toFixed(2)} ${y.toFixed(2)} L ${xRight.toFixed(2)} ${midY.toFixed(2)} L ${xRightBase.toFixed(2)} ${yBottom.toFixed(2)} L ${x.toFixed(2)} ${yBottom.toFixed(2)} L ${notchX.toFixed(2)} ${midY.toFixed(2)} Z`;
}

export const pipelineChart = {
  a11y(_spec, normalized, _layout) {
    return {
      label: a11yLabelWithSegmentsSummary(
        "Pipeline chart",
        normalized.segments,
      ),
      role: "img",
    };
  },
  category: "bars" as const,
  defaultPad: 0,
  displayName: "Pipeline",
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

    const overlapRequested = coerceFiniteNonNegative(
      spec.overlap ?? 8,
      8,
      warnings,
      "Non-finite pipeline overlap; defaulted to 8.",
    );
    const overlap = Math.min(overlapRequested, usableW);

    const strokeWidth = coerceFiniteNonNegative(
      spec.strokeWidth ?? 1,
      1,
      warnings,
      "Non-finite pipeline stroke width; defaulted to 1.",
    );

    const strokeOpacity = clamp(
      coerceFiniteNonNegative(
        spec.strokeOpacity ?? 0.18,
        0.18,
        warnings,
        "Non-finite pipeline stroke opacity; defaulted to 0.18.",
      ),
      0,
      1,
    );

    const runs = layoutSegmentsByPct(segments, usableW, 0);
    const classSuffix = spec.className ? ` ${spec.className}` : "";

    const marks: Mark[] = [];
    for (let i = runs.length - 1; i >= 0; i--) {
      const run = runs[i];
      if (!run) continue;

      const isFirst = i === 0;
      const isLast = i === runs.length - 1;

      const w = run.w + (isLast ? 0 : overlap);
      const x = x0 + run.x;

      marks.push({
        className: `mv-pipeline-seg${classSuffix}`,
        d: pipelinePath({
          height: usableH,
          isFirst,
          isLast,
          overlap,
          width: w,
          x,
          y: y0,
        }),
        fill: run.color,
        id: `pipeline-seg-${i}`,
        stroke: "black",
        strokeLinejoin: "round",
        strokeOpacity,
        strokeWidth,
        type: "path",
      });
    }

    return marks;
  },
  normalize(_spec, data) {
    const segments = normalizeSegments(data);
    return { segments, type: "pipeline" };
  },
  preferredAspectRatio: "wide" as const,
  type: "pipeline",
} satisfies ChartDefinition<
  "pipeline",
  PipelineSpec,
  BitfieldData,
  NormalizedPipeline
>;
