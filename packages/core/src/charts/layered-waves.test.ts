import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";

describe("layered-waves", () => {
  test("produces a deterministic RenderModel", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 40 },
        { color: "#22c55e", name: "B", pct: 35 },
        { color: "#3b82f6", name: "C", pct: 25 },
      ],
      size: { height: 32, width: 100 },
      spec: { pad: 0, type: "layered-waves" as const },
    };

    const a = computeModel(input);
    const b = computeModel(input);

    expect(a).toEqual(b);
    // 3 segments = 3 wave layers
    expect(a.marks.length).toBe(3);
    expect(a.stats?.warnings).toBeUndefined();
  });

  test("creates overlapping rectangles with increasing opacity", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 50 },
        { color: "#22c55e", name: "B", pct: 50 },
      ],
      size: { height: 32, width: 100 },
      spec: { baseOpacity: 0.5, pad: 0, type: "layered-waves" as const },
    };

    const model = computeModel(input);
    const rects = model.marks.filter((m) => m.type === "rect");

    expect(rects.length).toBe(2);

    // First wave (back) should have lower opacity than second (front)
    const first = rects[0];
    const second = rects[1];

    if (first?.type === "rect" && second?.type === "rect") {
      expect(first.fillOpacity).toBe(0.5);
      expect(second.fillOpacity).toBe(1);
    }
  });

  test("waves offset progressively from left", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 50 },
        { color: "#22c55e", name: "B", pct: 50 },
      ],
      size: { height: 32, width: 100 },
      spec: { pad: 0, type: "layered-waves" as const, waveOffset: 20 },
    };

    const model = computeModel(input);
    const rects = model.marks.filter((m) => m.type === "rect");

    if (rects[0]?.type === "rect" && rects[1]?.type === "rect") {
      // First wave starts at 0, second at offset
      expect(rects[0].x).toBe(0);
      expect(rects[1].x).toBe(20);
      // First wave is full width, second is smaller
      expect(rects[0].w).toBe(100);
      expect(rects[1].w).toBe(80);
    }
  });

  test("applies corner radius to waves", () => {
    const input = {
      data: [{ color: "#ef4444", name: "A", pct: 100 }],
      size: { height: 32, width: 100 },
      spec: { cornerRadius: 12, pad: 0, type: "layered-waves" as const },
    };

    const model = computeModel(input);
    const rect = model.marks[0];

    if (rect?.type === "rect") {
      expect(rect.rx).toBe(12);
      expect(rect.ry).toBe(12);
    }
  });

  test("handles empty data gracefully", () => {
    const input = {
      data: [],
      size: { height: 32, width: 100 },
      spec: { type: "layered-waves" as const },
    };

    const model = computeModel(input);
    expect(model.marks.length).toBe(0);
  });
});
