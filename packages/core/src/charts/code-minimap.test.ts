import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";

describe("code-minimap", () => {
  test("produces a deterministic RenderModel", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 50 },
        { color: "#22c55e", name: "B", pct: 30 },
        { color: "#3b82f6", name: "C", pct: 20 },
      ],
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
      data: [{ color: "#ef4444", name: "A", pct: 100 }],
      size: { height: 32, width: 32 },
      spec: { lines: 4, type: "code-minimap" as const },
    };

    const model = computeModel(input);
    expect(model.marks.length).toBe(4);
  });

  test("fills are set from segments", () => {
    const input = {
      data: [{ color: "#ef4444", name: "A", pct: 100 }],
      size: { height: 32, width: 32 },
      spec: { type: "code-minimap" as const },
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
