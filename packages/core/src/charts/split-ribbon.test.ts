import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";
import type { RectMark } from "../model";

describe("split-ribbon", () => {
  test("produces a deterministic RenderModel", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 40 },
        { color: "#22c55e", name: "B", pct: 35 },
        { color: "#3b82f6", name: "C", pct: 25 },
      ],
      size: { height: 32, width: 100 },
      spec: { pad: 0, splitAt: 2, type: "split-ribbon" as const },
    };

    const a = computeModel(input);
    const b = computeModel(input);

    expect(a).toEqual(b);
    expect(a.marks.length).toBe(3);
    expect(a.stats?.warnings).toBeUndefined();
  });

  test("splits segments across top and bottom ribbons", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 22 },
        { color: "#22c55e", name: "B", pct: 18 },
        { color: "#3b82f6", name: "C", pct: 20 },
        { color: "#f59e0b", name: "D", pct: 25 },
        { color: "#a855f7", name: "E", pct: 15 },
      ],
      size: { height: 32, width: 100 },
      spec: {
        gap: 2,
        pad: 0,
        ribbonGap: 4,
        splitAt: 3,
        type: "split-ribbon" as const,
      },
    };

    const model = computeModel(input);
    const rects = model.marks.filter((m): m is RectMark => m.type === "rect");

    const topRects = rects.filter((r) => r.id.startsWith("split-ribbon-top-"));
    const bottomRects = rects.filter((r) =>
      r.id.startsWith("split-ribbon-bottom-"),
    );

    expect(topRects.length).toBe(3);
    expect(bottomRects.length).toBe(2);

    const yPositions = new Set(rects.map((r) => r.y));
    expect(yPositions.size).toBe(2);

    expect(topRects[0]?.x).toBe(0);
    expect(bottomRects[0]?.x).toBe(0);
  });

  test("handles empty data gracefully", () => {
    const input = {
      data: [],
      size: { height: 32, width: 100 },
      spec: { type: "split-ribbon" as const },
    };

    const model = computeModel(input);
    expect(model.marks.length).toBe(0);
  });
});
