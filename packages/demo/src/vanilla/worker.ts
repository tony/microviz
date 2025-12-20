import type { ComputeModelInput, RenderModel } from "@microviz/core";
import { computeModel } from "@microviz/core";
import type { RenderCanvasOptions } from "@microviz/renderers";
import { renderCanvas } from "@microviz/renderers";
import { applyNoiseDisplacementOverlay } from "../modelOverlays";

type WorkerComputeMessage = {
  type: "compute";
  id: number;
  input: ComputeModelInput;
};

type WorkerInitOffscreenMessage = {
  type: "initOffscreen";
  canvasId?: string;
  canvas: OffscreenCanvas;
};

type WorkerDisposeOffscreenMessage = {
  type: "disposeOffscreen";
  canvasId?: string;
};

type WorkerRenderOffscreenMessage = {
  type: "renderOffscreen";
  canvasId?: string;
  input: ComputeModelInput;
  options?: RenderCanvasOptions;
  applyNoiseOverlay?: boolean;
};

type WorkerMessage =
  | WorkerComputeMessage
  | WorkerInitOffscreenMessage
  | WorkerDisposeOffscreenMessage
  | WorkerRenderOffscreenMessage;

type WorkerModelResponse = {
  type: "model";
  id: number;
  model: RenderModel;
};

type WorkerErrorResponse = {
  type: "error";
  id?: number;
  message: string;
};

type WorkerResponse = WorkerModelResponse | WorkerErrorResponse;

const DEFAULT_CANVAS_ID = "default";

const offscreenCtxById = new Map<string, OffscreenCanvasRenderingContext2D>();

function getCanvasId(msg: { canvasId?: string }): string {
  return msg.canvasId ?? DEFAULT_CANVAS_ID;
}

self.addEventListener("message", (event: MessageEvent<WorkerMessage>): void => {
  const msg = event.data;

  try {
    if (msg.type === "initOffscreen") {
      const ctx = msg.canvas.getContext("2d");
      if (!ctx) {
        const response: WorkerResponse = {
          message: "Offscreen canvas context not available.",
          type: "error",
        };
        self.postMessage(response);
        return;
      }

      offscreenCtxById.set(getCanvasId(msg), ctx);
      return;
    }

    if (msg.type === "disposeOffscreen") {
      offscreenCtxById.delete(getCanvasId(msg));
      return;
    }

    if (msg.type === "compute") {
      const model = computeModel(msg.input);
      const response: WorkerResponse = { id: msg.id, model, type: "model" };
      self.postMessage(response);
      return;
    }

    if (msg.type === "renderOffscreen") {
      const offscreenCtx = offscreenCtxById.get(getCanvasId(msg));
      if (!offscreenCtx) {
        const response: WorkerResponse = {
          message: "Offscreen canvas not initialized.",
          type: "error",
        };
        self.postMessage(response);
        return;
      }

      const baseModel = computeModel(msg.input);
      const model = msg.applyNoiseOverlay
        ? applyNoiseDisplacementOverlay(baseModel)
        : baseModel;
      renderCanvas(offscreenCtx, model, msg.options);
    }
  } catch (err) {
    const response: WorkerResponse = {
      id: msg.type === "compute" ? msg.id : undefined,
      message: err instanceof Error ? err.message : String(err),
      type: "error",
    };
    self.postMessage(response);
  }
});
