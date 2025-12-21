import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";

describe("segmented-pill", () => {
  test("produces a deterministic RenderModel with separator lines", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 40 },
        { color: "#22c55e", name: "B", pct: 35 },
        { color: "#3b82f6", name: "C", pct: 25 },
      ],
      size: { height: 8, width: 32 },
      spec: { pad: 0, type: "segmented-pill" as const },
    };

    const a = computeModel(input);
    const b = computeModel(input);

    expect(a).toEqual(b);
    expect(a.stats?.warnings).toBeUndefined();
    expect(a.marks.map((m) => m.id)).toEqual([
      "segmented-pill-seg-0",
      "segmented-pill-seg-0-inner",
      "segmented-pill-seg-1",
      "segmented-pill-seg-2",
      "segmented-pill-seg-2-inner",
      "segmented-pill-sep-0",
      "segmented-pill-sep-1",
    ]);
    expect(a.marks.filter((m) => m.type === "line").length).toBe(2);
  });
});
