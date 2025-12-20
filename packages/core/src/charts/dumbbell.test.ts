import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";

describe("dumbbell", () => {
  test("produces a deterministic RenderModel", () => {
    const input = {
      data: { current: 72, max: 100, target: 60 },
      size: { height: 32, width: 200 },
      spec: { pad: 6, type: "dumbbell" as const },
    };

    const a = computeModel(input);
    const b = computeModel(input);

    expect(a).toEqual(b);
    expect(a.marks.length).toBe(4);
    expect(a.stats?.warnings).toBeUndefined();
    expect(a.marks.map((m) => m.type)).toEqual([
      "line",
      "line",
      "circle",
      "circle",
    ]);
    expect(a.marks.map((m) => m.id)).toEqual([
      "dumbbell-track",
      "dumbbell-range",
      "dumbbell-current",
      "dumbbell-target",
    ]);
  });
});
