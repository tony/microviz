import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";

describe("heatgrid", () => {
  test("produces a deterministic RenderModel", () => {
    const input = {
      data: {
        opacities: [1, 0.35, 1, 1, 0.35, 1],
        series: [22, 28, 40, 36, 52, 48],
      },
      size: { height: 32, width: 200 },
      spec: { cols: 12, rows: 4, type: "heatgrid" as const },
    };

    const a = computeModel(input);
    const b = computeModel(input);

    expect(a).toEqual(b);
    expect(a.marks.length).toBe(48);
    expect(a.stats?.warnings).toBeUndefined();
    expect(a.marks.every((m) => m.type === "rect")).toBe(true);
  });
});
