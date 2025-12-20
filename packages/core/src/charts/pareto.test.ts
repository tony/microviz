import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";

describe("pareto", () => {
  test("produces a deterministic RenderModel", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 40 },
        { color: "#22c55e", name: "B", pct: 35 },
        { color: "#3b82f6", name: "C", pct: 25 },
      ],
      size: { height: 32, width: 100 },
      spec: { pad: 0, type: "pareto" as const },
    };

    const a = computeModel(input);
    const b = computeModel(input);

    expect(a).toEqual(b);
    // 3 background rects + 3 foreground rects
    expect(a.marks.length).toBe(6);
    expect(a.stats?.warnings).toBeUndefined();
    expect(a.marks.every((m) => m.type === "rect")).toBe(true);
  });

  test("cumulative heights grow correctly", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 40 },
        { color: "#22c55e", name: "B", pct: 35 },
        { color: "#3b82f6", name: "C", pct: 25 },
      ],
      size: { height: 100, width: 100 },
      spec: { gap: 0, pad: 0, type: "pareto" as const },
    };

    const model = computeModel(input);

    // Background rects (first 3) should all be full height
    const bgRects = model.marks.slice(0, 3);
    for (const mark of bgRects) {
      if (mark.type === "rect") {
        expect(mark.h).toBe(100);
      }
    }

    // Foreground rects (last 3) should have cumulative heights
    const fgRects = model.marks.slice(3);
    const [first, second, third] = fgRects;

    if (
      first?.type === "rect" &&
      second?.type === "rect" &&
      third?.type === "rect"
    ) {
      // First: 40%, second: 40+35=75%, third: 40+35+25=100%
      expect(first.h).toBeCloseTo(40, 1);
      expect(second.h).toBeCloseTo(75, 1);
      expect(third.h).toBeCloseTo(100, 1);

      // All should be bottom-aligned (y + h = usableH)
      expect(first.y + first.h).toBeCloseTo(100, 1);
      expect(second.y + second.h).toBeCloseTo(100, 1);
      expect(third.y + third.h).toBeCloseTo(100, 1);
    }
  });

  test("respects bgOpacity option", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 50 },
        { color: "#22c55e", name: "B", pct: 50 },
      ],
      size: { height: 32, width: 100 },
      spec: { bgOpacity: 0.15, pad: 0, type: "pareto" as const },
    };

    const model = computeModel(input);
    const bgRects = model.marks.slice(0, 2);

    for (const mark of bgRects) {
      if (mark.type === "rect") {
        expect(mark.fillOpacity).toBe(0.15);
      }
    }
  });
});
