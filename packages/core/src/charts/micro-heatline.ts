import { a11yLabelWithSegmentsSummary } from "../a11y";
import type { Mark } from "../model";
import type { ChartDefinition } from "./chart-definition";
import { coerceFiniteNonNegative, normalizeSegments } from "./shared";
import type {
  BitfieldData,
  MicroHeatlineSpec,
  NormalizedMicroHeatline,
} from "./types";

export const microHeatlineChart = {
  a11y(_spec, normalized, _layout) {
    return {
      label: a11yLabelWithSegmentsSummary(
        "Micro heatline chart",
        normalized.segments,
      ),
      role: "img",
    };
  },
  category: "lines" as const,
  defaultPad: 0,
  displayName: "Micro heatline",
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

    const maxLines = spec.maxLines ?? 6;
    const lineHeight = coerceFiniteNonNegative(
      spec.lineHeight ?? 2,
      2,
      warnings,
      "Non-finite micro-heatline lineHeight; defaulted to 2.",
    );
    const gap = coerceFiniteNonNegative(
      spec.gap ?? 2,
      2,
      warnings,
      "Non-finite micro-heatline gap; defaulted to 2.",
    );

    const displaySegments = segments.slice(0, maxLines);
    const numLines = displaySegments.length;
    const maxPct = Math.max(...displaySegments.map((seg) => seg.pct), 0);

    // Calculate total height needed and center vertically
    const totalLinesHeight = numLines * lineHeight + (numLines - 1) * gap;
    const yOffset = y0 + (usableH - totalLinesHeight) / 2;

    const classSuffix = spec.className ? ` ${spec.className}` : "";

    const marks: Mark[] = [];

    for (let i = 0; i < displaySegments.length; i++) {
      const seg = displaySegments[i];
      if (!seg) continue;

      const lineW = maxPct > 0 ? (seg.pct / maxPct) * usableW : 0;
      const lineY = yOffset + i * (lineHeight + gap);

      marks.push({
        className: `mv-micro-heatline-seg${classSuffix}`,
        fill: seg.color,
        h: lineHeight,
        id: `micro-heatline-seg-${i}`,
        rx: lineHeight / 2,
        ry: lineHeight / 2,
        type: "rect" as const,
        w: lineW,
        x: x0,
        y: lineY,
      });
    }

    return marks;
  },
  normalize(_spec, data) {
    const segments = normalizeSegments(data);
    return { segments, type: "micro-heatline" as const };
  },
  type: "micro-heatline",
} satisfies ChartDefinition<
  "micro-heatline",
  MicroHeatlineSpec,
  BitfieldData,
  NormalizedMicroHeatline
>;
