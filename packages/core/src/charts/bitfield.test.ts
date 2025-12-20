import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";

describe("bitfield", () => {
  test("produces a deterministic RenderModel", () => {
    const input = {
      data: [
        { color: "#1d4ed8", name: "A", pct: 60 },
        { color: "#22c55e", name: "B", pct: 40 },
      ],
      size: { height: 20, width: 40 },
      spec: { cellSize: 4, dotRadius: 1.6, type: "bitfield" as const },
    };

    const a = computeModel(input);
    const b = computeModel(input);

    expect(a).toEqual(b);
    expect(a.marks.length).toBe(2);
    expect(a.defs?.length).toBe(1);
    expect(a.stats?.warnings).toBeUndefined();
    expect(a.marks.every((m) => m.type === "rect")).toBe(true);
    const first = a.marks[0];
    if (first?.type === "rect") {
      expect(first.fill).toBe("#1d4ed8");
      expect(first.mask).toBe("mv-bitfield-mask");
    }
    const def = a.defs?.[0];
    expect(def?.type).toBe("mask");
    if (def?.type === "mask") expect(def.marks.length).toBe(50);
  });
});
