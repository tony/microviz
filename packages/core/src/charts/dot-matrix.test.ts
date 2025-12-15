import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";

describe("dot-matrix", () => {
  test("produces a deterministic RenderModel", () => {
    const input = {
      data: { opacities: [1, 1, 1], series: [0, 50, 100] },
      size: { height: 32, width: 200 },
      spec: { cols: 3, maxDots: 4, type: "dot-matrix" as const },
    };

    const a = computeModel(input);
    const b = computeModel(input);

    expect(a).toEqual(b);
    expect(a.marks.length).toBe(6);
    expect(a.stats?.warnings).toBeUndefined();
    expect(a.marks.every((m) => m.type === "circle")).toBe(true);

    const fillOpacities = a.marks.map((m) =>
      m.type === "circle" ? m.fillOpacity : undefined,
    );
    expect(fillOpacities).toContain(0.7);
    expect(fillOpacities).toContain(1);
  });
});
