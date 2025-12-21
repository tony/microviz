import { a11yItemsForSegments, a11yLabelWithSegmentsSummary } from "../a11y";
import type { Mark } from "../model";
import type { ChartDefinition } from "./chart-definition";
import {
  coerceFiniteInt,
  coerceFiniteNonNegative,
  normalizeSegments,
} from "./shared";
import type { BitfieldData, NormalizedShapeRow, ShapeRowSpec } from "./types";

export const shapeRowChart = {
  a11y(_spec, normalized, _layout) {
    return {
      items: a11yItemsForSegments(normalized.segments, {
        idPrefix: "shape-row-seg",

        labelFallback: "Segment",
      }),
      label: a11yLabelWithSegmentsSummary(
        "Shape row chart",
        normalized.segments,
      ),
      role: "img",
    };
  },
  category: "dots" as const,
  defaultPad: 0,
  displayName: "Shape row",
  emptyDataWarningMessage: "No segments data.",
  isEmpty(normalized) {
    return normalized.segments.length === 0;
  },
  marks(spec, normalized, layout, _state, _theme, warnings) {
    const segments = normalized.segments;
    if (segments.length === 0) return [];

    const maxShapesRequested = coerceFiniteInt(
      spec.maxShapes ?? 4,
      4,
      1,
      warnings,
      "Non-finite shape-row maxShapes; defaulted to 4.",
    );
    const maxShapes = Math.min(segments.length, maxShapesRequested);
    if (maxShapes <= 0) return [];

    const usableW = Math.max(0, layout.width - layout.pad * 2);
    const usableH = Math.max(0, layout.height - layout.pad * 2);
    if (usableW <= 0 || usableH <= 0) return [];

    const x0 = layout.pad;
    const y0 = layout.pad;
    const cy = y0 + usableH / 2;

    const shapeSizeDefault = usableH * 0.75;
    const shapeSizeRequested = coerceFiniteNonNegative(
      spec.shapeSize ?? shapeSizeDefault,
      shapeSizeDefault,
      warnings,
      "Non-finite shape-row shapeSize; defaulted to 75% of chart height.",
    );
    const shapeSize = Math.min(usableH, shapeSizeRequested);
    const half = shapeSize / 2;

    const cornerRadiusDefault = Math.min(1, shapeSize / 6);
    const cornerRadiusRequested = coerceFiniteNonNegative(
      spec.cornerRadius ?? cornerRadiusDefault,
      cornerRadiusDefault,
      warnings,
      "Non-finite shape-row cornerRadius; defaulted to 1.",
    );
    const cornerRadius = Math.min(half, cornerRadiusRequested);

    const topY = cy - half;
    const bottomY = cy + half;
    const triHalfW = half * (7 / 6);

    const classSuffix = spec.className ? ` ${spec.className}` : "";

    const marks: Mark[] = [];
    for (let i = 0; i < maxShapes; i++) {
      const seg = segments[i];
      if (!seg) continue;

      const cx = x0 + (usableW * (i + 0.5)) / maxShapes;
      const fill = seg.color;
      const id = `shape-row-shape-${i}`;
      const className = `mv-shape-row-shape${classSuffix}`;

      switch (i % 4) {
        case 0:
          marks.push({ className, cx, cy, fill, id, r: half, type: "circle" });
          break;
        case 1:
          marks.push({
            className,
            fill,
            h: shapeSize,
            id,
            rx: cornerRadius,
            ry: cornerRadius,
            type: "rect",
            w: shapeSize,
            x: cx - half,
            y: cy - half,
          });
          break;
        case 2: {
          const d = `M ${cx.toFixed(2)} ${topY.toFixed(2)} L ${(cx + triHalfW).toFixed(2)} ${bottomY.toFixed(2)} H ${(cx - triHalfW).toFixed(2)} Z`;
          marks.push({ className, d, fill, id, type: "path" });
          break;
        }
        default: {
          const d = [
            `M ${cx.toFixed(2)} ${topY.toFixed(2)}`,
            `L ${(cx + half).toFixed(2)} ${cy.toFixed(2)}`,
            `L ${cx.toFixed(2)} ${bottomY.toFixed(2)}`,
            `L ${(cx - half).toFixed(2)} ${cy.toFixed(2)}`,
            "Z",
          ].join(" ");
          marks.push({ className, d, fill, id, type: "path" });
        }
      }
    }

    return marks;
  },
  normalize(_spec, data) {
    const segments = normalizeSegments(data);
    return { segments, type: "shape-row" as const };
  },
  preferredAspectRatio: "wide" as const,
  type: "shape-row",
} satisfies ChartDefinition<
  "shape-row",
  ShapeRowSpec,
  BitfieldData,
  NormalizedShapeRow
>;
