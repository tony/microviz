import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";

describe("segmented-ring", () => {
  test("produces a deterministic RenderModel", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 40 },
        { color: "#22c55e", name: "B", pct: 35 },
        { color: "#3b82f6", name: "C", pct: 25 },
      ],
      size: { height: 32, width: 32 },
      spec: { pad: 2, type: "segmented-ring" as const },
    };

    const a = computeModel(input);
    const b = computeModel(input);

    expect(a).toEqual(b);
    expect(a.marks.length).toBe(3);
    expect(a.stats?.warnings).toBeUndefined();
    expect(a.marks.every((m) => m.type === "circle")).toBe(true);
  });

  test("all segments share the same center and radius", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 50 },
        { color: "#22c55e", name: "B", pct: 30 },
        { color: "#3b82f6", name: "C", pct: 20 },
      ],
      size: { height: 32, width: 32 },
      spec: { pad: 2, type: "segmented-ring" as const },
    };

    const model = computeModel(input);
    const marks = model.marks;

    // All circles should have same cx, cy, and r
    const firstMark = marks[0];
    if (firstMark?.type === "circle") {
      for (const mark of marks) {
        if (mark.type === "circle") {
          expect(mark.cx).toBe(firstMark.cx);
          expect(mark.cy).toBe(firstMark.cy);
          expect(mark.r).toBe(firstMark.r);
        }
      }
    }
  });

  test("segments have strokeDasharray for partial arcs", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 50 },
        { color: "#22c55e", name: "B", pct: 50 },
      ],
      size: { height: 32, width: 32 },
      spec: { gapSize: 0, pad: 2, type: "segmented-ring" as const },
    };

    const model = computeModel(input);

    for (const mark of model.marks) {
      if (mark.type === "circle") {
        expect(mark.strokeDasharray).toBeDefined();
        expect(mark.strokeDashoffset).toBeDefined();
      }
    }
  });

  test("respects strokeWidth option", () => {
    const input = {
      data: [{ color: "#ef4444", name: "A", pct: 100 }],
      size: { height: 32, width: 32 },
      spec: { pad: 2, strokeWidth: 5, type: "segmented-ring" as const },
    };

    const model = computeModel(input);
    const [mark] = model.marks;

    if (mark?.type === "circle") {
      expect(mark.strokeWidth).toBe(5);
    }
  });

  test("returns empty marks for empty data", () => {
    const input = {
      data: [],
      size: { height: 32, width: 32 },
      spec: { type: "segmented-ring" as const },
    };

    const model = computeModel(input);
    expect(model.marks.length).toBe(0);
  });
});
