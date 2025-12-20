import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";

describe("radial-burst", () => {
  test("produces a deterministic RenderModel", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 30 },
        { color: "#22c55e", name: "B", pct: 70 },
      ],
      size: { height: 32, width: 200 },
      spec: { type: "radial-burst" as const },
    };

    const a = computeModel(input);
    const b = computeModel(input);

    expect(a).toEqual(b);
    expect(a.marks.length).toBe(2);
    expect(a.marks.every((m) => m.type === "path")).toBe(true);
    expect(a.stats?.warnings).toBeUndefined();
  });

  test("handles empty data gracefully", () => {
    const input = {
      data: [],
      size: { height: 32, width: 200 },
      spec: { type: "radial-burst" as const },
    };

    const model = computeModel(input);
    expect(model.marks.length).toBe(0);
  });
});
