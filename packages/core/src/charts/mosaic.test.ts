import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";

describe("mosaic", () => {
  test("produces a deterministic RenderModel", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 38 },
        { color: "#22c55e", name: "B", pct: 22 },
        { color: "#3b82f6", name: "C", pct: 40 },
      ],
      size: { height: 32, width: 200 },
      spec: { gap: 1, pad: 0, type: "mosaic" as const },
    };

    const a = computeModel(input);
    const b = computeModel(input);

    expect(a).toEqual(b);
    expect(a.marks.length).toBe(3);
    expect(a.stats?.warnings).toBeUndefined();
    expect(a.marks.every((m) => m.type === "rect")).toBe(true);

    const major0 = a.marks[0];
    const major1 = a.marks[1];
    const minor0 = a.marks[2];

    if (major0?.type === "rect") {
      expect(major0.fill).toBe("#ef4444");
      expect(major0.x).toBe(0);
      expect(major0.w).toBeCloseTo(75.24, 6);
      expect(major0.h).toBe(32);
    }
    if (major1?.type === "rect") {
      expect(major1.fill).toBe("#22c55e");
      expect(major1.x).toBeCloseTo(76.24, 6);
      expect(major1.w).toBeCloseTo(43.56, 6);
    }
    if (minor0?.type === "rect") {
      expect(minor0.fill).toBe("#3b82f6");
      expect(minor0.x).toBeCloseTo(120.8, 6);
      expect(minor0.w).toBeCloseTo(79.2, 6);
      expect(minor0.h).toBe(32);
    }
  });
});
