import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";

describe("skyline", () => {
  test("produces a deterministic RenderModel", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 40 },
        { color: "#22c55e", name: "B", pct: 35 },
        { color: "#3b82f6", name: "C", pct: 25 },
      ],
      size: { height: 32, width: 100 },
      spec: { pad: 0, type: "skyline" as const },
    };

    const a = computeModel(input);
    const b = computeModel(input);

    expect(a).toEqual(b);
    expect(a.marks.length).toBe(3);
    expect(a.stats?.warnings).toBeUndefined();
    expect(a.marks.every((m) => m.type === "rect")).toBe(true);
  });

  test("bars are aligned to bottom with height proportional to pct", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 50 },
        { color: "#22c55e", name: "B", pct: 25 },
        { color: "#3b82f6", name: "C", pct: 25 },
      ],
      size: { height: 32, width: 100 },
      spec: { gap: 0, minHeightPct: 0, pad: 0, type: "skyline" as const },
    };

    const model = computeModel(input);
    const marks = model.marks;

    // All bars should end at y + h = 32 (aligned to bottom)
    for (const mark of marks) {
      if (mark.type === "rect") {
        expect(mark.y + mark.h).toBeCloseTo(32, 1);
      }
    }

    // First bar (50% normalized = 50%) should be tallest
    // Heights proportional to normalized pct/maxPct
    const [first, second] = marks;
    if (first?.type === "rect" && second?.type === "rect") {
      expect(first.h).toBeGreaterThan(second.h);
    }
  });

  test("respects minHeightPct option", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 100 },
        { color: "#22c55e", name: "B", pct: 10 },
      ],
      size: { height: 100, width: 100 },
      spec: { gap: 0, minHeightPct: 30, pad: 0, type: "skyline" as const },
    };

    const model = computeModel(input);
    const [_first, second] = model.marks;

    // Second bar has low pct but should have at least minHeightPct height
    if (second?.type === "rect") {
      expect(second.h).toBeGreaterThanOrEqual(30);
    }
  });
});
