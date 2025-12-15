import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";

describe("waveform", () => {
  test("produces a deterministic RenderModel", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 50 },
        { color: "#22c55e", name: "B", pct: 50 },
      ],
      size: { height: 32, width: 200 },
      spec: {
        barWidth: 6,
        bins: 24,
        gap: 1,
        pad: 0,
        type: "waveform" as const,
      },
    };

    const a = computeModel(input);
    const b = computeModel(input);

    expect(a).toEqual(b);
    expect(a.marks.length).toBe(24);
    expect(a.stats?.warnings).toBeUndefined();
    expect(a.marks.every((m) => m.type === "rect")).toBe(true);

    const first = a.marks[0];
    const second = a.marks[1];
    const last = a.marks[a.marks.length - 1];

    if (first?.type === "rect") {
      expect(first.fill).toBe("#ef4444");
      expect(first.x).toBe(0);
      expect(first.w).toBe(6);
      expect(first.h).toBeCloseTo(9.6, 6);
      expect(first.y).toBeCloseTo(11.2, 6);
    }
    if (second?.type === "rect") {
      expect(second.x).toBe(7);
      expect(second.w).toBe(6);
    }
    if (last?.type === "rect") {
      expect(last.fill).toBe("#22c55e");
      expect(last.x).toBe(161);
      expect(last.w).toBe(6);
    }
  });
});
