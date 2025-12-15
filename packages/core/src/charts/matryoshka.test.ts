import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";

describe("matryoshka", () => {
  test("produces a deterministic RenderModel", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 40 },
        { color: "#22c55e", name: "B", pct: 35 },
        { color: "#3b82f6", name: "C", pct: 25 },
      ],
      size: { height: 60, width: 100 },
      spec: { pad: 0, type: "matryoshka" as const },
    };

    const a = computeModel(input);
    const b = computeModel(input);

    expect(a).toEqual(b);
    // 3 segments = 3 bars (widest to narrowest)
    expect(a.marks.length).toBe(3);
    expect(a.stats?.warnings).toBeUndefined();
  });

  test("creates cumulative bars with decreasing widths and heights", () => {
    // A=50%, B=50% → cumulative from end: B=50%, A=100%
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 50 },
        { color: "#22c55e", name: "B", pct: 50 },
      ],
      size: { height: 100, width: 100 },
      spec: { heightDecrement: 20, pad: 0, type: "matryoshka" as const },
    };

    const model = computeModel(input);
    const rects = model.marks.filter((m) => m.type === "rect");

    expect(rects.length).toBe(2);

    const first = rects[0];
    const second = rects[1];

    if (first?.type === "rect" && second?.type === "rect") {
      // First bar: 100% cumulative width, 100% height
      expect(first.w).toBe(100);
      expect(first.h).toBe(100);
      expect(first.x).toBe(0); // All bars start at x=0

      // Second bar: 50% cumulative width, 80% height (100% - 20%)
      expect(second.w).toBe(50);
      expect(second.h).toBe(80);
      expect(second.x).toBe(0); // All bars start at x=0

      // Second bar is vertically centered
      expect(second.y).toBe(10); // (100 - 80) / 2 = 10
    }
  });

  test("applies corner radius to rectangles", () => {
    const input = {
      data: [{ color: "#ef4444", name: "A", pct: 100 }],
      size: { height: 60, width: 100 },
      spec: { cornerRadius: 8, pad: 0, type: "matryoshka" as const },
    };

    const model = computeModel(input);
    const rect = model.marks[0];

    if (rect?.type === "rect") {
      expect(rect.rx).toBe(8);
      expect(rect.ry).toBe(8);
    }
  });

  test("handles empty data gracefully", () => {
    const input = {
      data: [],
      size: { height: 60, width: 100 },
      spec: { type: "matryoshka" as const },
    };

    const model = computeModel(input);
    expect(model.marks.length).toBe(0);
  });

  test("clamps height to minimum 30%", () => {
    // With heightDecrement=25 and 4 segments:
    // Heights: 100%, 75%, 50%, 30% (clamped)
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 25 },
        { color: "#22c55e", name: "B", pct: 25 },
        { color: "#3b82f6", name: "C", pct: 25 },
        { color: "#f59e0b", name: "D", pct: 25 },
      ],
      size: { height: 100, width: 100 },
      spec: { heightDecrement: 25, pad: 0, type: "matryoshka" as const },
    };

    const model = computeModel(input);
    const rects = model.marks.filter((m) => m.type === "rect");

    expect(rects.length).toBe(4);

    // Last bar should have 30% height (clamped minimum)
    const lastRect = rects[3];
    if (lastRect?.type === "rect") {
      expect(lastRect.h).toBe(30);
    }
  });

  test("uses default heightDecrement of 14", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 50 },
        { color: "#22c55e", name: "B", pct: 50 },
      ],
      size: { height: 100, width: 100 },
      spec: { pad: 0, type: "matryoshka" as const },
    };

    const model = computeModel(input);
    const rects = model.marks.filter((m) => m.type === "rect");

    const second = rects[1];
    if (second?.type === "rect") {
      // Second bar: 86% height (100% - 14%)
      expect(second.h).toBe(86);
    }
  });
});
