import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";

describe("waveform", () => {
  test("produces a deterministic RenderModel", () => {
    const input = {
      data: [0, 50, 100, 50],
      size: { height: 32, width: 200 },
      spec: {
        barWidth: 6,
        bins: 4,
        gap: 1,
        pad: 0,
        type: "waveform" as const,
      },
    };

    const a = computeModel(input);
    const b = computeModel(input);

    expect(a).toEqual(b);
    expect(a.marks.length).toBe(4);
    expect(a.stats?.warnings).toBeUndefined();
    expect(a.marks.every((m) => m.type === "rect")).toBe(true);

    const first = a.marks[0];
    const second = a.marks[1];
    const third = a.marks[2];

    if (first?.type === "rect") {
      expect(first.x).toBe(0);
      expect(first.w).toBe(6);
      expect(first.h).toBeCloseTo(2, 6);
      expect(first.y).toBeCloseTo(15, 6);
    }
    if (second?.type === "rect") {
      expect(second.x).toBe(7);
      expect(second.w).toBe(6);
      expect(second.h).toBeCloseTo(16, 6);
    }
    if (third?.type === "rect") {
      expect(third.x).toBe(14);
      expect(third.w).toBe(6);
      expect(third.h).toBeCloseTo(32, 6);
      expect(third.y).toBeCloseTo(0, 6);
    }
  });
});
