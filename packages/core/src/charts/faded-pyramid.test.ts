import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";

describe("faded-pyramid", () => {
  test("produces a deterministic RenderModel", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 40 },
        { color: "#22c55e", name: "B", pct: 35 },
        { color: "#3b82f6", name: "C", pct: 25 },
      ],
      size: { height: 32, width: 100 },
      spec: { pad: 0, type: "faded-pyramid" as const },
    };

    const a = computeModel(input);
    const b = computeModel(input);

    expect(a).toEqual(b);
    expect(a.marks.length).toBe(3);
    expect(a.stats?.warnings).toBeUndefined();
    expect(a.marks.every((m) => m.type === "rect")).toBe(true);
  });

  test("bars decrease in height by index (not by pct)", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 30 },
        { color: "#22c55e", name: "B", pct: 40 },
        { color: "#3b82f6", name: "C", pct: 30 },
      ],
      size: { height: 100, width: 100 },
      spec: {
        gap: 0,
        heightDecrement: 20,
        minHeightPct: 0,
        pad: 0,
        type: "faded-pyramid" as const,
      },
    };

    const model = computeModel(input);
    const marks = model.marks;

    // First bar should be tallest (100%)
    // Second bar should be 80% height
    // Third bar should be 60% height
    const [first, second, third] = marks;
    if (
      first?.type === "rect" &&
      second?.type === "rect" &&
      third?.type === "rect"
    ) {
      expect(first.h).toBeCloseTo(100, 1);
      expect(second.h).toBeCloseTo(80, 1);
      expect(third.h).toBeCloseTo(60, 1);
    }
  });

  test("bars are aligned to bottom", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 50 },
        { color: "#22c55e", name: "B", pct: 50 },
      ],
      size: { height: 32, width: 100 },
      spec: { gap: 0, pad: 0, type: "faded-pyramid" as const },
    };

    const model = computeModel(input);

    // All bars should end at y + h = 32 (aligned to bottom)
    for (const mark of model.marks) {
      if (mark.type === "rect") {
        expect(mark.y + mark.h).toBeCloseTo(32, 1);
      }
    }
  });

  test("respects minHeightPct option", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 20 },
        { color: "#22c55e", name: "B", pct: 20 },
        { color: "#3b82f6", name: "C", pct: 20 },
        { color: "#f59e0b", name: "D", pct: 20 },
        { color: "#8b5cf6", name: "E", pct: 20 },
      ],
      size: { height: 100, width: 100 },
      spec: {
        gap: 0,
        heightDecrement: 30,
        minHeightPct: 40,
        pad: 0,
        type: "faded-pyramid" as const,
      },
    };

    const model = computeModel(input);

    // Even though heightDecrement=30 would make last bars very short,
    // minHeightPct=40 should prevent bars from being shorter than 40px
    for (const mark of model.marks) {
      if (mark.type === "rect") {
        expect(mark.h).toBeGreaterThanOrEqual(40);
      }
    }
  });

  test("returns empty marks for empty data", () => {
    const input = {
      data: [],
      size: { height: 32, width: 100 },
      spec: { type: "faded-pyramid" as const },
    };

    const model = computeModel(input);
    expect(model.marks.length).toBe(0);
  });
});
