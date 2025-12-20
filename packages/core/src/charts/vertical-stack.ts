import type { Mark } from "../model";
import type { ChartDefinition } from "./chart-definition";
import { normalizeSegments } from "./shared";
import type {
  BitfieldData,
  NormalizedVerticalStack,
  VerticalStackSpec,
} from "./types";

export const verticalStackChart = {
  a11y(_spec, _normalized, _layout) {
    return { label: "Vertical stack chart", role: "img" };
  },
  category: "bars" as const,
  defaultPad: 0,
  displayName: "Vertical Stack",
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

    // Normalize percentages to ensure they sum to 100
    const totalPct = segments.reduce((sum, s) => sum + s.pct, 0);
    const normalizedSegments =
      totalPct > 0
        ? segments.map((s) => ({ ...s, pct: (s.pct / totalPct) * 100 }))
        : segments;

    const classSuffix = spec.className ? ` ${spec.className}` : "";
    const baseRadius = Math.min(usableW / 2, 4);
    const hasRadius = baseRadius > 0 && normalizedSegments.length > 0;

    const marks: Mark[] = [];
    let y = y0;

    for (let i = 0; i < normalizedSegments.length; i++) {
      const seg = normalizedSegments[i];
      if (!seg) continue;

      const h = (seg.pct / 100) * usableH;
      if (h <= 0) continue;

      const className = `mv-vertical-stack-seg${classSuffix}`;
      const fill = seg.color;

      if (!hasRadius) {
        marks.push({
          className,
          fill,
          h,
          id: `vertical-stack-seg-${i}`,
          type: "rect",
          w: usableW,
          x: x0,
          y,
        });
        y += h;
        continue;
      }

      const isFirst = i === 0;
      const isLast = i === normalizedSegments.length - 1;
      const isSingle = normalizedSegments.length === 1;
      const radius = Math.min(baseRadius, h / 2);

      if (isSingle) {
        marks.push({
          className,
          fill,
          h,
          id: `vertical-stack-seg-${i}`,
          rx: radius,
          ry: radius,
          type: "rect",
          w: usableW,
          x: x0,
          y,
        });
        y += h;
        continue;
      }

      if (isFirst) {
        // First segment: rounded top corners
        marks.push({
          className,
          fill,
          h,
          id: `vertical-stack-seg-${i}`,
          rx: radius,
          ry: radius,
          type: "rect",
          w: usableW,
          x: x0,
          y,
        });
        // Cover the bottom rounded corners with a rect
        const innerH = Math.max(0, h - radius);
        if (innerH > 0) {
          marks.push({
            className,
            fill,
            h: innerH,
            id: `vertical-stack-seg-${i}-inner`,
            type: "rect",
            w: usableW,
            x: x0,
            y: y + radius,
          });
        }
        y += h;
        continue;
      }

      if (isLast) {
        // Last segment: rounded bottom corners
        marks.push({
          className,
          fill,
          h,
          id: `vertical-stack-seg-${i}`,
          rx: radius,
          ry: radius,
          type: "rect",
          w: usableW,
          x: x0,
          y,
        });
        // Cover the top rounded corners with a rect
        const innerH = Math.max(0, h - radius);
        if (innerH > 0) {
          marks.push({
            className,
            fill,
            h: innerH,
            id: `vertical-stack-seg-${i}-inner`,
            type: "rect",
            w: usableW,
            x: x0,
            y,
          });
        }
        y += h;
        continue;
      }

      // Middle segments: no rounding
      marks.push({
        className,
        fill,
        h,
        id: `vertical-stack-seg-${i}`,
        type: "rect",
        w: usableW,
        x: x0,
        y,
      });
      y += h;
    }

    return marks;
  },
  normalize(_spec, data) {
    const segments = normalizeSegments(data);
    return { segments, type: "vertical-stack" as const };
  },
  preferredAspectRatio: "tall" as const,
  type: "vertical-stack",
} satisfies ChartDefinition<
  "vertical-stack",
  VerticalStackSpec,
  BitfieldData,
  NormalizedVerticalStack
>;
