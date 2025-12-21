import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";

describe("code-minimap", () => {
  test("produces a deterministic RenderModel", () => {
    const input = {
      data: [10, 30, 50, 20, 60, 40, 80, 70],
      size: { height: 32, width: 32 },
      spec: { type: "code-minimap" as const },
    };

    const a = computeModel(input);
    const b = computeModel(input);

    expect(a).toEqual(b);
    expect(a.marks.length).toBe(8);
    expect(a.stats?.warnings).toBeUndefined();
  });

  test("respects lines option", () => {
    const input = {
      data: [10, 20, 30, 40],
      size: { height: 32, width: 32 },
      spec: { lines: 4, type: "code-minimap" as const },
    };

    const model = computeModel(input);
    expect(model.marks.length).toBe(4);
  });

  test("fills are set from segments", () => {
    const input = {
      data: [100],
      size: { height: 32, width: 32 },
      spec: { colors: ["#ef4444"], type: "code-minimap" as const },
    };

    const model = computeModel(input);
    expect(model.marks.length).toBe(8);
    for (const mark of model.marks) {
      expect(mark.type).toBe("rect");
      if (mark.type === "rect") expect(mark.fill).toBe("#ef4444");
    }
  });

  test("handles empty data gracefully", () => {
    const input = {
      data: [],
      size: { height: 32, width: 32 },
      spec: { type: "code-minimap" as const },
    };

    const model = computeModel(input);
    expect(model.marks.length).toBe(0);
  });
});
