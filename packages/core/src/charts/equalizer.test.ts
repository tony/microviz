import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";

describe("equalizer", () => {
  test("produces a deterministic RenderModel", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 40 },
        { color: "#22c55e", name: "B", pct: 35 },
        { color: "#3b82f6", name: "C", pct: 25 },
      ],
      size: { height: 32, width: 100 },
      spec: { type: "equalizer" as const },
    };

    const a = computeModel(input);
    const b = computeModel(input);

    expect(a).toEqual(b);
    // Default bins is 16
    expect(a.marks.length).toBe(16);
    expect(a.stats?.warnings).toBeUndefined();
  });

  test("bars grow from bottom (not centered like waveform)", () => {
    const input = {
      data: [{ color: "#ef4444", name: "A", pct: 100 }],
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
      data: [{ color: "#ef4444", name: "A", pct: 100 }],
      size: { height: 32, width: 100 },
      spec: { bins: 8, type: "equalizer" as const },
    };

    const model = computeModel(input);
    expect(model.marks.length).toBe(8);
  });

  test("creates rect marks with fill color", () => {
    const input = {
      data: [{ color: "#ef4444", name: "A", pct: 100 }],
      size: { height: 32, width: 100 },
      spec: { bins: 1, type: "equalizer" as const },
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
