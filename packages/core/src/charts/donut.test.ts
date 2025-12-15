import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";

describe("donut", () => {
  test("produces a deterministic RenderModel", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 40 },
        { color: "#22c55e", name: "B", pct: 35 },
        { color: "#3b82f6", name: "C", pct: 25 },
      ],
      size: { height: 100, width: 100 },
      spec: { type: "donut" as const },
    };

    const a = computeModel(input);
    const b = computeModel(input);

    expect(a).toEqual(b);
    expect(a.marks.length).toBe(3);
    expect(a.stats?.warnings).toBeUndefined();
  });

  test("creates path marks for each segment", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 50 },
        { color: "#22c55e", name: "B", pct: 50 },
      ],
      size: { height: 100, width: 100 },
      spec: { type: "donut" as const },
    };

    const model = computeModel(input);
    expect(model.marks.length).toBe(2);

    for (const mark of model.marks) {
      expect(mark.type).toBe("path");
      if (mark.type === "path") {
        // Path should contain arc commands
        expect(mark.d).toContain("A");
        expect(mark.d).toContain("M");
        expect(mark.d).toContain("Z");
      }
    }
  });

  test("respects innerRadius option", () => {
    const input = {
      data: [{ color: "#ef4444", name: "A", pct: 100 }],
      size: { height: 100, width: 100 },
      spec: { innerRadius: 0.3, pad: 0, type: "donut" as const },
    };

    const model = computeModel(input);
    const segment = model.marks[0];

    if (segment?.type === "path") {
      // With innerRadius of 0.3 and radius of 50, inner radius should be 15
      // The path should contain arcs with radius ~50 (outer) and ~15 (inner)
      expect(segment.d).toContain("50.00 50.00"); // outer radius arc
      expect(segment.d).toContain("15.00 15.00"); // inner radius arc
    }
  });

  test("segments have correct fill colors", () => {
    const input = {
      data: [
        { color: "#ff0000", name: "Red", pct: 50 },
        { color: "#00ff00", name: "Green", pct: 50 },
      ],
      size: { height: 100, width: 100 },
      spec: { type: "donut" as const },
    };

    const model = computeModel(input);

    expect(model.marks[0]).toMatchObject({ fill: "#ff0000", type: "path" });
    expect(model.marks[1]).toMatchObject({ fill: "#00ff00", type: "path" });
  });

  test("handles single segment (full circle)", () => {
    const input = {
      data: [{ color: "#ef4444", name: "A", pct: 100 }],
      size: { height: 100, width: 100 },
      spec: { type: "donut" as const },
    };

    const model = computeModel(input);
    expect(model.marks.length).toBe(1);

    const segment = model.marks[0];
    if (segment?.type === "path") {
      // Full circle requires two half-arcs
      // Count number of arc commands (should be 4: 2 outer + 2 inner)
      const arcCount = (segment.d.match(/A /g) || []).length;
      expect(arcCount).toBe(4);
    }
  });

  test("handles empty data gracefully", () => {
    const input = {
      data: [],
      size: { height: 100, width: 100 },
      spec: { type: "donut" as const },
    };

    const model = computeModel(input);
    expect(model.marks.length).toBe(0);
  });

  test("segments start from top (12 o'clock position)", () => {
    const input = {
      data: [{ color: "#ef4444", name: "A", pct: 25 }],
      size: { height: 100, width: 100 },
      spec: { pad: 0, type: "donut" as const },
    };

    const model = computeModel(input);
    const segment = model.marks[0];

    if (segment?.type === "path") {
      // First segment should start at top center (50, 0 for outer edge)
      // With center at (50, 50) and radius 50, top point is (50, 0)
      expect(segment.d).toMatch(/M 50\.00 0\.00/);
    }
  });
});
