import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";

describe("spark-area", () => {
  test("produces a deterministic RenderModel", () => {
    const input = {
      data: [10, 25, 15, 30, 20],
      size: { height: 32, width: 200 },
      spec: { pad: 3, type: "spark-area" as const },
    };

    const a = computeModel(input);
    const b = computeModel(input);

    expect(a).toEqual(b);
    expect(a.stats?.warnings).toBeUndefined();
    expect(a.defs?.length).toBe(1);
    expect(a.stats?.hasDefs).toBe(true);
    expect(a.marks.map((m) => m.type)).toEqual(["path", "path", "circle"]);
    expect(a.marks.map((m) => m.id)).toEqual([
      "spark-area-area",
      "spark-area-line",
      "spark-area-dot",
    ]);

    const def = a.defs?.[0];
    const area = a.marks[0];
    if (def?.type === "linearGradient" && area?.type === "path") {
      expect(area.fill).toBe(`url(#${def.id})`);
      expect(area.stroke).toBe("none");
      expect(def.stops[0]?.opacity).toBeCloseTo(0.45, 6);
      expect(def.stops[1]?.opacity).toBe(0);
    }
  });
});
