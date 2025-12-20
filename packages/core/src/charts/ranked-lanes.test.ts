import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";

describe("ranked-lanes", () => {
  test("produces a deterministic RenderModel", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 40 },
        { color: "#22c55e", name: "B", pct: 35 },
        { color: "#3b82f6", name: "C", pct: 25 },
      ],
      size: { height: 32, width: 100 },
      spec: { pad: 2, type: "ranked-lanes" as const },
    };

    const a = computeModel(input);
    const b = computeModel(input);

    expect(a).toEqual(b);
    expect(a.marks.length).toBe(3);
    expect(a.stats?.warnings).toBeUndefined();
    expect(a.marks.every((m) => m.type === "rect")).toBe(true);
  });

  test("respects maxLanes option", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 20 },
        { color: "#22c55e", name: "B", pct: 20 },
        { color: "#3b82f6", name: "C", pct: 20 },
        { color: "#eab308", name: "D", pct: 20 },
        { color: "#8b5cf6", name: "E", pct: 20 },
      ],
      size: { height: 32, width: 100 },
      spec: { maxLanes: 3, pad: 0, type: "ranked-lanes" as const },
    };

    const model = computeModel(input);
    expect(model.marks.length).toBe(3);
  });

  test("bars are stacked vertically with correct widths", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 60 },
        { color: "#22c55e", name: "B", pct: 40 },
      ],
      size: { height: 32, width: 100 },
      spec: { laneHeight: 4, pad: 0, type: "ranked-lanes" as const },
    };

    const model = computeModel(input);
    const [first, second] = model.marks;

    if (first?.type === "rect" && second?.type === "rect") {
      // First bar should be at y=0 with width proportional to normalized pct
      expect(first.x).toBe(0);
      expect(first.y).toBe(0);
      expect(first.w).toBeCloseTo(60, 1); // 60% of 100px (already normalized)

      // Second bar should be lower
      expect(second.x).toBe(0);
      expect(second.y).toBeGreaterThan(first.y);
      expect(second.w).toBeCloseTo(40, 1); // 40% of 100px (already normalized)
    }
  });
});
