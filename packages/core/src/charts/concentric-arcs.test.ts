import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";

describe("concentric-arcs", () => {
  test("produces a deterministic RenderModel", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 75 },
        { color: "#22c55e", name: "B", pct: 50 },
        { color: "#3b82f6", name: "C", pct: 25 },
      ],
      size: { height: 100, width: 100 },
      spec: { pad: 2, type: "concentric-arcs" as const },
    };

    const a = computeModel(input);
    const b = computeModel(input);

    expect(a).toEqual(b);
    // 3 arcs = 3 circle marks
    expect(a.marks.length).toBe(3);
    expect(a.stats?.warnings).toBeUndefined();
  });

  test("creates circle marks with stroke dasharray", () => {
    const input = {
      data: [{ color: "#ef4444", name: "A", pct: 50 }],
      size: { height: 100, width: 100 },
      spec: { pad: 0, strokeWidth: 4, type: "concentric-arcs" as const },
    };

    const model = computeModel(input);
    expect(model.marks.length).toBe(1);

    const mark = model.marks[0];
    if (mark?.type === "circle") {
      expect(mark.stroke).toBe("#ef4444");
      expect(mark.strokeWidth).toBe(4);
      expect(mark.fill).toBe("none");
      expect(mark.strokeDasharray).toBeDefined();
      expect(mark.strokeDashoffset).toBeDefined();
      expect(mark.strokeLinecap).toBe("round");
    }
  });

  test("respects ring count configuration", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 80 },
        { color: "#22c55e", name: "B", pct: 60 },
      ],
      size: { height: 100, width: 100 },
      spec: { pad: 0, rings: 4, type: "concentric-arcs" as const },
    };

    const model = computeModel(input);
    // 4 rings configured, should cycle through 2 colors
    expect(model.marks.length).toBe(4);
  });

  test("centers circles in the available space", () => {
    const input = {
      data: [{ color: "#ef4444", name: "A", pct: 100 }],
      size: { height: 100, width: 100 },
      spec: { pad: 10, type: "concentric-arcs" as const },
    };

    const model = computeModel(input);
    const mark = model.marks[0];

    if (mark?.type === "circle") {
      // Center should be at (50, 50) for 100x100 with pad=10
      expect(mark.cx).toBe(50);
      expect(mark.cy).toBe(50);
    }
  });

  test("handles empty data gracefully", () => {
    const input = {
      data: [],
      size: { height: 100, width: 100 },
      spec: { type: "concentric-arcs" as const },
    };

    const model = computeModel(input);
    expect(model.marks.length).toBe(0);
  });
});
