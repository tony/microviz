import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";

describe("perforated", () => {
  test("produces a deterministic RenderModel", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 60 },
        { color: "#22c55e", name: "B", pct: 40 },
      ],
      size: { height: 32, width: 200 },
      spec: { type: "perforated" as const },
    };

    const a = computeModel(input);
    const b = computeModel(input);

    expect(a).toEqual(b);
    // segments + 1 separator
    expect(a.marks.length).toBe(3);
    expect(a.defs?.length).toBe(1);
    expect(a.stats?.warnings).toBeUndefined();
  });

  test("handles empty data gracefully", () => {
    const input = {
      data: [],
      size: { height: 32, width: 200 },
      spec: { type: "perforated" as const },
    };

    const model = computeModel(input);
    expect(model.marks.length).toBe(0);
  });
});
