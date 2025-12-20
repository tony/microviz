import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";

describe("two-tier", () => {
  test("produces a deterministic RenderModel", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 40 },
        { color: "#22c55e", name: "B", pct: 35 },
        { color: "#3b82f6", name: "C", pct: 25 },
      ],
      size: { height: 32, width: 100 },
      spec: { pad: 0, type: "two-tier" as const },
    };

    const a = computeModel(input);
    const b = computeModel(input);

    expect(a).toEqual(b);
    // Top row: 2 rects + Bottom row: 3 rects = 5 marks
    expect(a.marks.length).toBe(5);
    expect(a.stats?.warnings).toBeUndefined();
  });

  test("has separate top and bottom rows", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 50 },
        { color: "#22c55e", name: "B", pct: 30 },
        { color: "#3b82f6", name: "C", pct: 20 },
      ],
      size: { height: 100, width: 100 },
      spec: { gap: 0, pad: 0, type: "two-tier" as const },
    };

    const model = computeModel(input);
    const rects = model.marks.filter((m) => m.type === "rect");

    expect(rects.length).toBe(5); // 2 top + 3 bottom
  });

  test("top row shows first 2 segments scaled to full width", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 40 },
        { color: "#22c55e", name: "B", pct: 40 },
        { color: "#3b82f6", name: "C", pct: 20 },
      ],
      size: { height: 100, width: 100 },
      spec: { gap: 0, pad: 0, topRatio: 0.6, type: "two-tier" as const },
    };

    const model = computeModel(input);
    const topRects = model.marks.filter(
      (m) => m.type === "rect" && m.id?.includes("top"),
    );

    expect(topRects.length).toBe(2);
    // First two segments (40+40=80) scaled to 100%: each is 50%
    const totalTopWidth = topRects.reduce(
      (sum, m) => sum + (m.type === "rect" ? m.w : 0),
      0,
    );
    expect(totalTopWidth).toBeCloseTo(100, 0);
  });

  test("bottom row shows all segments with reduced opacity", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 50 },
        { color: "#22c55e", name: "B", pct: 30 },
        { color: "#3b82f6", name: "C", pct: 20 },
      ],
      size: { height: 100, width: 100 },
      spec: { bottomOpacity: 0.5, gap: 0, pad: 0, type: "two-tier" as const },
    };

    const model = computeModel(input);
    const bottomRects = model.marks.filter(
      (m) => m.type === "rect" && m.id?.includes("bottom"),
    );

    expect(bottomRects.length).toBe(3);
    // All bottom rects should have reduced opacity
    for (const rect of bottomRects) {
      if (rect.type === "rect") {
        expect(rect.fillOpacity).toBe(0.5);
      }
    }
  });
});
