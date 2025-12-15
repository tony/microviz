import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";

describe("bullet-delta", () => {
  test("produces a deterministic RenderModel", () => {
    const input = {
      data: { current: 70, max: 100, previous: 40 },
      size: { height: 32, width: 200 },
      spec: { pad: 4, type: "bullet-delta" as const },
    };

    const a = computeModel(input);
    const b = computeModel(input);

    expect(a).toEqual(b);
    expect(a.stats?.warnings).toBeUndefined();
    expect(a.marks.map((m) => m.type)).toEqual([
      "line",
      "line",
      "circle",
      "circle",
      "path",
    ]);
    expect(a.marks.map((m) => m.id)).toEqual([
      "bullet-delta-track",
      "bullet-delta-delta",
      "bullet-delta-previous",
      "bullet-delta-current",
      "bullet-delta-arrow",
    ]);

    const track = a.marks[0];
    const delta = a.marks[1];
    const previous = a.marks[2];
    const current = a.marks[3];
    const arrow = a.marks[4];

    if (track?.type === "line") {
      expect(track.x1).toBe(4);
      expect(track.x2).toBe(196);
      expect(track.y1).toBe(16);
      expect(track.y2).toBe(16);
      expect(track.strokeWidth).toBe(5);
      expect(track.strokeOpacity).toBeCloseTo(0.18, 6);
    }
    if (delta?.type === "line") {
      expect(delta.x1).toBeCloseTo(80.8, 6);
      expect(delta.x2).toBeCloseTo(138.4, 6);
      expect(delta.strokeWidth).toBe(5);
      expect(delta.strokeOpacity).toBeCloseTo(0.7, 6);
    }
    if (previous?.type === "circle") {
      expect(previous.cx).toBeCloseTo(80.8, 6);
      expect(previous.cy).toBe(16);
      expect(previous.r).toBeCloseTo(3.4, 6);
      expect(previous.fillOpacity).toBeCloseTo(0.35, 6);
    }
    if (current?.type === "circle") {
      expect(current.cx).toBeCloseTo(138.4, 6);
      expect(current.cy).toBe(16);
      expect(current.r).toBeCloseTo(4.2, 6);
    }
    if (arrow?.type === "path") {
      const match = arrow.d.match(/^M\s+(-?\d+\.\d+)\s+(-?\d+\.\d+)\s+L\s+/);
      expect(match).not.toBeNull();
      const tipY = match ? Number(match[2]) : 16;
      expect(tipY).toBeLessThan(16);
      expect(arrow.fillOpacity).toBeCloseTo(0.75, 6);
    }
  });
});
