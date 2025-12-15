import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";

describe("lollipop", () => {
  test("produces a deterministic RenderModel", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 40 },
        { color: "#22c55e", name: "B", pct: 35 },
        { color: "#3b82f6", name: "C", pct: 25 },
      ],
      size: { height: 32, width: 100 },
      spec: { pad: 2, type: "lollipop" as const },
    };

    const a = computeModel(input);
    const b = computeModel(input);

    expect(a).toEqual(b);
    // 3 segments = 3 stems + 3 dots = 6 marks
    expect(a.marks.length).toBe(6);
    expect(a.stats?.warnings).toBeUndefined();
  });

  test("produces rect stems and circle dots", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 50 },
        { color: "#22c55e", name: "B", pct: 50 },
      ],
      size: { height: 32, width: 100 },
      spec: { pad: 0, type: "lollipop" as const },
    };

    const model = computeModel(input);
    const rects = model.marks.filter((m) => m.type === "rect");
    const circles = model.marks.filter((m) => m.type === "circle");

    expect(rects.length).toBe(2);
    expect(circles.length).toBe(2);
  });

  test("respects maxItems option", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 20 },
        { color: "#22c55e", name: "B", pct: 20 },
        { color: "#3b82f6", name: "C", pct: 20 },
        { color: "#eab308", name: "D", pct: 20 },
        { color: "#8b5cf6", name: "E", pct: 20 },
      ],
      size: { height: 32, width: 100 },
      spec: { maxItems: 3, pad: 0, type: "lollipop" as const },
    };

    const model = computeModel(input);
    // 3 items = 3 stems + 3 dots = 6 marks
    expect(model.marks.length).toBe(6);
  });

  test("taller segments have taller stems", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 80 },
        { color: "#22c55e", name: "B", pct: 20 },
      ],
      size: { height: 100, width: 100 },
      spec: {
        dotRadius: 5,
        minStemHeight: 0,
        pad: 0,
        type: "lollipop" as const,
      },
    };

    const model = computeModel(input);
    const stems = model.marks.filter((m) => m.type === "rect");

    if (stems[0]?.type === "rect" && stems[1]?.type === "rect") {
      // First stem (80%) should be taller than second (20%)
      expect(stems[0].h).toBeGreaterThan(stems[1].h);
    }
  });

  test("dots stay within viewport bounds with large dotRadius", () => {
    // This configuration previously caused MARK_OUT_OF_BOUNDS warnings
    // when dotRadius was large relative to minStemHeight
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 10 }, // Low pct = short stem
      ],
      size: { height: 32, width: 100 },
      spec: {
        dotRadius: 5,
        minStemHeight: 6,
        pad: 2,
        type: "lollipop" as const,
      },
    };

    const model = computeModel(input);

    // Should have no warnings
    expect(model.stats?.warnings).toBeUndefined();

    // Verify dot is within bounds
    const dot = model.marks.find((m) => m.type === "circle");
    if (dot?.type === "circle") {
      const dotBottom = dot.cy + dot.r;
      expect(dotBottom).toBeLessThanOrEqual(32);
    }
  });
});
