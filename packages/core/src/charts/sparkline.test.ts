import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";

describe("sparkline", () => {
  test("produces a deterministic RenderModel", () => {
    const input = {
      data: [10, 25, 15, 30, 20],
      size: { height: 32, width: 200 },
      spec: { pad: 3, type: "sparkline" as const },
    };

    const a = computeModel(input);
    const b = computeModel(input);

    expect(a).toEqual(b);
    expect(a.marks.length).toBeGreaterThan(0);
    expect(a.stats?.warnings).toBeUndefined();

    const first = a.marks[0];
    expect(first?.type).toBe("path");
    if (first?.type === "path") {
      expect(first.d).toBeTruthy();
    }
  });
});
