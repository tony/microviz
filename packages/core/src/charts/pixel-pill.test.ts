import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";

describe("pixel-pill", () => {
  test("produces a deterministic RenderModel", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 50 },
        { color: "#22c55e", name: "B", pct: 30 },
        { color: "#3b82f6", name: "C", pct: 20 },
      ],
      size: { height: 8, width: 32 },
      spec: { gap: 1, minPx: 1, pad: 0, type: "pixel-pill" as const },
    };

    const a = computeModel(input);
    const b = computeModel(input);

    expect(a).toEqual(b);
    expect(a.marks.every((m) => m.type === "rect")).toBe(true);
    expect(a.defs?.some((d) => d.type === "clipRect")).toBe(true);
    expect(a.stats?.warnings).toBeUndefined();
  });
});
