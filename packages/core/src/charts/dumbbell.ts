import type { ChartDefinition } from "./chart-definition";
import { clamp, coerceFiniteNonNegative, isFiniteNumber } from "./shared";
import type { DumbbellData, DumbbellSpec, NormalizedDumbbell } from "./types";

export const dumbbellChart = {
  a11y(_spec, normalized, _layout) {
    const pctCurrent =
      normalized.max === 0
        ? 0
        : Math.round((normalized.current / normalized.max) * 100);
    const pctTarget =
      normalized.max === 0
        ? 0
        : Math.round((normalized.target / normalized.max) * 100);
    return {
      label: `Dumbbell chart (current ${pctCurrent}%, target ${pctTarget}%)`,
      role: "img",
    };
  },
  category: "lines" as const,
  defaultPad: 6,
  displayName: "Dumbbell",
  isEmpty(_normalized) {
    return false;
  },
  marks(spec, normalized, layout, _state, _theme, warnings) {
    const x0 = layout.pad;
    const x1 = layout.width - layout.pad;
    const y = layout.height / 2;

    const dotRadius = coerceFiniteNonNegative(
      spec.dotRadius ?? 4,
      4,
      warnings,
      "Non-finite dumbbell dot radius; defaulted to 4.",
    );

    const trackStrokeWidth = coerceFiniteNonNegative(
      spec.trackStrokeWidth ?? 3,
      3,
      warnings,
      "Non-finite dumbbell track stroke width; defaulted to 3.",
    );
    const rangeStrokeWidth = coerceFiniteNonNegative(
      spec.rangeStrokeWidth ?? 3.5,
      3.5,
      warnings,
      "Non-finite dumbbell range stroke width; defaulted to 3.5.",
    );

    const trackStrokeOpacity = coerceFiniteNonNegative(
      spec.trackStrokeOpacity ?? 0.15,
      0.15,
      warnings,
      "Non-finite dumbbell track stroke opacity; defaulted to 0.15.",
    );
    const rangeStrokeOpacity = coerceFiniteNonNegative(
      spec.rangeStrokeOpacity ?? 0.7,
      0.7,
      warnings,
      "Non-finite dumbbell range stroke opacity; defaulted to 0.7.",
    );

    const targetFillOpacity = coerceFiniteNonNegative(
      spec.targetFillOpacity ?? 0.25,
      0.25,
      warnings,
      "Non-finite dumbbell target fill opacity; defaulted to 0.25.",
    );
    const targetStrokeOpacity = coerceFiniteNonNegative(
      spec.targetStrokeOpacity ?? 0.65,
      0.65,
      warnings,
      "Non-finite dumbbell target stroke opacity; defaulted to 0.65.",
    );
    const targetStrokeWidth = coerceFiniteNonNegative(
      spec.targetStrokeWidth ?? 1.4,
      1.4,
      warnings,
      "Non-finite dumbbell target stroke width; defaulted to 1.4.",
    );

    const toX = (v: number) =>
      x0 + (clamp(v, 0, normalized.max) / normalized.max) * (x1 - x0);
    const cx = toX(normalized.current);
    const tx = toX(normalized.target);
    const xMin = Math.min(cx, tx);
    const xMax = Math.max(cx, tx);

    const classSuffix = spec.className ? ` ${spec.className}` : "";

    return [
      {
        className: `mv-dumbbell-track${classSuffix}`,
        id: "dumbbell-track",
        opacity: 1,
        strokeLinecap: "round",
        strokeOpacity: trackStrokeOpacity,
        strokeWidth: trackStrokeWidth,
        type: "line",
        x1: x0,
        x2: x1,
        y1: y,
        y2: y,
      },
      {
        className: `mv-dumbbell-range${classSuffix}`,
        id: "dumbbell-range",
        opacity: 1,
        strokeLinecap: "round",
        strokeOpacity: rangeStrokeOpacity,
        strokeWidth: rangeStrokeWidth,
        type: "line",
        x1: xMin,
        x2: xMax,
        y1: y,
        y2: y,
      },
      {
        className: `mv-dumbbell-current${classSuffix}`,
        cx,
        cy: y,
        id: "dumbbell-current",
        r: dotRadius,
        type: "circle",
      },
      {
        className: `mv-dumbbell-target${classSuffix}`,
        cx: tx,
        cy: y,
        fillOpacity: targetFillOpacity,
        id: "dumbbell-target",
        r: dotRadius,
        strokeOpacity: targetStrokeOpacity,
        strokeWidth: targetStrokeWidth,
        type: "circle",
      },
    ];
  },
  normalize(_spec, data) {
    const maxRaw = data.max ?? 100;
    const max = isFiniteNumber(maxRaw) ? maxRaw : 100;
    const safeMax = max <= 0 ? 100 : max;
    const current = isFiniteNumber(data.current) ? data.current : 0;
    const target = isFiniteNumber(data.target) ? data.target : 0;
    return {
      current: clamp(current, 0, safeMax),
      max: safeMax,
      target: clamp(target, 0, safeMax),
      type: "dumbbell",
    };
  },
  type: "dumbbell",
} satisfies ChartDefinition<
  "dumbbell",
  DumbbellSpec,
  DumbbellData,
  NormalizedDumbbell
>;
