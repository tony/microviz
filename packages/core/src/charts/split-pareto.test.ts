import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";

describe("split-pareto", () => {
  test("produces a deterministic RenderModel", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 40 },
        { color: "#22c55e", name: "B", pct: 35 },
        { color: "#3b82f6", name: "C", pct: 25 },
      ],
      size: { height: 32, width: 100 },
      spec: { pad: 0, type: "split-pareto" as const },
    };

    const a = computeModel(input);
    const b = computeModel(input);

    expect(a).toEqual(b);
    // 3 segment rects + 1 divider line
    expect(a.marks.length).toBe(4);
    expect(a.stats?.warnings).toBeUndefined();
  });

  test("has rect segments and a line divider", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 50 },
        { color: "#22c55e", name: "B", pct: 50 },
      ],
      size: { height: 100, width: 100 },
      spec: { gap: 0, pad: 0, type: "split-pareto" as const },
    };

    const model = computeModel(input);
    const rects = model.marks.filter((m) => m.type === "rect");
    const lines = model.marks.filter((m) => m.type === "line");

    expect(rects.length).toBe(2);
    expect(lines.length).toBe(1);
  });

  test("divider is placed at 80% threshold by default", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 40 },
        { color: "#22c55e", name: "B", pct: 40 },
        { color: "#3b82f6", name: "C", pct: 20 },
      ],
      size: { height: 100, width: 100 },
      spec: { gap: 0, pad: 0, type: "split-pareto" as const },
    };

    const model = computeModel(input);
    const divider = model.marks.find((m) => m.type === "line");

    // First segment: 40%, second: 80% cumulative (40+40)
    // Divider should be at 80% of width = 80px
    if (divider?.type === "line") {
      expect(divider.x1).toBeCloseTo(80, 1);
    }
  });

  test("respects custom threshold", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 50 },
        { color: "#22c55e", name: "B", pct: 50 },
      ],
      size: { height: 100, width: 100 },
      spec: { gap: 0, pad: 0, threshold: 50, type: "split-pareto" as const },
    };

    const model = computeModel(input);
    const divider = model.marks.find((m) => m.type === "line");

    // Divider at 50% threshold means it's placed after the first 50%
    if (divider?.type === "line") {
      expect(divider.x1).toBeCloseTo(50, 1);
    }
  });
});
