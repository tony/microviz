import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";

describe("sparkline-bars", () => {
  test("produces a deterministic RenderModel", () => {
    const input = {
      data: [10, 20, 15, 30, 25],
      size: { height: 32, width: 100 },
      spec: { type: "sparkline-bars" as const },
    };

    const a = computeModel(input);
    const b = computeModel(input);

    expect(a).toEqual(b);
    // One bar per data point
    expect(a.marks.length).toBe(5);
    expect(a.stats?.warnings).toBeUndefined();
  });

  test("creates one bar per data point", () => {
    const input = {
      data: [10, 20, 30],
      size: { height: 32, width: 100 },
      spec: { type: "sparkline-bars" as const },
    };

    const model = computeModel(input);
    expect(model.marks.length).toBe(3);

    // All marks should be rects
    for (const mark of model.marks) {
      expect(mark.type).toBe("rect");
    }
  });

  test("bar heights are min-max normalized", () => {
    const input = {
      data: [0, 50, 100], // min=0, max=100
      size: { height: 100, width: 100 },
      spec: { gap: 0, pad: 0, type: "sparkline-bars" as const },
    };

    const model = computeModel(input);
    const bars = model.marks.filter((m) => m.type === "rect");

    if (
      bars[0]?.type === "rect" &&
      bars[1]?.type === "rect" &&
      bars[2]?.type === "rect"
    ) {
      // First bar (value 0) should have minimum height (2px)
      expect(bars[0].h).toBeCloseTo(2);
      // Middle bar (value 50) should be ~50% height
      expect(bars[1].h).toBeCloseTo(50);
      // Last bar (value 100) should be full height
      expect(bars[2].h).toBeCloseTo(100);
    }
  });

  test("bars grow from bottom", () => {
    const input = {
      data: [50],
      size: { height: 100, width: 100 },
      spec: { pad: 0, type: "sparkline-bars" as const },
    };

    const model = computeModel(input);
    const bar = model.marks[0];

    if (bar?.type === "rect") {
      // Bar should end at y + h = 100 (bottom of viewport)
      expect(bar.y + bar.h).toBeCloseTo(100);
    }
  });

  test("supports barRadius option", () => {
    const input = {
      data: [50],
      size: { height: 32, width: 100 },
      spec: { barRadius: 4, type: "sparkline-bars" as const },
    };

    const model = computeModel(input);
    const bar = model.marks[0];

    if (bar?.type === "rect") {
      expect(bar.rx).toBe(4);
      expect(bar.ry).toBe(4);
    }
  });

  test("supports colors option", () => {
    const input = {
      data: [10, 20, 30],
      size: { height: 32, width: 100 },
      spec: {
        colors: ["#ef4444", "#22c55e", "#3b82f6"],
        type: "sparkline-bars" as const,
      },
    };

    const model = computeModel(input);
    const fills = model.marks.map((m) => (m.type === "rect" ? m.fill : null));

    expect(fills).toEqual(["#ef4444", "#22c55e", "#3b82f6"]);
  });

  test("handles empty data gracefully", () => {
    const input = {
      data: [],
      size: { height: 32, width: 100 },
      spec: { type: "sparkline-bars" as const },
    };

    const model = computeModel(input);
    expect(model.marks.length).toBe(0);
  });

  test("handles single data point", () => {
    const input = {
      data: [42],
      size: { height: 32, width: 100 },
      spec: { type: "sparkline-bars" as const },
    };

    const model = computeModel(input);
    expect(model.marks.length).toBe(1);
  });
});
