import type { ComputeModelInput, RenderModel } from "@microviz/core";
import type { RenderCanvasOptions } from "@microviz/renderers";

type WorkerComputeMessage = {
  type: "compute";
  id: number;
  input: ComputeModelInput;
};

type WorkerInitOffscreenMessage = {
  type: "initOffscreen";
  canvasId: string;
  canvas: OffscreenCanvas;
};

type WorkerDisposeOffscreenMessage = {
  type: "disposeOffscreen";
  canvasId: string;
};

type WorkerRenderOffscreenMessage = {
  type: "renderOffscreen";
  canvasId: string;
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

export class MicrovizWorkerClient {
  #worker: Worker;
  #nextId = 1;
  #pending = new Map<
    number,
    { reject: (err: Error) => void; resolve: (model: RenderModel) => void }
  >();

  constructor() {
    this.#worker = new Worker(
      new URL("../vanilla/worker.ts", import.meta.url),
      {
        type: "module",
      },
    );

    this.#worker.addEventListener(
      "message",
      (event: MessageEvent<WorkerResponse>) => {
        const msg = event.data;
        if (msg.type === "model") {
          const pending = this.#pending.get(msg.id);
          if (!pending) return;
          this.#pending.delete(msg.id);
          pending.resolve(msg.model);
          return;
        }

        if (msg.id === undefined) {
          return;
        }

        const pending = this.#pending.get(msg.id);
        if (!pending) return;
        this.#pending.delete(msg.id);
        pending.reject(new Error(msg.message));
      },
    );
  }

  compute(input: ComputeModelInput): Promise<RenderModel> {
    const id = this.#nextId++;
    const msg: WorkerMessage = { id, input, type: "compute" };
    this.#worker.postMessage(msg);
    return new Promise((resolve, reject) => {
      this.#pending.set(id, { reject, resolve });
    });
  }

  initOffscreen(canvasId: string, canvas: OffscreenCanvas): void {
    const msg: WorkerMessage = { canvas, canvasId, type: "initOffscreen" };
    this.#worker.postMessage(msg, [canvas]);
  }

  disposeOffscreen(canvasId: string): void {
    const msg: WorkerMessage = { canvasId, type: "disposeOffscreen" };
    this.#worker.postMessage(msg);
  }

  renderOffscreen(
    canvasId: string,
    input: ComputeModelInput,
    options?: RenderCanvasOptions,
    applyNoiseOverlay?: boolean,
  ): void {
    const msg: WorkerMessage = {
      applyNoiseOverlay,
      canvasId,
      input,
      options,
      type: "renderOffscreen",
    };
    this.#worker.postMessage(msg);
  }

  terminate(): void {
    this.#worker.terminate();
    this.#pending.clear();
  }
}
