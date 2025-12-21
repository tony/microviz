import { a11yLabelWithSegmentsSummary } from "../a11y";
import type { Mark } from "../model";
import type { ChartDefinition } from "./chart-definition";
import { layoutSegmentsByPct, normalizeSegments } from "./shared";
import type {
  BitfieldData,
  InterlockingSpec,
  NormalizedInterlocking,
} from "./types";

function interlockingPath(options: {
  height: number;
  isEven: boolean;
  width: number;
  x: number;
  y: number;
}): string {
  const h = Math.max(0, options.height);
  const w = Math.max(0, options.width);
  const x = options.x;
  const y = options.y;

  const xRight = x + w;
  const yBottom = y + h;

  if (options.isEven) {
    const notchY = y + h * 0.6;
    const notchX = x + w * 0.85;
    return `M ${x.toFixed(2)} ${y.toFixed(2)} L ${xRight.toFixed(2)} ${y.toFixed(2)} L ${xRight.toFixed(2)} ${notchY.toFixed(2)} L ${notchX.toFixed(2)} ${notchY.toFixed(2)} L ${notchX.toFixed(2)} ${yBottom.toFixed(2)} L ${x.toFixed(2)} ${yBottom.toFixed(2)} Z`;
  }

  const notchY = y + h * 0.4;
  const notchX = x + w * 0.15;
  return `M ${x.toFixed(2)} ${y.toFixed(2)} L ${xRight.toFixed(2)} ${y.toFixed(2)} L ${xRight.toFixed(2)} ${yBottom.toFixed(2)} L ${notchX.toFixed(2)} ${yBottom.toFixed(2)} L ${notchX.toFixed(2)} ${notchY.toFixed(2)} L ${x.toFixed(2)} ${notchY.toFixed(2)} Z`;
}

export const interlockingChart = {
  a11y(_spec, normalized, _layout) {
    return {
      label: a11yLabelWithSegmentsSummary(
        "Interlocking chart",
        normalized.segments,
      ),
      role: "img",
    };
  },
  category: "bars" as const,
  defaultPad: 0,
  displayName: "Interlocking",
  emptyDataWarningMessage: "No segments data.",
  isEmpty(normalized) {
    return normalized.segments.length === 0;
  },
  marks(spec, normalized, layout) {
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
        className: `mv-interlocking-seg${classSuffix}`,
        d: interlockingPath({
          height: usableH,
          isEven: i % 2 === 0,
          width: run.w,
          x: x0 + run.x,
          y: y0,
        }),
        fill: run.color,
        id: `interlocking-seg-${i}`,
        type: "path",
      });
    }

    return marks;
  },
  normalize(_spec, data) {
    const segments = normalizeSegments(data);
    return { segments, type: "interlocking" as const };
  },
  preferredAspectRatio: "wide" as const,
  type: "interlocking",
} satisfies ChartDefinition<
  "interlocking",
  InterlockingSpec,
  BitfieldData,
  NormalizedInterlocking
>;
