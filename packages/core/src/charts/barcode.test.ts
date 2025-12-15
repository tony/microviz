import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";

describe("barcode", () => {
  test("produces a deterministic RenderModel", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 50 },
        { color: "#22c55e", name: "B", pct: 50 },
      ],
      size: { height: 12, width: 65 },
      spec: { bins: 6, pad: 0, type: "barcode" as const },
    };

    const a = computeModel(input);
    const b = computeModel(input);

    expect(a).toEqual(b);
    expect(a.marks.length).toBe(6);
    expect(a.stats?.warnings).toBeUndefined();
    expect(a.marks.every((m) => m.type === "rect")).toBe(true);
    const first = a.marks[0];
    const second = a.marks[1];
    const last = a.marks[a.marks.length - 1];
    if (first?.type === "rect") {
      expect(first.fill).toBe("#ef4444");
      expect(first.x).toBe(0);
      expect(first.w).toBeCloseTo(10, 6);
    }
    if (second?.type === "rect") {
      expect(second.x).toBeCloseTo(11, 6);
      expect(second.w).toBeCloseTo(10, 6);
    }
    if (last?.type === "rect") expect(last.fill).toBe("#22c55e");
  });

  test("pixel-snaps bins for integer layouts", () => {
    const input = {
      data: [{ color: "#ef4444", name: "A", pct: 100 }],
      size: { height: 32, width: 200 },
      spec: { bins: 48, gap: 1, pad: 0, type: "barcode" as const },
    };

    const model = computeModel(input);

    expect(model.marks.length).toBe(48);
    expect(model.stats?.warnings).toBeUndefined();
    expect(model.marks.every((m) => m.type === "rect")).toBe(true);

    const widths: number[] = [];
    let last: { w: number; x: number } | null = null;
    for (const mark of model.marks) {
      if (mark.type !== "rect") continue;
      expect(Number.isInteger(mark.x)).toBe(true);
      expect(Number.isInteger(mark.w)).toBe(true);
      expect(Number.isInteger(mark.y)).toBe(true);
      expect(Number.isInteger(mark.h)).toBe(true);
      widths.push(mark.w);
      last = mark;
    }

    expect(widths.length).toBe(48);
    expect(widths.filter((w) => w === 4)).toHaveLength(9);
    expect(widths.filter((w) => w === 3)).toHaveLength(39);
    expect(
      widths
        .map((w, i) => (w === 4 ? i : null))
        .filter((i): i is number => i !== null),
    ).toEqual([2, 7, 13, 18, 23, 29, 34, 39, 45]);

    expect(last ? last.x + last.w : 0).toBe(200);
  });

  test("supports interleave option", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 50 },
        { color: "#22c55e", name: "B", pct: 50 },
      ],
      size: { height: 12, width: 60 },
      spec: {
        bins: 6,
        gap: 0,
        interleave: true,
        pad: 0,
        type: "barcode" as const,
      },
    };

    const model = computeModel(input);
    const fills = model.marks.map((m) => (m.type === "rect" ? m.fill : null));

    expect(fills).toEqual([
      "#ef4444",
      "#22c55e",
      "#ef4444",
      "#22c55e",
      "#ef4444",
      "#22c55e",
    ]);
  });
});
