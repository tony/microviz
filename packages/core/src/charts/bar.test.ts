import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";

describe("bar", () => {
  test("produces a deterministic RenderModel", () => {
    const input = {
      data: { max: 100, value: 72 },
      size: { height: 20, width: 220 },
      spec: { pad: 2, type: "bar" as const },
    };

    const a = computeModel(input);
    const b = computeModel(input);

    expect(a).toEqual(b);
    expect(a.marks.length).toBeGreaterThan(0);
    expect(a.stats?.warnings).toBeUndefined();
    const mark = a.marks[0];
    expect(mark).toMatchObject({
      className: "mv-bar",
      h: 16,
      id: "bar-fill",
      type: "rect",
      x: 2,
      y: 2,
    });
    if (mark?.type === "rect") {
      expect(mark.w).toBeCloseTo(216 * 0.72);
    }
  });
});
