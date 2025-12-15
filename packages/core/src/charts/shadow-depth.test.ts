import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";

describe("shadow-depth", () => {
  test("produces a deterministic RenderModel with filters", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 40 },
        { color: "#22c55e", name: "B", pct: 30 },
        { color: "#3b82f6", name: "C", pct: 20 },
        { color: "#a855f7", name: "D", pct: 10 },
      ],
      size: { height: 32, width: 200 },
      spec: { type: "shadow-depth" as const },
    };

    const a = computeModel(input);
    const b = computeModel(input);

    expect(a).toEqual(b);

    const filters = (a.defs ?? []).filter((d) => d.type === "filter");
    expect(filters.length).toBe(4);
    expect(a.marks.length).toBe(4);
    expect(a.marks.every((m) => m.type === "rect")).toBe(true);
    expect(a.marks.every((m) => "filter" in m && Boolean(m.filter))).toBe(true);
    expect(a.stats?.warnings).toBeUndefined();
  });

  test("handles empty data gracefully", () => {
    const model = computeModel({
      data: [],
      size: { height: 32, width: 200 },
      spec: { type: "shadow-depth" as const },
    });

    expect(model.marks.length).toBe(0);
  });
});
