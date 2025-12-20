import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";

describe("dna-helix", () => {
  test("produces a deterministic RenderModel", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 40 },
        { color: "#22c55e", name: "B", pct: 35 },
        { color: "#3b82f6", name: "C", pct: 25 },
      ],
      size: { height: 32, width: 100 },
      spec: { pad: 0, type: "dna-helix" as const },
    };

    const a = computeModel(input);
    const b = computeModel(input);

    expect(a).toEqual(b);
    // 3 segments × 2 strands = 6 marks
    expect(a.marks.length).toBe(6);
    expect(a.stats?.warnings).toBeUndefined();
  });

  test("creates two strands of rectangles", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 50 },
        { color: "#22c55e", name: "B", pct: 50 },
      ],
      size: { height: 100, width: 100 },
      spec: {
        gap: 0,
        pad: 0,
        strandGap: 4,
        strandHeight: 6,
        type: "dna-helix" as const,
      },
    };

    const model = computeModel(input);
    const rects = model.marks.filter((m) => m.type === "rect");

    // 2 segments × 2 strands = 4 marks
    expect(rects.length).toBe(4);

    // All should have correct height
    for (const rect of rects) {
      if (rect.type === "rect") {
        expect(rect.h).toBe(6);
      }
    }
  });

  test("segments alternate rendering order for weaving effect", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 50 },
        { color: "#22c55e", name: "B", pct: 50 },
      ],
      size: { height: 100, width: 100 },
      spec: {
        gap: 0,
        pad: 0,
        strandGap: 4,
        strandHeight: 6,
        type: "dna-helix" as const,
      },
    };

    const model = computeModel(input);
    const rects = model.marks.filter((m) => m.type === "rect");

    // Should have 4 marks total (2 segments × 2 strands)
    expect(rects.length).toBe(4);

    // Get Y positions to verify we have two distinct strands
    const yPositions = new Set(rects.map((r) => (r.type === "rect" ? r.y : 0)));
    expect(yPositions.size).toBe(2);
  });

  test("strands have rounded ends", () => {
    const input = {
      data: [{ color: "#ef4444", name: "A", pct: 100 }],
      size: { height: 100, width: 100 },
      spec: { pad: 0, strandHeight: 8, type: "dna-helix" as const },
    };

    const model = computeModel(input);
    const rect = model.marks[0];

    if (rect?.type === "rect") {
      // rx/ry should be half the strand height for pill shape
      expect(rect.rx).toBe(4);
      expect(rect.ry).toBe(4);
    }
  });
});
