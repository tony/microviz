import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";

describe("concentric-arcs-horiz", () => {
  test("produces a deterministic RenderModel", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 80 },
        { color: "#22c55e", name: "B", pct: 60 },
        { color: "#3b82f6", name: "C", pct: 40 },
        { color: "#f59e0b", name: "D", pct: 20 },
      ],
      size: { height: 32, width: 200 },
      spec: { type: "concentric-arcs-horiz" as const },
    };

    const a = computeModel(input);
    const b = computeModel(input);

    expect(a).toEqual(b);
    expect(a.marks.length).toBe(4);
    expect(a.stats?.warnings).toBeUndefined();
  });

  test("creates stroked open path marks", () => {
    const model = computeModel({
      data: [{ color: "#ef4444", name: "A", pct: 50 }],
      size: { height: 32, width: 200 },
      spec: { strokeWidth: 4, type: "concentric-arcs-horiz" as const },
    });

    expect(model.marks.length).toBe(1);
    const mark = model.marks[0];
    expect(mark?.type).toBe("path");

    if (mark?.type === "path") {
      expect(mark.fill).toBe("none");
      expect(mark.stroke).toBe("#ef4444");
      expect(mark.strokeWidth).toBe(4);
      expect(mark.strokeLinecap).toBe("butt");
      expect(mark.d).toContain("Q");
    }
  });

  test("respects maxArcs", () => {
    const model = computeModel({
      data: [
        { color: "#ef4444", name: "A", pct: 30 },
        { color: "#22c55e", name: "B", pct: 25 },
        { color: "#3b82f6", name: "C", pct: 20 },
        { color: "#f59e0b", name: "D", pct: 15 },
        { color: "#a855f7", name: "E", pct: 10 },
      ],
      size: { height: 32, width: 200 },
      spec: { maxArcs: 3, type: "concentric-arcs-horiz" as const },
    });

    expect(model.marks.length).toBe(3);
  });
});
