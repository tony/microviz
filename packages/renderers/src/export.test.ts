import type { RenderModel } from "@microviz/core";
import { describe, expect, it } from "vitest";
import type { Canvas2DContext } from "./canvas";
import {
  renderModelToPngBlob,
  renderModelToSvgBlob,
  renderModelToSvgDataUrl,
} from "./export";

class FakeCanvas {
  toBlob(callback: (blob: Blob | null) => void, type?: string): void {
    callback(new Blob(["png"], { type: type ?? "image/png" }));
  }

  getContext(): null {
    return null;
  }
}

describe("export helpers", () => {
  const model: RenderModel = {
    height: 10,
    marks: [],
    width: 10,
  };

  it("renders svg blob from model", () => {
    const blob = renderModelToSvgBlob(model);
    expect(blob.type).toBe("image/svg+xml;charset=utf-8");
  });

  it("renders svg data url from model", () => {
    const dataUrl = renderModelToSvgDataUrl(model);
    expect(dataUrl.startsWith("data:image/svg+xml")).toBe(true);
  });

  it("renders png blob from model with provided canvas", async () => {
    const ctx = {
      clearRect: () => {},
    } as unknown as Canvas2DContext;
    const blob = await renderModelToPngBlob(model, {
      canvas: new FakeCanvas() as unknown as HTMLCanvasElement,
      context: ctx,
    });
    expect(blob.type).toBe("image/png");
  });
});
