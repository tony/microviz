import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";

describe("pixel-grid", () => {
  test("produces a deterministic RenderModel", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 50 },
        { color: "#22c55e", name: "B", pct: 50 },
      ],
      size: { height: 32, width: 200 },
      spec: { cols: 16, gap: 2, pad: 0, rows: 2, type: "pixel-grid" as const },
    };

    const a = computeModel(input);
    const b = computeModel(input);

    expect(a).toEqual(b);
    expect(a.marks.length).toBe(32);
    expect(a.stats?.warnings).toBeUndefined();
    expect(a.marks.every((m) => m.type === "rect")).toBe(true);

    const first = a.marks[0];
    const last = a.marks[a.marks.length - 1];
    if (first?.type === "rect") {
      expect(first.x).toBe(0);
      expect(first.y).toBe(0);
      expect(first.w).toBe(11);
      expect(first.h).toBe(15);
    }
    if (last?.type === "rect") {
      expect(last.x).toBe(189);
      expect(last.y).toBe(17);
      expect(last.w).toBe(11);
      expect(last.h).toBe(15);
    }
  });

  test("supports interleaving to surface small segments", () => {
    const base = {
      data: [
        { color: "#ef4444", name: "A", pct: 90 },
        { color: "#3b82f6", name: "B", pct: 10 },
      ],
      size: { height: 1, width: 10 },
    };

    const sequential = computeModel({
      ...base,
      spec: { cols: 10, gap: 0, pad: 0, rows: 1, type: "pixel-grid" as const },
    });
    const interleaved = computeModel({
      ...base,
      spec: {
        cols: 10,
        gap: 0,
        interleave: true,
        pad: 0,
        rows: 1,
        type: "pixel-grid" as const,
      },
    });

    const seqFills = sequential.marks.flatMap((m) =>
      m.type === "rect" ? [m.fill ?? ""] : [],
    );
    const intFills = interleaved.marks.flatMap((m) =>
      m.type === "rect" ? [m.fill ?? ""] : [],
    );

    expect(seqFills).toHaveLength(10);
    expect(intFills).toHaveLength(10);

    expect(seqFills.filter((c) => c === "#3b82f6")).toHaveLength(1);
    expect(intFills.filter((c) => c === "#3b82f6")).toHaveLength(1);

    // Without interleave, the rare segment ends up at the tail.
    expect(seqFills.at(-1)).toBe("#3b82f6");

    // With interleave, the rare segment appears earlier in the sequence.
    expect(intFills.slice(0, -1).includes("#3b82f6")).toBe(true);
    expect(intFills[5]).toBe("#3b82f6");
  });
});
