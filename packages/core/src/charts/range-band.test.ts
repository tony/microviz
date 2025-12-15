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
    expect(a.marks.map((m) => m.type)).toEqual(["path", "path", "circle"]);
    expect(a.marks.map((m) => m.id)).toEqual([
      "range-band-band",
      "range-band-line",
      "range-band-dot",
    ]);

    const band = a.marks[0];
    const line = a.marks[1];
    const dot = a.marks[2];

    if (band?.type === "path") {
      expect(band.d).toBeTruthy();
      expect(band.fillOpacity).toBeCloseTo(0.18, 6);
    }
    if (line?.type === "path") {
      expect(line.d).toBeTruthy();
      expect(line.fill).toBe("none");
      expect(line.strokeWidth).toBe(2);
    }
    if (dot?.type === "circle") {
      expect(dot.r).toBeCloseTo(2.2, 6);
    }
  });
});
