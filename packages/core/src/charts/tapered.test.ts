import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";

describe("tapered", () => {
  test("produces a deterministic RenderModel", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 50 },
        { color: "#22c55e", name: "B", pct: 50 },
      ],
      size: { height: 32, width: 200 },
      spec: { type: "tapered" as const },
    };

    const a = computeModel(input);
    const b = computeModel(input);

    expect(a).toEqual(b);
    expect(a.marks.length).toBe(2);
    expect(a.stats?.warnings).toBeUndefined();
  });

  test("handles empty data gracefully", () => {
    const input = {
      data: [],
      size: { height: 32, width: 200 },
      spec: { type: "tapered" as const },
    };

    const model = computeModel(input);
    expect(model.marks.length).toBe(0);
  });
});
