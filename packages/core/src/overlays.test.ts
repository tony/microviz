import { describe, expect, test } from "vitest";
import { computeModel } from "./compute";
import { createModelIdAllocator, patchRenderModel } from "./overlays";

describe("model overlays", () => {
  test("createModelIdAllocator generates deterministic unique IDs", () => {
    const model = computeModel({
      data: [1, 2, 3],
      size: { height: 32, width: 200 },
      spec: { type: "sparkline" as const },
    });

    const { defId, markId } = createModelIdAllocator(model);
    expect(defId("x")).toBe("x");
    expect(defId("x")).toBe("x-2");
    expect(defId("x")).toBe("x-3");

    expect(markId("m")).toBe("m");
    expect(markId("m")).toBe("m-2");
  });

  test("patchRenderModel appends marks and updates stats by default", () => {
    const model = computeModel({
      data: [1, 2, 3],
      size: { height: 32, width: 200 },
      spec: { type: "sparkline" as const },
    });

    const next = patchRenderModel(model, {
      marks: [
        {
          h: 10,
          id: "extra",
          type: "rect",
          w: 10,
          x: 0,
          y: 0,
        },
      ],
    });

    expect(next.marks.length).toBe(model.marks.length + 1);
    expect(next.stats?.markCount).toBe(model.marks.length + 1);
  });
});
