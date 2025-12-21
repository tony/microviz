import { a11yLabelWithSegmentsSummary } from "../a11y";
import type { Mark } from "../model";
import type { ChartDefinition } from "./chart-definition";
import {
  coerceFiniteInt,
  coerceFiniteNonNegative,
  normalizeSegments,
} from "./shared";
import type {
  BitfieldData,
  NormalizedStackedChips,
  StackedChipsSpec,
} from "./types";

export const stackedChipsChart = {
  a11y(_spec, normalized, _layout) {
    return {
      label: a11yLabelWithSegmentsSummary(
        "Stacked chips chart",
        normalized.segments,
      ),
      role: "img",
    };
  },
  category: "bars" as const,
  defaultPad: 0,
  displayName: "Stacked chips",
  emptyDataWarningMessage: "No segments data.",
  isEmpty(normalized) {
    return normalized.segments.length === 0;
  },
  marks(spec, normalized, layout, _state, _theme, warnings) {
    const segments = normalized.segments;
    if (segments.length === 0) return [];

    const maxChips = coerceFiniteInt(
      spec.maxChips ?? 4,
      4,
      1,
      warnings,
      "Non-finite stacked-chips maxChips; defaulted to 4.",
    );
    const items = Math.min(maxChips, segments.length);
    if (items <= 0) return [];

    const usableW = Math.max(0, layout.width - layout.pad * 2);
    const usableH = Math.max(0, layout.height - layout.pad * 2);
    if (usableW <= 0 || usableH <= 0) return [];

    const overlapDefault = 4;
    const overlapRequested = coerceFiniteNonNegative(
      spec.overlap ?? overlapDefault,
      overlapDefault,
      warnings,
      "Non-finite stacked-chips overlap; defaulted to 4.",
    );

    const maxChipWidthDefault = Math.min(24, usableW);
    const minChipWidthDefault = Math.min(12, maxChipWidthDefault);
    const minChipWidth = coerceFiniteNonNegative(
      spec.minChipWidth ?? minChipWidthDefault,
      minChipWidthDefault,
      warnings,
      "Non-finite stacked-chips minChipWidth; defaulted to 12.",
    );
    const maxChipWidth = coerceFiniteNonNegative(
      spec.maxChipWidth ?? maxChipWidthDefault,
      maxChipWidthDefault,
      warnings,
      "Non-finite stacked-chips maxChipWidth; defaulted to 24.",
    );

    const chipHeight = coerceFiniteNonNegative(
      spec.chipHeight ?? usableH,
      usableH,
      warnings,
      "Non-finite stacked-chips chipHeight; defaulted to chart height.",
    );
    const h = Math.min(usableH, chipHeight);
    if (h <= 0) return [];

    const cornerRadiusDefault = h / 2;
    const cornerRadius = Math.min(
      h / 2,
      coerceFiniteNonNegative(
        spec.cornerRadius ?? cornerRadiusDefault,
        cornerRadiusDefault,
        warnings,
        "Non-finite stacked-chips cornerRadius; defaulted to half chip height.",
      ),
    );

    const strokeWidth = coerceFiniteNonNegative(
      spec.strokeWidth ?? 2,
      2,
      warnings,
      "Non-finite stacked-chips strokeWidth; defaulted to 2.",
    );

    const widths = segments.slice(0, items).map((seg) => {
      const raw = (seg.pct / 100) * maxChipWidth;
      return Math.max(minChipWidth, raw);
    });

    const totalRaw =
      (widths[0] ?? 0) +
      widths.slice(1).reduce((sum, w) => sum + (w - overlapRequested), 0);

    const scale = totalRaw > usableW && totalRaw > 0 ? usableW / totalRaw : 1;
    const overlap = overlapRequested * scale;

    const classSuffix = spec.className ? ` ${spec.className}` : "";

    const x0 = layout.pad;
    const y0 = layout.pad + (usableH - h) / 2;

    const chips: Mark[] = [];
    let x = x0;
    for (let i = 0; i < items; i++) {
      const seg = segments[i];
      if (!seg) continue;
      const w = (widths[i] ?? 0) * scale;
      chips.push({
        className: `mv-stacked-chips-chip${classSuffix}`,
        fill: seg.color,
        h,
        id: `stacked-chips-chip-${i}`,
        rx: cornerRadius,
        ry: cornerRadius,
        stroke: "currentColor",
        strokeWidth,
        type: "rect",
        w,
        x,
        y: y0,
      });
      x += w - overlap;
    }

    // Match legacy z-index: earlier chips sit on top.
    return chips.reverse();
  },
  normalize(_spec, data) {
    const segments = normalizeSegments(data);
    return { segments, type: "stacked-chips" as const };
  },
  preferredAspectRatio: "wide" as const,
  type: "stacked-chips",
} satisfies ChartDefinition<
  "stacked-chips",
  StackedChipsSpec,
  BitfieldData,
  NormalizedStackedChips
>;
