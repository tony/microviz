import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";

describe("step-line", () => {
  test("produces a deterministic RenderModel", () => {
    const input = {
      data: [10, 20, 15, 30, 25],
      size: { height: 32, width: 100 },
      spec: { pad: 3, type: "step-line" as const },
    };

    const a = computeModel(input);
    const b = computeModel(input);

    expect(a).toEqual(b);
    // 1 path + 1 dot = 2 marks
    expect(a.marks.length).toBe(2);
    expect(a.stats?.warnings).toBeUndefined();
  });

  test("creates step-interpolated path with horizontal-then-vertical segments", () => {
    const input = {
      data: [10, 20, 30],
      size: { height: 32, width: 100 },
      spec: { pad: 0, showDot: false, type: "step-line" as const },
    };

    const model = computeModel(input);
    const path = model.marks[0];

    expect(path?.type).toBe("path");
    if (path?.type === "path") {
      // Path should contain H (horizontal) and V (vertical) commands
      // Pattern: M x y H x V y H x V y ...
      expect(path.d).toMatch(/^M\s/);
      expect(path.d).toContain("H");
      expect(path.d).toContain("V");
      // Should NOT contain L for diagonal lines
      expect(path.d).not.toContain("L");
    }
  });

  test("shows dot by default at last point", () => {
    const input = {
      data: [10, 20, 30],
      size: { height: 32, width: 100 },
      spec: { pad: 0, type: "step-line" as const },
    };

    const model = computeModel(input);
    const dot = model.marks.find((m) => m.type === "circle");

    expect(dot).toBeDefined();
    if (dot?.type === "circle") {
      // Dot should be at the end (x = width since no pad)
      expect(dot.cx).toBeCloseTo(100);
      expect(dot.r).toBeCloseTo(2.4);
    }
  });

  test("hides dot when showDot is false", () => {
    const input = {
      data: [10, 20, 30],
      size: { height: 32, width: 100 },
      spec: { showDot: false, type: "step-line" as const },
    };

    const model = computeModel(input);
    const dots = model.marks.filter((m) => m.type === "circle");

    expect(dots.length).toBe(0);
  });

  test("handles empty data gracefully", () => {
    const input = {
      data: [],
      size: { height: 32, width: 100 },
      spec: { type: "step-line" as const },
    };

    const model = computeModel(input);
    expect(model.marks.length).toBe(0);
  });

  test("handles single data point", () => {
    const input = {
      data: [42],
      size: { height: 32, width: 100 },
      spec: { pad: 0, showDot: false, type: "step-line" as const },
    };

    const model = computeModel(input);
    const path = model.marks[0];

    expect(path?.type).toBe("path");
    if (path?.type === "path") {
      // Single point should just have an M command
      expect(path.d).toMatch(/^M\s/);
      // No H or V commands with just one point
      expect(path.d.match(/[HV]/g)).toBeNull();
    }
  });

  test("uses mv-line class for consistent theming with sparkline", () => {
    const input = {
      data: [10, 20, 30],
      size: { height: 32, width: 100 },
      spec: { type: "step-line" as const },
    };

    const model = computeModel(input);
    const path = model.marks.find((m) => m.type === "path");

    expect(path?.className).toContain("mv-line");
  });
});
