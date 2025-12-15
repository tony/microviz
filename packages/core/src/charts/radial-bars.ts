import type { Mark } from "../model";
import type { ChartDefinition } from "./chart-definition";
import { coerceFiniteNonNegative, normalizeSegments } from "./shared";
import type {
  BitfieldData,
  NormalizedRadialBars,
  RadialBarsSpec,
} from "./types";

export const radialBarsChart = {
  a11y(_spec, _normalized, _layout) {
    return { label: "Radial bars chart", role: "img" };
  },
  category: "lines" as const,
  defaultPad: 0,
  displayName: "Radial bars",
  emptyDataWarningMessage: "No segments data.",
  isEmpty(normalized) {
    return normalized.segments.length === 0;
  },
  marks(spec, normalized, layout, _state, _theme, warnings) {
    const segments = normalized.segments;
    if (segments.length === 0) return [];

    const usableW = Math.max(0, layout.width - layout.pad * 2);
    const usableH = Math.max(0, layout.height - layout.pad * 2);
    const r = Math.min(usableW, usableH) / 2;
    if (r <= 0) return [];

    const cx = layout.pad + usableW / 2;
    const cy = layout.pad + usableH / 2;

    const startRadiusRequested = coerceFiniteNonNegative(
      spec.startRadius ?? 0,
      0,
      warnings,
      "Non-finite radial-bars start radius; defaulted to 0.",
    );
    const startRadius = Math.min(r, startRadiusRequested);

    const maxLengthDefault = Math.max(0, r - startRadius);
    const maxLengthRequested = coerceFiniteNonNegative(
      spec.maxLength ?? maxLengthDefault,
      maxLengthDefault,
      warnings,
      "Non-finite radial-bars max length; defaulted to fit chart radius.",
    );
    const maxLength = Math.min(maxLengthDefault, maxLengthRequested);

    const minLengthRequested = coerceFiniteNonNegative(
      spec.minLength ?? 0,
      0,
      warnings,
      "Non-finite radial-bars min length; defaulted to 0.",
    );
    const minLength = Math.min(maxLength, minLengthRequested);

    const strokeWidthRequested = coerceFiniteNonNegative(
      spec.strokeWidth ?? 2.5,
      2.5,
      warnings,
      "Non-finite radial-bars stroke width; defaulted to 2.5.",
    );
    const strokeWidth = Math.min(r, strokeWidthRequested);

    const classSuffix = spec.className ? ` ${spec.className}` : "";

    const marks: Mark[] = [];
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      if (!seg) continue;

      const angle = (i / segments.length) * Math.PI * 2 - Math.PI / 2;
      const len = minLength + (seg.pct / 100) * maxLength;

      const x1 = cx + startRadius * Math.cos(angle);
      const y1 = cy + startRadius * Math.sin(angle);
      const x2 = cx + (startRadius + len) * Math.cos(angle);
      const y2 = cy + (startRadius + len) * Math.sin(angle);

      marks.push({
        className: `mv-radial-bars-bar${classSuffix}`,
        id: `radial-bars-bar-${i}`,
        stroke: seg.color,
        strokeLinecap: "round",
        strokeWidth,
        type: "line",
        x1,
        x2,
        y1,
        y2,
      });
    }

    return marks;
  },
  normalize(_spec, data) {
    const segments = normalizeSegments(data);
    return { segments, type: "radial-bars" as const };
  },
  preferredAspectRatio: "square" as const,
  type: "radial-bars",
} satisfies ChartDefinition<
  "radial-bars",
  RadialBarsSpec,
  BitfieldData,
  NormalizedRadialBars
>;
