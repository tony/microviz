import { a11yItemsForSegments, a11yLabelWithSegmentsSummary } from "../a11y";
import type { Mark } from "../model";
import type { ChartDefinition } from "./chart-definition";
import { coerceFiniteNonNegative, normalizeSegments } from "./shared";
import type {
  BitfieldData,
  MatryoshkaSpec,
  NormalizedMatryoshka,
} from "./types";

export const matryoshkaChart = {
  a11y(_spec, normalized, _layout) {
    return {
      items: a11yItemsForSegments(normalized.segments, {
        idPrefix: "matryoshka-seg",

        labelFallback: "Segment",
      }),
      label: a11yLabelWithSegmentsSummary(
        "Matryoshka chart",
        normalized.segments,
      ),
      role: "img",
    };
  },
  category: "bars" as const,
  defaultPad: 0,
  displayName: "Matryoshka",
  emptyDataWarningMessage: "No segments data.",
  isEmpty(normalized) {
    return normalized.segments.length === 0;
  },
  marks(spec, normalized, layout, _state, _theme, warnings) {
    const { segments } = normalized;
    if (segments.length === 0) return [];

    const { width, height, pad } = layout;
    const usableW = Math.max(0, width - pad * 2);
    const usableH = Math.max(0, height - pad * 2);
    const x0 = pad;
    const y0 = pad;

    const heightDecrement = coerceFiniteNonNegative(
      spec.heightDecrement ?? 14,
      14,
      warnings,
      "Non-finite matryoshka heightDecrement; defaulted to 14.",
    );

    const cornerRadius = coerceFiniteNonNegative(
      spec.cornerRadius ?? 4,
      4,
      warnings,
      "Non-finite matryoshka cornerRadius; defaulted to 4.",
    );

    const classSuffix = spec.className ? ` ${spec.className}` : "";

    // Calculate cumulative percentages from each segment to the end
    // Each bar shows the cumulative width of current + remaining segments
    const cumulativeFromEnd: number[] = [];
    let runningTotal = 0;
    for (let i = segments.length - 1; i >= 0; i--) {
      runningTotal += segments[i].pct;
      cumulativeFromEnd[i] = runningTotal;
    }

    // Normalize to ensure cumulative widths are relative to total
    const totalPct = segments.reduce((sum, s) => sum + s.pct, 0) || 1;

    const marks: Mark[] = [];

    // Create bars from first (widest) to last (narrowest)
    // Each bar is positioned at x0, with width based on cumulative percentage
    for (const [i, seg] of segments.entries()) {
      const cumPct = cumulativeFromEnd[i] ?? 0;
      const w = (cumPct / totalPct) * usableW;
      if (w <= 0) continue;

      // Height decreases per layer, centered vertically
      const heightPct = Math.max(30, 100 - i * heightDecrement);
      const h = (heightPct / 100) * usableH;
      const y = y0 + (usableH - h) / 2;

      // Only round the right side (rx on right corners)
      const rx = Math.min(cornerRadius, w / 2, h / 2);

      marks.push({
        className: `mv-matryoshka-shell${classSuffix}`,
        fill: seg.color,
        h,
        id: `matryoshka-shell-${i}`,
        rx,
        ry: rx,
        type: "rect" as const,
        w,
        x: x0,
        y,
      });
    }

    return marks;
  },
  normalize(_spec, data) {
    const segments = normalizeSegments(data);
    return { segments, type: "matryoshka" as const };
  },
  preferredAspectRatio: "wide" as const,
  type: "matryoshka",
} satisfies ChartDefinition<
  "matryoshka",
  MatryoshkaSpec,
  BitfieldData,
  NormalizedMatryoshka
>;
