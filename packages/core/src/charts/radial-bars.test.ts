import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";

describe("radial-bars", () => {
  test("produces a deterministic RenderModel", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 40 },
        { color: "#22c55e", name: "B", pct: 30 },
        { color: "#3b82f6", name: "C", pct: 30 },
      ],
      size: { height: 32, width: 32 },
      spec: {
        minLength: 3,
        pad: 0,
        strokeWidth: 2.5,
        type: "radial-bars" as const,
      },
    };

    const a = computeModel(input);
    const b = computeModel(input);

    expect(a).toEqual(b);
    expect(a.marks.length).toBe(3);
    expect(a.marks.every((m) => m.type === "line")).toBe(true);
    expect(a.stats?.warnings).toBeUndefined();

    const first = a.marks[0];
    if (first?.type === "line") {
      expect(first.x1).toBeCloseTo(16, 6);
      expect(first.y1).toBeCloseTo(16, 6);
      expect(first.x2).toBeCloseTo(16, 6);
      expect(first.y2).toBeLessThan(16);
    }
  });
});
