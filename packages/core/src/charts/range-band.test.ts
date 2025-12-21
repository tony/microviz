import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";

describe("range-band", () => {
  test("produces a deterministic RenderModel", () => {
    const input = {
      data: [10, 25, 15, 30, 20],
      size: { height: 32, width: 200 },
      spec: { bandSeed: 42, pad: 3, type: "range-band" as const },
    };

    const a = computeModel(input);
    const b = computeModel(input);

    expect(a).toEqual(b);
    expect(a.stats?.warnings).toBeUndefined();
    expect(a.marks[0]?.type).toBe("path");
    expect(a.marks[a.marks.length - 1]?.type).toBe("circle");

    const band = a.marks[0];
    const lines = a.marks.filter((mark) => mark.type === "line");
    const dot = a.marks.find((mark) => mark.type === "circle");

    if (band?.type === "path") {
      expect(band.d).toBeTruthy();
      expect(band.fillOpacity).toBeCloseTo(0.18, 6);
    }
    expect(lines.length).toBe(4);
    expect(lines.every((line) => line.strokeWidth === 2)).toBe(true);
    expect(dot?.type).toBe("circle");
    if (dot?.type === "circle") expect(dot.r).toBeCloseTo(2.2, 6);
  });
});
