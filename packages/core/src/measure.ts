export type TextMetricsLite = {
  width: number;
  ascent?: number;
  descent?: number;
};

export interface TextMeasurer {
  measureText(text: string, font: string): TextMetricsLite;
}

export function createApproximateTextMeasurer(options?: {
  avgCharWidthPx?: number;
  ascentPx?: number;
  descentPx?: number;
}): TextMeasurer {
  const avgCharWidthPx = options?.avgCharWidthPx ?? 7;
  const ascentPx = options?.ascentPx ?? 8;
  const descentPx = options?.descentPx ?? 2;

  return {
    measureText(text) {
      return {
        ascent: ascentPx,
        descent: descentPx,
        width: avgCharWidthPx * text.length,
      };
    },
  };
}

export function createCanvasTextMeasurer(ctx: {
  font: string;
  measureText(text: string): TextMetrics;
}): TextMeasurer {
  return {
    measureText(text, font) {
      ctx.font = font;
      const m = ctx.measureText(text);
      return {
        ascent: m.actualBoundingBoxAscent,
        descent: m.actualBoundingBoxDescent,
        width: m.width,
      };
    },
  };
}

export function createOffscreenCanvasTextMeasurer(): TextMeasurer | null {
  if (typeof OffscreenCanvas === "undefined") return null;
  const canvas = new OffscreenCanvas(1, 1);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  return createCanvasTextMeasurer(ctx);
}
