import type { Mark } from "../model";
import type { ChartDefinition } from "./chart-definition";
import { coerceFiniteNonNegative, normalizeSegments } from "./shared";
import type {
  BitfieldData,
  HandOfCardsSpec,
  NormalizedHandOfCards,
} from "./types";

export const handOfCardsChart = {
  a11y(_spec, _normalized, _layout) {
    return { label: "Hand of cards chart", role: "img" };
  },
  category: "bars" as const,
  defaultPad: 0,
  displayName: "Hand of cards",
  emptyDataWarningMessage: "No segments data.",
  isEmpty(normalized) {
    return normalized.segments.length === 0;
  },
  marks(spec, normalized, layout, _state, _theme, warnings) {
    const { segments } = normalized;
    if (segments.length === 0) return [];

    const { width, height, pad } = layout;
    const usableW = Math.max(0, width - pad * 2);
    const usableH = Math.max(0, height - pad * 2);

    // Overlap between cards in pixels
    const overlap = coerceFiniteNonNegative(
      spec.overlap ?? 12,
      12,
      warnings,
      "Non-finite hand-of-cards overlap; defaulted to 12.",
    );

    // Card height as percentage of usable height
    const cardHeightPct = coerceFiniteNonNegative(
      spec.cardHeightPct ?? 70,
      70,
      warnings,
      "Non-finite hand-of-cards cardHeightPct; defaulted to 70.",
    );

    const classSuffix = spec.className ? ` ${spec.className}` : "";

    const cardH = (usableH * cardHeightPct) / 100;
    const cardY = pad + (usableH - cardH) / 2; // Center vertically

    // Calculate total width needed accounting for overlaps
    // Total width = sum of all card widths - (n-1) * overlap
    // We need to solve for scale factor so cards fit in usableW
    const totalPct = segments.reduce((sum, s) => sum + s.pct, 0);
    const n = segments.length;

    // If no overlap, cards take their percentage of width
    // With overlap, we need: sum(cardW) - (n-1)*overlap <= usableW
    // cardW_i = pct_i / totalPct * totalCardWidth
    // totalCardWidth - (n-1)*overlap = usableW
    // totalCardWidth = usableW + (n-1)*overlap
    const totalCardWidth = usableW + (n - 1) * overlap;

    const marks: Mark[] = [];
    let x = pad;

    // Render in reverse order so first segment ends up on top (rendered last)
    const reversed = [...segments].reverse();

    for (const [i, seg] of reversed.entries()) {
      const originalIndex = segments.length - 1 - i;
      const pct = totalPct > 0 ? seg.pct / totalPct : 1 / n;
      const cardW = totalCardWidth * pct;

      // Clamp x to keep card within viewport
      const clampedX = Math.max(pad, Math.min(x, pad + usableW - cardW));

      marks.push({
        className: `mv-hand-of-cards-card${classSuffix}`,
        fill: seg.color,
        h: cardH,
        id: `hand-of-cards-card-${originalIndex}`,
        rx: 4,
        stroke: "white",
        strokeOpacity: 0.2,
        strokeWidth: 1,
        type: "rect" as const,
        w: cardW,
        x: clampedX,
        y: cardY,
      });

      x += cardW - overlap;
    }

    return marks;
  },
  normalize(_spec, data) {
    const segments = normalizeSegments(data);
    return { segments, type: "hand-of-cards" as const };
  },
  type: "hand-of-cards",
} satisfies ChartDefinition<
  "hand-of-cards",
  HandOfCardsSpec,
  BitfieldData,
  NormalizedHandOfCards
>;
