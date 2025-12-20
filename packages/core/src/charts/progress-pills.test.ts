import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";

describe("progress-pills", () => {
  test("produces a deterministic RenderModel", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 50 },
        { color: "#22c55e", name: "B", pct: 50 },
      ],
      size: { height: 32, width: 200 },
      spec: { gap: 4, pad: 0, pillHeight: 10, type: "progress-pills" as const },
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
      expect(first.fill).toBe("#ef4444");
      expect(first.x).toBe(0);
      expect(first.y).toBe(11);
      expect(first.w).toBeCloseTo(98, 6);
      expect(first.h).toBe(10);
      expect(first.rx).toBe(5);
      expect(first.ry).toBe(5);
    }
    if (second?.type === "rect") {
      expect(second.fill).toBe("#22c55e");
      expect(second.x).toBeCloseTo(102, 6);
      expect(second.y).toBe(11);
      expect(second.w).toBeCloseTo(98, 6);
      expect(second.h).toBe(10);
      expect(second.rx).toBe(5);
      expect(second.ry).toBe(5);
    }
  });
});
