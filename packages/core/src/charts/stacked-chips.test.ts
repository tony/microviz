import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";

describe("stacked-chips", () => {
  test("produces a deterministic RenderModel", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 40 },
        { color: "#22c55e", name: "B", pct: 30 },
        { color: "#3b82f6", name: "C", pct: 20 },
        { color: "#f59e0b", name: "D", pct: 10 },
      ],
      size: { height: 12, width: 48 },
      spec: { maxChips: 4, overlap: 4, pad: 0, type: "stacked-chips" as const },
    };

    const a = computeModel(input);
    const b = computeModel(input);

    expect(a).toEqual(b);
    expect(a.marks.every((m) => m.type === "rect")).toBe(true);
    expect(a.stats?.warnings).toBeUndefined();
  });
});
