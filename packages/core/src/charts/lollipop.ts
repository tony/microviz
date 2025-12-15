import type { Mark } from "../model";
import type { ChartDefinition } from "./chart-definition";
import { normalizeSegments } from "./shared";
import type { BitfieldData, LollipopSpec, NormalizedLollipop } from "./types";

export const lollipopChart = {
  a11y(_spec, _normalized, _layout) {
    return { label: "Lollipop chart", role: "img" };
  },
  category: "bars" as const,
  defaultPad: 2,
  displayName: "Lollipop",
  emptyDataWarningMessage: "No segments data.",
  isEmpty(normalized) {
    return normalized.segments.length === 0;
  },
  marks(spec, normalized, layout, _state, _theme, _warnings) {
    const usableW = Math.max(0, layout.width - layout.pad * 2);
    const usableH = Math.max(0, layout.height - layout.pad * 2);
    const x0 = layout.pad;
    const y0 = layout.pad;

    const maxItems = spec.maxItems ?? 5;
    const segments = normalized.segments.slice(0, maxItems);
    if (segments.length === 0) return [];

    const maxPct = Math.max(...segments.map((s) => s.pct));
    const stemWidth = spec.stemWidth ?? 4;
    const dotRadius = spec.dotRadius ?? 5;
    const specMinStemHeight = spec.minStemHeight ?? 6;
    // Ensure stem is tall enough to fully contain the dot (dot diameter)
    const minStemHeight = Math.max(specMinStemHeight, dotRadius * 2);

    // Calculate spacing: evenly distribute items across width
    const itemWidth = usableW / segments.length;
    const classSuffix = spec.className ? ` ${spec.className}` : "";

    const marks: Mark[] = [];

    segments.forEach((seg, i) => {
      const centerX = x0 + itemWidth * i + itemWidth / 2;

      // Stem height proportional to pct/maxPct
      const stemHeightPct = (seg.pct / maxPct) * 100;
      const stemHeight = Math.max(
        minStemHeight,
        (stemHeightPct / 100) * (usableH - dotRadius * 2),
      );

      const stemX = centerX - stemWidth / 2;
      const stemY = y0 + usableH - stemHeight;

      // Stem (rect)
      marks.push({
        className: `mv-lollipop-stem${classSuffix}`,
        fill: seg.color,
        h: stemHeight,
        id: `lollipop-stem-${i}`,
        rx: stemWidth / 2,
        ry: stemWidth / 2,
        type: "rect",
        w: stemWidth,
        x: stemX,
        y: stemY,
      });

      // Dot (circle) at top of stem
      const dotCy = stemY + dotRadius;
      marks.push({
        className: `mv-lollipop-dot${classSuffix}`,
        cx: centerX,
        cy: dotCy,
        fill: seg.color,
        id: `lollipop-dot-${i}`,
        r: dotRadius,
        type: "circle",
      });
    });

    return marks;
  },
  normalize(_spec, data) {
    const segments = normalizeSegments(data);
    return { segments, type: "lollipop" as const };
  },
  type: "lollipop",
} satisfies ChartDefinition<
  "lollipop",
  LollipopSpec,
  BitfieldData,
  NormalizedLollipop
>;
