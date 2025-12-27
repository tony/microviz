import { a11yItemsForSegments, a11yLabelWithSegmentsSummary } from "../a11y";
import type { Mark } from "../model";
import type { ChartDefinition } from "./chart-definition";
import { layoutSegmentsByPct, normalizeSegments } from "./shared";
import type { BitfieldData, DnaHelixSpec, NormalizedDnaHelix } from "./types";

export const dnaHelixChart = {
  a11y(_spec, normalized, _layout) {
    return {
      items: a11yItemsForSegments(normalized.segments, {
        idPrefix: "dna-helix-seg",

        labelFallback: "Segment",
      }),
      label: a11yLabelWithSegmentsSummary(
        "DNA helix chart",
        normalized.segments,
      ),
      role: "img",
    };
  },
  category: "lines" as const,
  defaultPad: 2,
  displayName: "DNA helix",
  emptyDataWarningMessage: "No segments data.",
  isEmpty(normalized) {
    return normalized.segments.length === 0;
  },
  marks(spec, normalized, layout, _state, _theme, warnings) {
    const { segments } = normalized;
    const { width, height, pad } = layout;

    const gap = spec.gap ?? 2;
    const strandGap = spec.strandGap ?? 4;
    const strandHeight = spec.strandHeight ?? 6;

    const usableW = Math.max(0, width - pad * 2);
    const usableH = Math.max(0, height - pad * 2);
    const x0 = pad;
    const y0 = pad;

    // Calculate available height for two strands
    const totalStrandHeight = strandHeight * 2 + strandGap;
    const topY = y0 + (usableH - totalStrandHeight) / 2;
    const bottomY = topY + strandHeight + strandGap;

    // Layout segments horizontally
    const segmentLayouts = layoutSegmentsByPct(segments, usableW, gap);

    // Rounded corners for pill shape
    const rx = strandHeight / 2;
    const ry = strandHeight / 2;

    const classSuffix = spec.className ? ` ${spec.className}` : "";

    // Create marks - alternating which strand is "on top"
    const bottomStrand: Mark[] = [];
    const topStrand: Mark[] = [];

    for (const [i, seg] of segmentLayouts.entries()) {
      // Even indices: top strand is on top (rendered second)
      // Odd indices: bottom strand is on top (rendered second)
      const isTopOnTop = i % 2 === 0;

      const topRect: Mark = {
        className: `mv-dna-helix-top${classSuffix}`,
        fill: seg.color,
        h: strandHeight,
        id: `dna-helix-top-${i}`,
        rx,
        ry,
        type: "rect" as const,
        w: seg.w,
        x: x0 + seg.x,
        y: topY,
      };

      const bottomRect: Mark = {
        className: `mv-dna-helix-bottom${classSuffix}`,
        fill: seg.color,
        h: strandHeight,
        id: `dna-helix-bottom-${i}`,
        rx,
        ry,
        type: "rect" as const,
        w: seg.w,
        x: x0 + seg.x,
        y: bottomY,
      };

      if (isTopOnTop) {
        // Render bottom first, top second (top appears on top)
        bottomStrand.push(bottomRect);
        topStrand.push(topRect);
      } else {
        // Render top first, bottom second (bottom appears on top)
        topStrand.push(topRect);
        bottomStrand.push(bottomRect);
      }

      // Validate coordinates
      if (
        warnings &&
        (Number.isNaN(seg.x) ||
          Number.isNaN(seg.w) ||
          Number.isNaN(topY) ||
          Number.isNaN(bottomY))
      ) {
        warnings.push({
          code: "NAN_COORDINATE",
          message: `DNA helix segment ${i} has NaN coordinates`,
          phase: "compute",
        });
      }
    }

    // Return marks in order: bottom strand segments, then top strand segments
    // For alternating segments, this creates the weaving effect
    return [...bottomStrand, ...topStrand];
  },
  normalize(_spec, data) {
    const segments = normalizeSegments(data);
    return { segments, type: "dna-helix" as const };
  },
  preferredAspectRatio: "wide" as const,
  type: "dna-helix",
} satisfies ChartDefinition<
  "dna-helix",
  DnaHelixSpec,
  BitfieldData,
  NormalizedDnaHelix
>;
