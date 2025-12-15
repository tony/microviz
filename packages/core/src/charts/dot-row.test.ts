import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";

describe("dot-row", () => {
  test("produces a deterministic RenderModel", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 50 },
        { color: "#22c55e", name: "B", pct: 50 },
      ],
      size: { height: 32, width: 200 },
      spec: {
        dotRadius: 6,
        dots: 12,
        gap: 4,
        pad: 0,
        type: "dot-row" as const,
      },
    };

    const a = computeModel(input);
    const b = computeModel(input);

    expect(a).toEqual(b);
    expect(a.marks.length).toBe(12);
    expect(a.stats?.warnings).toBeUndefined();
    expect(a.marks.every((m) => m.type === "circle")).toBe(true);

    const first = a.marks[0];
    const second = a.marks[1];
    const last = a.marks[a.marks.length - 1];
    if (first?.type === "circle") {
      expect(first.fill).toBe("#ef4444");
      expect(first.cx).toBe(6);
      expect(first.cy).toBe(16);
      expect(first.r).toBe(6);
    }
    if (second?.type === "circle") {
      expect(second.cx).toBe(22);
      expect(second.cy).toBe(16);
      expect(second.r).toBe(6);
    }
    if (last?.type === "circle") {
      expect(last.fill).toBe("#22c55e");
      expect(last.cx).toBe(182);
      expect(last.cy).toBe(16);
      expect(last.r).toBe(6);
    }
  });
});
