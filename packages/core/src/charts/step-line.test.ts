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
    // 8 lines + 1 dot = 9 marks
    expect(a.marks.length).toBe(9);
    expect(a.stats?.warnings).toBeUndefined();
  });

  test("creates step-interpolated segments with horizontal and vertical lines", () => {
    const input = {
      data: [10, 20, 30],
      size: { height: 32, width: 100 },
      spec: { pad: 0, showDot: false, type: "step-line" as const },
    };

    const model = computeModel(input);
    const lines = model.marks.filter((mark) => mark.type === "line");

    expect(lines.length).toBe(4);
    expect(
      lines.every(
        (line) =>
          line.type === "line" && (line.x1 === line.x2 || line.y1 === line.y2),
      ),
    ).toBe(true);
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
    const lines = model.marks.filter((mark) => mark.type === "line");

    expect(lines.length).toBe(0);
  });

  test("uses mv-line class for consistent theming with sparkline", () => {
    const input = {
      data: [10, 20, 30],
      size: { height: 32, width: 100 },
      spec: { type: "step-line" as const },
    };

    const model = computeModel(input);
    const line = model.marks.find((m) => m.type === "line");

    expect(line?.className).toContain("mv-line");
  });
});
