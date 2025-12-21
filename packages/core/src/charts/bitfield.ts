import { a11yLabelWithSegmentsSummary } from "../a11y";
import type { Def, Mark, PatternMark } from "../model";
import type { ChartDefinition } from "./chart-definition";
import {
  allocateUnitsByPct,
  coerceFiniteInt,
  coerceFiniteNonNegative,
  normalizeSegments,
} from "./shared";
import type { BitfieldData, BitfieldSpec, NormalizedBitfield } from "./types";

const maskId = "mv-bitfield-mask";

export const bitfieldChart = {
  a11y(_spec, normalized, _layout) {
    return {
      label: a11yLabelWithSegmentsSummary(
        "Bitfield chart",
        normalized.segments,
      ),
      role: "img",
    };
  },
  category: "dots" as const,
  defaultPad: 0,
  defs(spec, normalized, layout, warnings): Def[] {
    const segments = normalized.segments;
    if (segments.length === 0) return [];

    const cellSize = coerceFiniteInt(
      spec.cellSize ?? 4,
      4,
      1,
      undefined,
      "Non-finite bitfield cell size; defaulted to 4.",
    );
    const dotRadius = coerceFiniteNonNegative(
      spec.dotRadius ?? 1.6,
      1.6,
      warnings,
      "Non-finite bitfield dot radius; defaulted to 1.6.",
    );

    const usableW = Math.max(0, layout.width - layout.pad * 2);
    const usableH = Math.max(0, layout.height - layout.pad * 2);

    const cols = Math.max(1, Math.floor(usableW / cellSize));
    const rows = Math.max(1, Math.floor(usableH / cellSize));

    const x0 = layout.pad;
    const y0 = layout.pad;

    const marks: PatternMark[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cx = x0 + (c + 0.5) * cellSize;
        const cy = y0 + (r + 0.5) * cellSize;
        marks.push({
          className: "mv-bitfield-mask-dot",
          cx,
          cy,
          fill: "white",
          r: dotRadius,
          type: "circle",
        });
      }
    }

    return [
      {
        height: layout.height,
        id: maskId,
        marks,
        maskContentUnits: "userSpaceOnUse",
        maskUnits: "userSpaceOnUse",
        type: "mask",
        width: layout.width,
        x: 0,
        y: 0,
      },
    ];
  },
  displayName: "Bitfield",
  emptyDataWarningMessage: "No segments data.",
  isEmpty(normalized) {
    return normalized.segments.length === 0;
  },
  marks(spec, normalized, layout, _state, _theme, warnings) {
    const cellSize = coerceFiniteInt(
      spec.cellSize ?? 4,
      4,
      1,
      warnings,
      "Non-finite bitfield cell size; defaulted to 4.",
    );
    const usableW = Math.max(0, layout.width - layout.pad * 2);
    const usableH = Math.max(0, layout.height - layout.pad * 2);

    const cols = Math.max(1, Math.floor(usableW / cellSize));
    const rows = Math.max(1, Math.floor(usableH / cellSize));

    const marks: Mark[] = [];
    const segments = normalized.segments;
    if (segments.length === 0) return marks;

    const gridW = cols * cellSize;
    const gridH = rows * cellSize;
    const x0 = layout.pad;
    const y0 = layout.pad;

    const counts = allocateUnitsByPct(segments, cols);
    const classSuffix = spec.className ? ` ${spec.className}` : "";

    let x = x0;
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      if (!seg) continue;
      const count = counts[i] ?? 0;
      if (count <= 0) continue;

      const w =
        i === segments.length - 1
          ? Math.max(0, gridW - (x - x0))
          : count * cellSize;
      marks.push({
        className: `mv-bitfield-seg${classSuffix}`,
        fill: seg.color,
        h: gridH,
        id: `bitfield-seg-${i}`,
        mask: maskId,
        type: "rect",
        w,
        x,
        y: y0,
      });
      x += w;
    }

    return marks;
  },
  normalize(_spec, data) {
    const segments = normalizeSegments(data);
    return { segments, type: "bitfield" };
  },
  preferredAspectRatio: "wide" as const,
  type: "bitfield",
} satisfies ChartDefinition<
  "bitfield",
  BitfieldSpec,
  BitfieldData,
  NormalizedBitfield
>;
