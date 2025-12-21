import { a11yItemsForSegments, a11yLabelWithSegmentsSummary } from "../a11y";
import type { Mark } from "../model";
import { interleaveCounts } from "../utils/math";
import type { ChartDefinition } from "./chart-definition";
import {
  allocateUnitsByPct,
  coerceFiniteInt,
  coerceFiniteNonNegative,
  distributeTrackWidths,
  expandSegmentColors,
  isIntegerish,
  normalizeSegments,
} from "./shared";
import type { BitfieldData, NormalizedPixelGrid, PixelGridSpec } from "./types";

export const pixelGridChart = {
  a11y(_spec, normalized, _layout) {
    return {
      items: a11yItemsForSegments(normalized.segments, {
        idPrefix: "pixel-grid-seg",

        labelFallback: "Segment",
      }),
      label: a11yLabelWithSegmentsSummary(
        "Pixel grid chart",
        normalized.segments,
      ),
      role: "img",
    };
  },
  category: "grids" as const,
  defaultPad: 0,
  displayName: "Pixel grid",
  emptyDataWarningMessage: "No segments data.",
  isEmpty(normalized) {
    return normalized.segments.length === 0;
  },
  marks(spec, normalized, layout, _state, _theme, warnings) {
    const cols = coerceFiniteInt(
      spec.cols ?? 16,
      16,
      1,
      warnings,
      "Non-finite pixel-grid cols; defaulted to 16.",
    );
    const rows = coerceFiniteInt(
      spec.rows ?? 2,
      2,
      1,
      warnings,
      "Non-finite pixel-grid rows; defaulted to 2.",
    );
    const totalCells = cols * rows;
    if (totalCells <= 0) return [];

    const segments = normalized.segments;
    if (segments.length === 0) return [];

    const counts = allocateUnitsByPct(segments, totalCells);
    const useInterleave = spec.interleave === true;
    const interleaved = useInterleave ? interleaveCounts(counts) : null;
    const cells = useInterleave ? null : expandSegmentColors(segments, counts);
    if (!useInterleave && (!cells || cells.length === 0)) return [];

    function fillAt(i: number): string {
      if (useInterleave) {
        const segIdx =
          interleaved?.[i] ?? interleaved?.[interleaved.length - 1];
        const fallback = segments[segments.length - 1];
        const seg =
          segIdx === undefined ? fallback : (segments[segIdx] ?? fallback);
        return seg?.color ?? "currentColor";
      }

      const cell = cells?.[i] ?? cells?.[cells.length - 1];
      return cell?.color ?? "currentColor";
    }

    const usableW = Math.max(0, layout.width - layout.pad * 2);
    const usableH = Math.max(0, layout.height - layout.pad * 2);
    const gapRequested = coerceFiniteNonNegative(
      spec.gap ?? 2,
      2,
      warnings,
      "Non-finite pixel-grid gap; defaulted to 2.",
    );
    const gapX = cols <= 1 ? 0 : Math.min(gapRequested, usableW / (cols - 1));
    const gapY = rows <= 1 ? 0 : Math.min(gapRequested, usableH / (rows - 1));

    const x0 = layout.pad;
    const y0 = layout.pad;

    const classSuffix = spec.className ? ` ${spec.className}` : "";

    const canSnap =
      isIntegerish(x0) &&
      isIntegerish(y0) &&
      isIntegerish(usableW) &&
      isIntegerish(usableH) &&
      isIntegerish(gapX) &&
      isIntegerish(gapY);

    if (canSnap) {
      const x0Px = Math.round(x0);
      const y0Px = Math.round(y0);
      const usableWPx = Math.round(usableW);
      const usableHPx = Math.round(usableH);
      const gapXPx = cols <= 1 ? 0 : Math.round(gapX);
      const gapYPx = rows <= 1 ? 0 : Math.round(gapY);
      const availableWPx = Math.max(0, usableWPx - gapXPx * (cols - 1));
      const availableHPx = Math.max(0, usableHPx - gapYPx * (rows - 1));
      const colWidths = distributeTrackWidths(availableWPx, cols);
      const rowHeights = distributeTrackWidths(availableHPx, rows);

      const colStarts: number[] = [];
      let x = x0Px;
      for (let c = 0; c < cols; c++) {
        colStarts.push(x);
        x += (colWidths[c] ?? 0) + gapXPx;
      }

      const rowStarts: number[] = [];
      let y = y0Px;
      for (let r = 0; r < rows; r++) {
        rowStarts.push(y);
        y += (rowHeights[r] ?? 0) + gapYPx;
      }

      const marks: Mark[] = [];
      let cellIndex = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          marks.push({
            className: `mv-pixel-grid-cell${classSuffix}`,
            fill: fillAt(cellIndex),
            h: rowHeights[r] ?? 0,
            id: `pixel-grid-cell-${cellIndex}`,
            type: "rect",
            w: colWidths[c] ?? 0,
            x: colStarts[c] ?? x0Px,
            y: rowStarts[r] ?? y0Px,
          });
          cellIndex += 1;
        }
      }

      return marks;
    }

    const totalGapX = gapX * Math.max(0, cols - 1);
    const totalGapY = gapY * Math.max(0, rows - 1);
    const cellW = Math.max(0, (usableW - totalGapX) / cols);
    const cellH = Math.max(0, (usableH - totalGapY) / rows);
    const xEnd = x0 + usableW;
    const yEnd = y0 + usableH;

    const marks: Mark[] = [];
    let cellIndex = 0;
    for (let r = 0; r < rows; r++) {
      const y = y0 + r * (cellH + gapY);
      const h = r === rows - 1 ? yEnd - y : cellH;
      for (let c = 0; c < cols; c++) {
        const x = x0 + c * (cellW + gapX);
        const w = c === cols - 1 ? xEnd - x : cellW;
        marks.push({
          className: `mv-pixel-grid-cell${classSuffix}`,
          fill: fillAt(cellIndex),
          h,
          id: `pixel-grid-cell-${cellIndex}`,
          type: "rect",
          w,
          x,
          y,
        });
        cellIndex += 1;
      }
    }

    return marks;
  },
  normalize(_spec, data) {
    const segments = normalizeSegments(data);
    return { segments, type: "pixel-grid" };
  },
  preferredAspectRatio: "square" as const,
  type: "pixel-grid",
} satisfies ChartDefinition<
  "pixel-grid",
  PixelGridSpec,
  BitfieldData,
  NormalizedPixelGrid
>;
