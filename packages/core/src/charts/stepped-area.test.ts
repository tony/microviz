import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";

describe("stepped-area", () => {
  test("produces a deterministic RenderModel", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 40 },
        { color: "#22c55e", name: "B", pct: 35 },
        { color: "#3b82f6", name: "C", pct: 25 },
      ],
      size: { height: 32, width: 100 },
      spec: { pad: 0, type: "stepped-area" as const },
    };

    const a = computeModel(input);
    const b = computeModel(input);

    expect(a).toEqual(b);
    expect(a.marks.length).toBe(3);
    expect(a.stats?.warnings).toBeUndefined();
    expect(a.marks.every((m) => m.type === "rect")).toBe(true);
  });

  test("segments have decreasing height and increasing y offset", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 33 },
        { color: "#22c55e", name: "B", pct: 33 },
        { color: "#3b82f6", name: "C", pct: 34 },
      ],
      size: { height: 100, width: 100 },
      spec: { gap: 0, pad: 0, stepOffset: 10, type: "stepped-area" as const },
    };

    const model = computeModel(input);
    const [first, second, third] = model.marks;

    if (
      first?.type === "rect" &&
      second?.type === "rect" &&
      third?.type === "rect"
    ) {
      // First: y=0, h=100; Second: y=10, h=90; Third: y=20, h=80
      expect(first.y).toBe(0);
      expect(first.h).toBe(100);

      expect(second.y).toBe(10);
      expect(second.h).toBe(90);

      expect(third.y).toBe(20);
      expect(third.h).toBe(80);
    }
  });

  test("respects stepOffset option", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 50 },
        { color: "#22c55e", name: "B", pct: 50 },
      ],
      size: { height: 100, width: 100 },
      spec: { gap: 0, pad: 0, stepOffset: 20, type: "stepped-area" as const },
    };

    const model = computeModel(input);
    const [first, second] = model.marks;

    if (first?.type === "rect" && second?.type === "rect") {
      expect(first.y).toBe(0);
      expect(first.h).toBe(100);
      expect(second.y).toBe(20);
      expect(second.h).toBe(80);
    }
  });
});
