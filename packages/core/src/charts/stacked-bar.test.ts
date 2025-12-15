import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";

describe("stacked-bar", () => {
  test("produces a deterministic RenderModel", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 40 },
        { color: "#22c55e", name: "B", pct: 60 },
      ],
      size: { height: 10, width: 100 },
      spec: { pad: 0, type: "stacked-bar" as const },
    };

    const a = computeModel(input);
    const b = computeModel(input);

    expect(a).toEqual(b);
    expect(a.marks.length).toBe(4);
    expect(a.stats?.warnings).toBeUndefined();
    expect(a.marks.every((m) => m.type === "rect")).toBe(true);
    expect(a.marks.map((m) => m.id)).toEqual([
      "stacked-bar-seg-0",
      "stacked-bar-seg-0-inner",
      "stacked-bar-seg-1",
      "stacked-bar-seg-1-inner",
    ]);

    const seg0 = a.marks.find((m) => m.id === "stacked-bar-seg-0");
    const seg1 = a.marks.find((m) => m.id === "stacked-bar-seg-1");
    const inner0 = a.marks.find((m) => m.id === "stacked-bar-seg-0-inner");
    const inner1 = a.marks.find((m) => m.id === "stacked-bar-seg-1-inner");

    if (seg0?.type === "rect") {
      expect(seg0.x).toBe(0);
      expect(seg0.w).toBeCloseTo(40, 6);
      expect(seg0.rx).toBe(4);
      expect(seg0.ry).toBe(4);
    }
    if (seg1?.type === "rect") {
      expect(seg1.x).toBeCloseTo(40, 6);
      expect(seg1.w).toBeCloseTo(60, 6);
      expect(seg1.rx).toBe(4);
      expect(seg1.ry).toBe(4);
    }
    if (inner0?.type === "rect") {
      expect(inner0.x).toBe(4);
      expect(inner0.w).toBeCloseTo(36, 6);
    }
    if (inner1?.type === "rect") {
      expect(inner1.x).toBeCloseTo(40, 6);
      expect(inner1.w).toBeCloseTo(56, 6);
    }
  });
});
