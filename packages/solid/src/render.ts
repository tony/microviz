/**
 * Imperative render functions for embedding Solid components in non-Solid apps.
 * These functions mount Solid components into DOM containers without requiring
 * Solid's JSX transform in the host application.
 */
import type { RenderModel } from "@microviz/core";
import type { RenderCanvasOptions } from "@microviz/renderers";
import { render } from "solid-js/web";
import { MicrovizCanvas, MicrovizSvg, MicrovizSvgString } from "./model";

export type SolidRenderDispose = () => void;

export type RenderSolidOptions = {
  model: RenderModel;
  title?: string;
  className?: string;
};

export type RenderSolidCanvasOptions = RenderSolidOptions & {
  canvasOptions?: RenderCanvasOptions;
  fallbackSvgWhenCanvasUnsupported?: boolean;
};

/**
 * Render a Solid MicrovizSvg component into a container element.
 * Returns a dispose function to unmount the component.
 */
export function renderSolidSvg(
  container: HTMLElement,
  options: RenderSolidOptions,
): SolidRenderDispose {
  return render(
    () =>
      MicrovizSvg({
        class: options.className,
        model: options.model,
        title: options.title,
      }),
    container,
  );
}

/**
 * Render a Solid MicrovizSvgString component into a container element.
 * Returns a dispose function to unmount the component.
 */
export function renderSolidSvgString(
  container: HTMLElement,
  options: RenderSolidOptions,
): SolidRenderDispose {
  return render(
    () =>
      MicrovizSvgString({
        class: options.className,
        model: options.model,
        title: options.title,
      }),
    container,
  );
}

/**
 * Render a Solid MicrovizCanvas component into a container element.
 * Returns a dispose function to unmount the component.
 */
export function renderSolidCanvas(
  container: HTMLElement,
  options: RenderSolidCanvasOptions,
): SolidRenderDispose {
  return render(
    () =>
      MicrovizCanvas({
        class: options.className,
        fallbackSvgWhenCanvasUnsupported:
          options.fallbackSvgWhenCanvasUnsupported,
        model: options.model,
        options: options.canvasOptions,
      }),
    container,
  );
}
