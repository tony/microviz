import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";

describe("pixel-treemap", () => {
  test("produces a deterministic RenderModel", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 50 },
        { color: "#22c55e", name: "B", pct: 20 },
        { color: "#3b82f6", name: "C", pct: 20 },
        { color: "#f59e0b", name: "D", pct: 10 },
      ],
      size: { height: 32, width: 32 },
      spec: { cornerRadius: 6, pad: 0, type: "pixel-treemap" as const },
    };

    const a = computeModel(input);
    const b = computeModel(input);

    expect(a).toEqual(b);
    expect(a.marks.every((m) => m.type === "rect")).toBe(true);
    expect(a.marks.length).toBe(4);
    expect(a.defs?.some((d) => d.type === "clipRect")).toBe(true);
    expect(a.stats?.warnings).toBeUndefined();
  });
});
