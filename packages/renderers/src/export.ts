import type { RenderModel } from "@microviz/core";
import type { Canvas2DContext, RenderCanvasOptions } from "./canvas";
import { renderCanvas } from "./canvas";
import { renderSvgString } from "./svg";

export type CanvasExportSurface = HTMLCanvasElement | OffscreenCanvas;

export type CanvasToBlobOptions = {
  type?: string;
  quality?: number;
};

const DEFAULT_SVG_MIME = "image/svg+xml;charset=utf-8";
const DEFAULT_PNG_MIME = "image/png";

/**
 * Convert an SVG string into a Blob (useful for downloads, object URLs, etc).
 */
export function svgStringToBlob(
  svg: string,
  options?: { type?: string },
): Blob {
  return new Blob([svg], { type: options?.type ?? DEFAULT_SVG_MIME });
}

/**
 * Convert an SVG string into a data URL.
 *
 * Note: use an object URL if the SVG may be large.
 */
export function svgStringToDataUrl(svg: string): string {
  return `data:${DEFAULT_SVG_MIME},${encodeURIComponent(svg)}`;
}

export type RenderModelToSvgOptions = {
  renderOptions?: { title?: string };
  type?: string;
};

export type RenderModelToPngOptions = {
  canvas: CanvasExportSurface;
  context?: Canvas2DContext | null;
  renderOptions?: RenderCanvasOptions;
  type?: string;
  quality?: number;
};

export function renderModelToSvgBlob(
  model: RenderModel,
  options?: RenderModelToSvgOptions,
): Blob {
  const svg = renderSvgString(model, options?.renderOptions);
  return svgStringToBlob(svg, { type: options?.type });
}

export function renderModelToSvgDataUrl(
  model: RenderModel,
  options?: { renderOptions?: { title?: string } },
): string {
  const svg = renderSvgString(model, options?.renderOptions);
  return svgStringToDataUrl(svg);
}

export async function renderModelToPngBlob(
  model: RenderModel,
  options: RenderModelToPngOptions,
): Promise<Blob> {
  const ctx = options.context ?? options.canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context not available.");
  }
  renderCanvas(ctx as Canvas2DContext, model, options.renderOptions);
  return await canvasToBlob(options.canvas, {
    quality: options.quality,
    type: options.type,
  });
}

/**
 * Convert a canvas surface into a Blob using the best available API.
 *
 * - `OffscreenCanvas`: uses `convertToBlob`
 * - `HTMLCanvasElement`: uses `toBlob`
 */
export async function canvasToBlob(
  canvas: CanvasExportSurface,
  options?: CanvasToBlobOptions,
): Promise<Blob> {
  const type = options?.type ?? DEFAULT_PNG_MIME;
  const quality = options?.quality;

  if (
    typeof (canvas as OffscreenCanvas).convertToBlob === "function" &&
    typeof (canvas as HTMLCanvasElement).toBlob !== "function"
  ) {
    return (canvas as OffscreenCanvas).convertToBlob({ quality, type });
  }

  if (typeof (canvas as HTMLCanvasElement).toBlob === "function") {
    return await new Promise<Blob>((resolve, reject) => {
      (canvas as HTMLCanvasElement).toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas toBlob() returned null."));
        },
        type,
        quality,
      );
    });
  }

  throw new Error("Canvas export not supported in this environment.");
}
