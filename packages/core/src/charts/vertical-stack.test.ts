import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";

describe("vertical-stack", () => {
  test("produces a deterministic RenderModel", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 40 },
        { color: "#22c55e", name: "B", pct: 35 },
        { color: "#3b82f6", name: "C", pct: 25 },
      ],
      size: { height: 100, width: 8 },
      spec: { pad: 0, type: "vertical-stack" as const },
    };

    const a = computeModel(input);
    const b = computeModel(input);

    expect(a).toEqual(b);
    expect(a.marks.length).toBeGreaterThan(0);
    expect(a.stats?.warnings).toBeUndefined();
    expect(a.marks.every((m) => m.type === "rect")).toBe(true);
  });

  test("segments stack vertically (top to bottom)", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 50 },
        { color: "#22c55e", name: "B", pct: 50 },
      ],
      size: { height: 100, width: 8 },
      spec: { pad: 0, type: "vertical-stack" as const },
    };

    const model = computeModel(input);
    const mainMarks = model.marks.filter((m) => !m.id?.includes("-inner"));

    // First segment starts at y=0
    const [first, second] = mainMarks;
    if (first?.type === "rect" && second?.type === "rect") {
      expect(first.y).toBe(0);
      // Second segment starts where first ends
      expect(second.y).toBeCloseTo(first.h, 1);
    }
  });

  test("segments span full width", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 50 },
        { color: "#22c55e", name: "B", pct: 50 },
      ],
      size: { height: 100, width: 20 },
      spec: { pad: 0, type: "vertical-stack" as const },
    };

    const model = computeModel(input);

    // All rects should have same width (full width)
    for (const mark of model.marks) {
      if (mark.type === "rect") {
        expect(mark.w).toBe(20);
      }
    }
  });

  test("height proportional to percentage", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 60 },
        { color: "#22c55e", name: "B", pct: 40 },
      ],
      size: { height: 100, width: 8 },
      spec: { pad: 0, type: "vertical-stack" as const },
    };

    const model = computeModel(input);
    const mainMarks = model.marks.filter((m) => !m.id?.includes("-inner"));

    const [first, second] = mainMarks;
    if (first?.type === "rect" && second?.type === "rect") {
      // 60% of 100 = 60, 40% of 100 = 40
      expect(first.h).toBeCloseTo(60, 1);
      expect(second.h).toBeCloseTo(40, 1);
    }
  });

  test("returns empty marks for empty data", () => {
    const input = {
      data: [],
      size: { height: 100, width: 8 },
      spec: { type: "vertical-stack" as const },
    };

    const model = computeModel(input);
    expect(model.marks.length).toBe(0);
  });
});
