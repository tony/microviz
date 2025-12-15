import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";

describe("histogram", () => {
  test("produces a deterministic RenderModel", () => {
    const input = {
      data: {
        opacities: [1, 0.5, 1, 1, 0.35, 1],
        series: [22, 28, 40, 36, 52, 48],
      },
      size: { height: 32, width: 200 },
      spec: { bins: 18, pad: 3, type: "histogram" as const },
    };

    const a = computeModel(input);
    const b = computeModel(input);

    expect(a).toEqual(b);
    expect(a.marks.length).toBeGreaterThan(0);
    expect(a.stats?.warnings).toBeUndefined();
    expect(a.marks.every((m) => m.type === "rect")).toBe(true);
  });

  test("supports gradient fill via linearGradient defs", () => {
    const input = {
      data: { series: [22, 28, 40, 36, 52, 48] },
      size: { height: 32, width: 200 },
      spec: { gradient: true, type: "histogram" as const },
    };

    const model = computeModel(input);
    expect(model.defs).toEqual([
      {
        id: "mv-histogram-gradient",
        stops: [
          { color: "var(--mv-series-1, currentColor)", offset: 0, opacity: 1 },
          {
            color: "var(--mv-series-1, currentColor)",
            offset: 1,
            opacity: 0.35,
          },
        ],
        type: "linearGradient",
        x1: 0,
        x2: 0,
        y1: 1,
        y2: 0,
      },
    ]);

    expect(model.marks.every((m) => m.type === "rect")).toBe(true);
    const allRectsUseGradient = model.marks.every(
      (m) => m.type !== "rect" || m.fill === "url(#mv-histogram-gradient)",
    );
    expect(allRectsUseGradient).toBe(true);
  });

  test("supports explicit gap layout", () => {
    const input = {
      data: { series: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100] },
      size: { height: 20, width: 100 },
      spec: { bins: 10, gap: 4, pad: 0, type: "histogram" as const },
    };

    const model = computeModel(input);
    const rects = model.marks.filter((m) => m.type === "rect");
    expect(rects.length).toBe(10);
    expect(rects[0]?.x).toBeCloseTo(0, 5);
    expect(rects[1]?.x).toBeCloseTo(10.4, 5);
  });
});
