import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";

describe("dot-cascade", () => {
  test("produces a deterministic RenderModel", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 50 },
        { color: "#22c55e", name: "B", pct: 50 },
      ],
      size: { height: 32, width: 200 },
      spec: { dotRadius: 4, dots: 16, pad: 0, type: "dot-cascade" as const },
    };

    const a = computeModel(input);
    const b = computeModel(input);

    expect(a).toEqual(b);
    expect(a.marks.length).toBe(16);
    expect(a.stats?.warnings).toBeUndefined();
    expect(a.marks.every((m) => m.type === "circle")).toBe(true);

    const first = a.marks[0];
    const last = a.marks[a.marks.length - 1];

    if (first?.type === "circle") {
      expect(first.fill).toBe("#ef4444");
      expect(first.cx).toBeCloseTo(6.25, 6);
      expect(first.cy).toBe(4);
      expect(first.r).toBe(4);
    }
    if (last?.type === "circle") {
      expect(last.fill).toBe("#22c55e");
      expect(last.cx).toBeCloseTo(193.75, 6);
      expect(last.cy).toBeCloseTo(10, 6);
      expect(last.r).toBe(4);
    }
  });
});
