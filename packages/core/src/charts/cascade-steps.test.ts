import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";

describe("cascade-steps", () => {
  test("produces a deterministic RenderModel", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 40 },
        { color: "#22c55e", name: "B", pct: 35 },
        { color: "#3b82f6", name: "C", pct: 25 },
      ],
      size: { height: 32, width: 100 },
      spec: { pad: 0, type: "cascade-steps" as const },
    };

    const a = computeModel(input);
    const b = computeModel(input);

    expect(a).toEqual(b);
    expect(a.marks.length).toBe(3);
    expect(a.stats?.warnings).toBeUndefined();
    expect(a.marks.every((m) => m.type === "rect")).toBe(true);
  });

  test("height decreases by index", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 33 },
        { color: "#22c55e", name: "B", pct: 33 },
        { color: "#3b82f6", name: "C", pct: 34 },
      ],
      size: { height: 100, width: 100 },
      spec: {
        gap: 0,
        minHeightPct: 0,
        pad: 0,
        stepDecrement: 20,
        type: "cascade-steps" as const,
      },
    };

    const model = computeModel(input);
    const [first, second, third] = model.marks;

    if (
      first?.type === "rect" &&
      second?.type === "rect" &&
      third?.type === "rect"
    ) {
      // First bar: 100%, second: 80%, third: 60%
      expect(first.h).toBeCloseTo(100, 1);
      expect(second.h).toBeCloseTo(80, 1);
      expect(third.h).toBeCloseTo(60, 1);

      // All bars should be aligned to bottom (y + h = 100)
      expect(first.y + first.h).toBeCloseTo(100, 1);
      expect(second.y + second.h).toBeCloseTo(100, 1);
      expect(third.y + third.h).toBeCloseTo(100, 1);
    }
  });

  test("respects minHeightPct option", () => {
    const input = {
      data: Array.from({ length: 10 }, (_, i) => ({
        color: "#ef4444",
        name: String(i),
        pct: 10,
      })),
      size: { height: 100, width: 100 },
      spec: {
        gap: 0,
        minHeightPct: 25,
        pad: 0,
        stepDecrement: 15,
        type: "cascade-steps" as const,
      },
    };

    const model = computeModel(input);
    const lastMark = model.marks[model.marks.length - 1];

    // Last bar would be 100 - 9*15 = -35% but should be clamped to minHeightPct
    if (lastMark?.type === "rect") {
      expect(lastMark.h).toBeGreaterThanOrEqual(25);
    }
  });
});
