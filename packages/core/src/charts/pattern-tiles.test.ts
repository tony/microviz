import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";

describe("pattern-tiles", () => {
  test("produces a deterministic RenderModel", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 40 },
        { color: "#22c55e", name: "B", pct: 30 },
        { color: "#3b82f6", name: "C", pct: 20 },
        { color: "#a855f7", name: "D", pct: 10 },
      ],
      size: { height: 8, width: 32 },
      spec: { type: "pattern-tiles" as const },
    };

    const a = computeModel(input);
    const b = computeModel(input);

    expect(a).toEqual(b);
    // 4 segments, each rendered as base + pattern overlay
    expect(a.marks.length).toBe(8);
    expect(a.defs?.length).toBe(4);
    expect(a.stats?.warnings).toBeUndefined();
  });

  test("handles empty data gracefully", () => {
    const input = {
      data: [],
      size: { height: 8, width: 32 },
      spec: { type: "pattern-tiles" as const },
    };

    const model = computeModel(input);
    expect(model.marks.length).toBe(0);
  });
});
