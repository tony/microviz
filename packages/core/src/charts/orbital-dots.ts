import { a11yLabelWithSegmentsSummary } from "../a11y";
import type { Mark } from "../model";
import type { ChartDefinition } from "./chart-definition";
import { coerceFiniteNonNegative, normalizeSegments } from "./shared";
import type {
  BitfieldData,
  NormalizedOrbitalDots,
  OrbitalDotsSpec,
} from "./types";

export const orbitalDotsChart = {
  a11y(_spec, normalized, _layout) {
    return {
      label: a11yLabelWithSegmentsSummary(
        "Orbital dots chart",
        normalized.segments,
      ),
      role: "img",
    };
  },
  category: "dots" as const,
  defaultPad: 0,
  displayName: "Orbital dots",
  emptyDataWarningMessage: "No segments data.",
  isEmpty(normalized) {
    return normalized.segments.length === 0;
  },
  marks(spec, normalized, layout, _state, _theme, warnings) {
    const segments = normalized.segments;
    if (segments.length === 0) return [];

    const usableW = Math.max(0, layout.width - layout.pad * 2);
    const usableH = Math.max(0, layout.height - layout.pad * 2);
    const chartR = Math.min(usableW, usableH) / 2;
    if (chartR <= 0) return [];

    const cx = layout.pad + usableW / 2;
    const cy = layout.pad + usableH / 2;

    const minDotRadius = coerceFiniteNonNegative(
      spec.minDotRadius ?? 2,
      2,
      warnings,
      "Non-finite orbital-dots minDotRadius; defaulted to 2.",
    );
    const maxDotRadius = coerceFiniteNonNegative(
      spec.maxDotRadius ?? 6,
      6,
      warnings,
      "Non-finite orbital-dots maxDotRadius; defaulted to 6.",
    );

    const safeMaxDotRadius = Math.max(minDotRadius, maxDotRadius);
    const radiusDefault = Math.max(0, chartR - safeMaxDotRadius);
    const radiusRequested = coerceFiniteNonNegative(
      spec.radius ?? radiusDefault,
      radiusDefault,
      warnings,
      "Non-finite orbital-dots radius; defaulted to fit chart bounds.",
    );
    const radius = Math.min(radiusDefault, radiusRequested);

    const ringStrokeWidth = coerceFiniteNonNegative(
      spec.ringStrokeWidth ?? 1,
      1,
      warnings,
      "Non-finite orbital-dots ringStrokeWidth; defaulted to 1.",
    );

    const classSuffix = spec.className ? ` ${spec.className}` : "";

    const marks: Mark[] = [
      {
        className: `mv-orbital-dots-ring${classSuffix}`,
        cx,
        cy,
        fill: "none",
        id: "orbital-dots-ring",
        r: radius,
        stroke: "currentColor",
        strokeWidth: ringStrokeWidth,
        type: "circle",
      },
    ];

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      if (!seg) continue;
      const angle = (i / segments.length) * Math.PI * 2 - Math.PI / 2;
      const dotRadius = Math.max(
        minDotRadius,
        (seg.pct / 100) * safeMaxDotRadius,
      );
      marks.push({
        className: `mv-orbital-dots-dot${classSuffix}`,
        cx: cx + radius * Math.cos(angle),
        cy: cy + radius * Math.sin(angle),
        fill: seg.color,
        id: `orbital-dots-dot-${i}`,
        r: dotRadius,
        type: "circle",
      });
    }

    return marks;
  },
  normalize(_spec, data) {
    const segments = normalizeSegments(data);
    return { segments, type: "orbital-dots" as const };
  },
  preferredAspectRatio: "square" as const,
  type: "orbital-dots",
} satisfies ChartDefinition<
  "orbital-dots",
  OrbitalDotsSpec,
  BitfieldData,
  NormalizedOrbitalDots
>;
