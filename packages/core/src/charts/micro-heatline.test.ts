import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";

describe("micro-heatline", () => {
  test("produces a deterministic RenderModel", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 40 },
        { color: "#22c55e", name: "B", pct: 35 },
        { color: "#3b82f6", name: "C", pct: 25 },
      ],
      size: { height: 32, width: 100 },
      spec: { pad: 0, type: "micro-heatline" as const },
    };

    const a = computeModel(input);
    const b = computeModel(input);

    expect(a).toEqual(b);
    expect(a.marks.length).toBe(3);
    expect(a.stats?.warnings).toBeUndefined();
  });

  test("limits to maxLines segments", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 20 },
        { color: "#22c55e", name: "B", pct: 20 },
        { color: "#3b82f6", name: "C", pct: 20 },
        { color: "#eab308", name: "D", pct: 20 },
        { color: "#8b5cf6", name: "E", pct: 20 },
      ],
      size: { height: 100, width: 100 },
      spec: { maxLines: 3, pad: 0, type: "micro-heatline" as const },
    };

    const model = computeModel(input);
    expect(model.marks.length).toBe(3);
  });

  test("creates horizontal lines with width proportional to pct", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 60 },
        { color: "#22c55e", name: "B", pct: 40 },
      ],
      size: { height: 100, width: 100 },
      spec: { gap: 0, lineHeight: 2, pad: 0, type: "micro-heatline" as const },
    };

    const model = computeModel(input);
    const rects = model.marks.filter((m) => m.type === "rect");

    expect(rects.length).toBe(2);

    // First line should be 60% of width (normalized: 60/100*100 = 60)
    const firstLine = rects[0];
    if (firstLine?.type === "rect") {
      expect(firstLine.w).toBeCloseTo(60, 0);
      expect(firstLine.h).toBe(2);
    }

    // Second line should be 40% of width
    const secondLine = rects[1];
    if (secondLine?.type === "rect") {
      expect(secondLine.w).toBeCloseTo(40, 0);
      expect(secondLine.h).toBe(2);
    }
  });

  test("lines have rounded ends", () => {
    const input = {
      data: [{ color: "#ef4444", name: "A", pct: 50 }],
      size: { height: 100, width: 100 },
      spec: { lineHeight: 4, pad: 0, type: "micro-heatline" as const },
    };

    const model = computeModel(input);
    const rect = model.marks[0];

    if (rect?.type === "rect") {
      // rx/ry should be half the line height for pill shape
      expect(rect.rx).toBe(2);
      expect(rect.ry).toBe(2);
    }
  });
});
