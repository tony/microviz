import { a11yLabelWithSeriesSummary } from "../a11y";
import type { ChartDefinition } from "./chart-definition";
import { coerceFiniteInt, isFiniteNumber, normalizedPct } from "./shared";
import type { HeatgridData, HeatgridSpec, NormalizedHeatgrid } from "./types";

export const heatgridChart = {
  a11y(_spec, normalized, _layout) {
    return {
      label: a11yLabelWithSeriesSummary("Heatgrid chart", normalized.series),
      role: "img",
    };
  },
  category: "grids" as const,
  defaultPad: 0,
  displayName: "Heatgrid",
  emptyDataWarningMessage: "No series data.",
  isEmpty(normalized) {
    return normalized.series.length === 0;
  },
  marks(spec, normalized, layout, _state, _theme, warnings) {
    const cols = coerceFiniteInt(
      spec.cols ?? 12,
      12,
      1,
      warnings,
      "Non-finite heatgrid cols; defaulted to 12.",
    );
    const rows = coerceFiniteInt(
      spec.rows ?? 4,
      4,
      1,
      warnings,
      "Non-finite heatgrid rows; defaulted to 4.",
    );
    const total = cols * rows;
    if (total <= 0) return [];

    const cells: Array<{ i: number; srcIdx: number; value: number }> = [];
    for (let i = 0; i < total; i++) {
      const t = total === 1 ? 0 : i / (total - 1);
      const srcIdx =
        normalized.series.length <= 1
          ? 0
          : Math.round(t * (normalized.series.length - 1));
      cells.push({
        i,
        srcIdx,
        value: normalizedPct(normalized.series[srcIdx] ?? 0),
      });
    }

    return cells.map((cell) => {
      const c = cell.i % cols;
      const r = Math.floor(cell.i / cols);
      const cellW = layout.width / cols;
      const cellH = layout.height / rows;
      const x = c * cellW + 0.8;
      const y = r * cellH + 0.8;
      const w = Math.max(0, cellW - 1.6);
      const h = Math.max(0, cellH - 1.6);
      const baseOpacity = 0.08 + 0.72 * (cell.value / 100);
      const fadeOpacity = normalized.opacities
        ? (normalized.opacities[cell.srcIdx] ?? 1)
        : 1;
      return {
        className: `mv-heatgrid-cell${spec.className ? ` ${spec.className}` : ""}`,
        fillOpacity: baseOpacity * fadeOpacity,
        h,
        id: `heatgrid-cell-${cell.i}`,
        rx: 1.2,
        ry: 1.2,
        type: "rect",
        w,
        x,
        y,
      };
    });
  },
  normalize(_spec, data) {
    const series = data.series.filter(isFiniteNumber);
    const opacities = data.opacities?.filter(isFiniteNumber);
    return { opacities, series, type: "heatgrid" };
  },
  type: "heatgrid",
} satisfies ChartDefinition<
  "heatgrid",
  HeatgridSpec,
  HeatgridData,
  NormalizedHeatgrid
>;
