import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";

describe("orbital-dots", () => {
  test("produces a deterministic RenderModel", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 40 },
        { color: "#22c55e", name: "B", pct: 30 },
        { color: "#3b82f6", name: "C", pct: 30 },
      ],
      size: { height: 32, width: 32 },
      spec: {
        maxDotRadius: 6,
        minDotRadius: 2,
        pad: 0,
        radius: 10,
        ringStrokeWidth: 1,
        type: "orbital-dots" as const,
      },
    };

    const a = computeModel(input);
    const b = computeModel(input);

    expect(a).toEqual(b);
    expect(a.marks).toHaveLength(4);
    expect(a.stats?.warnings).toBeUndefined();

    const ring = a.marks[0];
    if (ring?.type === "circle") {
      expect(ring.fill).toBe("none");
      expect(ring.stroke).toBe("currentColor");
      expect(ring.r).toBe(10);
    } else {
      expect(ring?.type).toBe("circle");
    }
  });
});
