import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";

describe("equalizer", () => {
  test("produces a deterministic RenderModel", () => {
    const input = {
      data: [10, 30, 55, 20],
      size: { height: 32, width: 100 },
      spec: { type: "equalizer" as const },
    };

    const a = computeModel(input);
    const b = computeModel(input);

    expect(a).toEqual(b);
    // Default bins uses series length
    expect(a.marks.length).toBe(4);
    expect(a.stats?.warnings).toBeUndefined();
  });

  test("bars grow from bottom (not centered like waveform)", () => {
    const input = {
      data: [100],
      size: { height: 100, width: 100 },
      spec: { bins: 1, pad: 0, type: "equalizer" as const },
    };

    const model = computeModel(input);
    const bar = model.marks[0];

    expect(bar?.type).toBe("rect");
    if (bar?.type === "rect") {
      // Bar should end at y + h = 100 (bottom of viewport)
      expect(bar.y + bar.h).toBeCloseTo(100);
    }
  });

  test("respects bins option", () => {
    const input = {
      data: [100],
      size: { height: 32, width: 100 },
      spec: { bins: 8, type: "equalizer" as const },
    };

    const model = computeModel(input);
    expect(model.marks.length).toBe(8);
  });

  test("creates rect marks with fill color", () => {
    const input = {
      data: [100],
      size: { height: 32, width: 100 },
      spec: { bins: 1, colors: ["#ef4444"], type: "equalizer" as const },
    };

    const model = computeModel(input);
    const bar = model.marks[0];

    expect(bar?.type).toBe("rect");
    if (bar?.type === "rect") {
      expect(bar.fill).toBe("#ef4444");
    }
  });

  test("handles empty data gracefully", () => {
    const input = {
      data: [],
      size: { height: 32, width: 100 },
      spec: { type: "equalizer" as const },
    };

    const model = computeModel(input);
    expect(model.marks.length).toBe(0);
  });
});
