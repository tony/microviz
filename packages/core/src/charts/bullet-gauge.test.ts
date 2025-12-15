import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";

describe("bullet-gauge", () => {
  test("produces a deterministic RenderModel", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 40 },
        { color: "#22c55e", name: "B", pct: 35 },
        { color: "#3b82f6", name: "C", pct: 25 },
      ],
      size: { height: 32, width: 100 },
      spec: { pad: 0, type: "bullet-gauge" as const },
    };

    const a = computeModel(input);
    const b = computeModel(input);

    expect(a).toEqual(b);
    // 1 track + 3 segment rects + 1 marker line = 5 marks
    expect(a.marks.length).toBe(5);
    expect(a.stats?.warnings).toBeUndefined();
  });

  test("has track, segment rects, and marker line", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 50 },
        { color: "#22c55e", name: "B", pct: 50 },
      ],
      size: { height: 100, width: 100 },
      spec: { gap: 0, pad: 0, type: "bullet-gauge" as const },
    };

    const model = computeModel(input);
    const rects = model.marks.filter((m) => m.type === "rect");
    const lines = model.marks.filter((m) => m.type === "line");

    // 1 track + 2 segment rects = 3 rects
    expect(rects.length).toBe(3);
    expect(lines.length).toBe(1);
  });

  test("marker is placed at 50% by default", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 50 },
        { color: "#22c55e", name: "B", pct: 50 },
      ],
      size: { height: 100, width: 100 },
      spec: { gap: 0, pad: 0, type: "bullet-gauge" as const },
    };

    const model = computeModel(input);
    const marker = model.marks.find((m) => m.type === "line");

    // Marker should be at 50% of width = 50px
    if (marker?.type === "line") {
      expect(marker.x1).toBeCloseTo(50, 1);
    }
  });

  test("respects custom marker position", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 50 },
        { color: "#22c55e", name: "B", pct: 50 },
      ],
      size: { height: 100, width: 100 },
      spec: {
        gap: 0,
        markerPosition: 75,
        pad: 0,
        type: "bullet-gauge" as const,
      },
    };

    const model = computeModel(input);
    const marker = model.marks.find((m) => m.type === "line");

    // Marker at 75% means it's at 75px
    if (marker?.type === "line") {
      expect(marker.x1).toBeCloseTo(75, 1);
    }
  });
});
