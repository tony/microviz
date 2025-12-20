import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";

describe("segmented-bar", () => {
  test("produces a deterministic RenderModel", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 40 },
        { color: "#22c55e", name: "B", pct: 60 },
      ],
      size: { height: 10, width: 100 },
      spec: { gap: 2, pad: 0, type: "segmented-bar" as const },
    };

    const a = computeModel(input);
    const b = computeModel(input);

    expect(a).toEqual(b);
    expect(a.marks.length).toBe(2);
    expect(a.stats?.warnings).toBeUndefined();
    expect(a.marks.every((m) => m.type === "rect")).toBe(true);

    const first = a.marks[0];
    const second = a.marks[1];
    if (first?.type === "rect") {
      expect(first.x).toBe(0);
      expect(first.w).toBeCloseTo(39.2, 6);
      expect(first.rx).toBe(2);
      expect(first.ry).toBe(2);
    }
    if (second?.type === "rect") {
      expect(second.x).toBeCloseTo(41.2, 6);
      expect(second.w).toBeCloseTo(58.8, 6);
      expect(second.rx).toBe(2);
      expect(second.ry).toBe(2);
    }
  });
});
