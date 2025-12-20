import type { ChartDefinition } from "./chart-definition";
import { clamp, coerceFiniteNonNegative, isFiniteNumber } from "./shared";
import type {
  BulletDeltaData,
  BulletDeltaSpec,
  NormalizedBulletDelta,
} from "./types";

export const bulletDeltaChart = {
  a11y(_spec, normalized, _layout) {
    const pctCurrent =
      normalized.max === 0
        ? 0
        : Math.round((normalized.current / normalized.max) * 100);
    const pctPrevious =
      normalized.max === 0
        ? 0
        : Math.round((normalized.previous / normalized.max) * 100);
    return {
      label: `Bullet delta chart (current ${pctCurrent}%, previous ${pctPrevious}%)`,
      role: "img",
    };
  },
  category: "lines" as const,
  defaultPad: 4,
  displayName: "Bullet delta",
  isEmpty(_normalized) {
    return false;
  },
  marks(spec, normalized, layout, _state, _theme, warnings) {
    const x0 = layout.pad;
    const x1 = layout.width - layout.pad;
    const y = layout.height / 2;

    const trackStrokeWidth = coerceFiniteNonNegative(
      spec.trackStrokeWidth ?? 5,
      5,
      warnings,
      "Non-finite bullet-delta track stroke width; defaulted to 5.",
    );
    const trackStrokeOpacity = clamp(
      coerceFiniteNonNegative(
        spec.trackStrokeOpacity ?? 0.18,
        0.18,
        warnings,
        "Non-finite bullet-delta track stroke opacity; defaulted to 0.18.",
      ),
      0,
      1,
    );

    const deltaStrokeWidth = coerceFiniteNonNegative(
      spec.deltaStrokeWidth ?? 5,
      5,
      warnings,
      "Non-finite bullet-delta delta stroke width; defaulted to 5.",
    );
    const deltaStrokeOpacity = clamp(
      coerceFiniteNonNegative(
        spec.deltaStrokeOpacity ?? 0.7,
        0.7,
        warnings,
        "Non-finite bullet-delta delta stroke opacity; defaulted to 0.7.",
      ),
      0,
      1,
    );

    const previousDotRadius = coerceFiniteNonNegative(
      spec.previousDotRadius ?? 3.4,
      3.4,
      warnings,
      "Non-finite bullet-delta previous dot radius; defaulted to 3.4.",
    );
    const previousDotOpacity = clamp(
      coerceFiniteNonNegative(
        spec.previousDotOpacity ?? 0.35,
        0.35,
        warnings,
        "Non-finite bullet-delta previous dot opacity; defaulted to 0.35.",
      ),
      0,
      1,
    );
    const currentDotRadius = coerceFiniteNonNegative(
      spec.currentDotRadius ?? 4.2,
      4.2,
      warnings,
      "Non-finite bullet-delta current dot radius; defaulted to 4.2.",
    );

    const toX = (v: number) =>
      x0 + (clamp(v, 0, normalized.max) / normalized.max) * (x1 - x0);
    const cx = toX(normalized.current);
    const px = toX(normalized.previous);

    const arrowOpacity = clamp(
      coerceFiniteNonNegative(
        spec.arrowOpacity ?? 0.75,
        0.75,
        warnings,
        "Non-finite bullet-delta arrow opacity; defaulted to 0.75.",
      ),
      0,
      1,
    );

    const up = normalized.current >= normalized.previous;
    const tipOffsetRequested = coerceFiniteNonNegative(
      spec.arrowTipOffset ?? 10,
      10,
      warnings,
      "Non-finite bullet-delta arrow tip offset; defaulted to 10.",
    );
    const maxTipOffset = up
      ? Math.max(0, y - layout.pad)
      : Math.max(0, layout.height - layout.pad - y);
    const tipOffset = Math.min(tipOffsetRequested, maxTipOffset);

    const baseOffsetRequested = coerceFiniteNonNegative(
      spec.arrowBaseOffset ?? 4,
      4,
      warnings,
      "Non-finite bullet-delta arrow base offset; defaulted to 4.",
    );
    const baseOffset = Math.min(baseOffsetRequested, tipOffset);

    const halfWidth = coerceFiniteNonNegative(
      spec.arrowHalfWidth ?? 6,
      6,
      warnings,
      "Non-finite bullet-delta arrow half width; defaulted to 6.",
    );

    const tipY = up ? y - tipOffset : y + tipOffset;
    const baseY = up ? y - baseOffset : y + baseOffset;

    const arrowD = `M ${cx.toFixed(2)} ${tipY.toFixed(2)} L ${(cx + halfWidth).toFixed(2)} ${baseY.toFixed(2)} L ${(cx - halfWidth).toFixed(2)} ${baseY.toFixed(2)} Z`;

    const classSuffix = spec.className ? ` ${spec.className}` : "";

    return [
      {
        className: `mv-bullet-delta-track${classSuffix}`,
        id: "bullet-delta-track",
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
        className: `mv-bullet-delta-delta${classSuffix}`,
        id: "bullet-delta-delta",
        opacity: 1,
        strokeLinecap: "round",
        strokeOpacity: deltaStrokeOpacity,
        strokeWidth: deltaStrokeWidth,
        type: "line",
        x1: Math.min(px, cx),
        x2: Math.max(px, cx),
        y1: y,
        y2: y,
      },
      {
        className: `mv-bullet-delta-previous${classSuffix}`,
        cx: px,
        cy: y,
        fillOpacity: previousDotOpacity,
        id: "bullet-delta-previous",
        r: previousDotRadius,
        type: "circle",
      },
      {
        className: `mv-bullet-delta-current${classSuffix}`,
        cx: cx,
        cy: y,
        id: "bullet-delta-current",
        r: currentDotRadius,
        type: "circle",
      },
      {
        className: `mv-bullet-delta-arrow${classSuffix}`,
        d: arrowD,
        fillOpacity: arrowOpacity,
        id: "bullet-delta-arrow",
        type: "path",
      },
    ];
  },
  normalize(_spec, data) {
    const maxRaw = data.max ?? 100;
    const max = isFiniteNumber(maxRaw) ? maxRaw : 100;
    const safeMax = max <= 0 ? 100 : max;
    const current = isFiniteNumber(data.current) ? data.current : 0;
    const previous = isFiniteNumber(data.previous) ? data.previous : 0;
    return {
      current: clamp(current, 0, safeMax),
      max: safeMax,
      previous: clamp(previous, 0, safeMax),
      type: "bullet-delta",
    };
  },
  type: "bullet-delta",
} satisfies ChartDefinition<
  "bullet-delta",
  BulletDeltaSpec,
  BulletDeltaData,
  NormalizedBulletDelta
>;
