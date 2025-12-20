import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";

describe("nano-ring", () => {
  test("produces a deterministic RenderModel", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 40 },
        { color: "#22c55e", name: "B", pct: 35 },
        { color: "#3b82f6", name: "C", pct: 25 },
      ],
      size: { height: 24, width: 24 },
      spec: { type: "nano-ring" as const },
    };

    const a = computeModel(input);
    const b = computeModel(input);

    expect(a).toEqual(b);
    expect(a.marks.length).toBe(3);
    expect(a.stats?.warnings).toBeUndefined();
  });

  test("uses smaller defaults than segmented-ring", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 50 },
        { color: "#22c55e", name: "B", pct: 50 },
      ],
      size: { height: 24, width: 24 },
      spec: { type: "nano-ring" as const },
    };

    const model = computeModel(input);
    const mark = model.marks[0];

    // Default strokeWidth should be 2 (vs segmented-ring's 3)
    if (mark?.type === "circle") {
      expect(mark.strokeWidth).toBe(2);
    }
  });

  test("creates circle marks with strokeDasharray", () => {
    const input = {
      data: [{ color: "#ef4444", name: "A", pct: 100 }],
      size: { height: 24, width: 24 },
      spec: { type: "nano-ring" as const },
    };

    const model = computeModel(input);
    const mark = model.marks[0];

    expect(mark?.type).toBe("circle");
    if (mark?.type === "circle") {
      expect(mark.fill).toBe("none");
      expect(mark.stroke).toBe("#ef4444");
      expect(mark.strokeDasharray).toBeDefined();
    }
  });

  test("handles empty data gracefully", () => {
    const input = {
      data: [],
      size: { height: 24, width: 24 },
      spec: { type: "nano-ring" as const },
    };

    const model = computeModel(input);
    expect(model.marks.length).toBe(0);
  });

  test("works in compact 16x16 viewport", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 50 },
        { color: "#22c55e", name: "B", pct: 50 },
      ],
      size: { height: 16, width: 16 },
      spec: { type: "nano-ring" as const },
    };

    const model = computeModel(input);
    expect(model.marks.length).toBe(2);
    expect(model.stats?.warnings).toBeUndefined();
  });
});
