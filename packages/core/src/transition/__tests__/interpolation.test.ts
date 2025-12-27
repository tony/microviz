import { describe, expect, test } from "vitest";
import type {
  CircleMark,
  LineMark,
  RectMark,
  RenderModel,
  TextMark,
} from "../../model";
import {
  easings,
  interpolateMark,
  interpolateModel,
  lerp,
} from "../interpolation";

describe("lerp", () => {
  test("interpolates linearly", () => {
    expect(lerp(0, 100, 0)).toBe(0);
    expect(lerp(0, 100, 0.5)).toBe(50);
    expect(lerp(0, 100, 1)).toBe(100);
  });

  test("handles negative values", () => {
    expect(lerp(-100, 100, 0.5)).toBe(0);
    expect(lerp(100, -100, 0.5)).toBe(0);
  });

  test("handles t outside [0,1]", () => {
    expect(lerp(0, 100, -0.5)).toBe(-50);
    expect(lerp(0, 100, 1.5)).toBe(150);
  });
});

describe("easings", () => {
  test("linear passes through unchanged", () => {
    expect(easings.linear(0)).toBe(0);
    expect(easings.linear(0.5)).toBe(0.5);
    expect(easings.linear(1)).toBe(1);
  });

  test("easeOut starts fast, ends slow", () => {
    expect(easings.easeOut(0)).toBe(0);
    expect(easings.easeOut(1)).toBe(1);
    // At midpoint, easeOut should be > 0.5 (deceleration curve)
    expect(easings.easeOut(0.5)).toBeGreaterThan(0.5);
  });

  test("easeInOut is symmetric around 0.5", () => {
    expect(easings.easeInOut(0)).toBe(0);
    expect(easings.easeInOut(1)).toBe(1);
    expect(easings.easeInOut(0.5)).toBe(0.5);
    // Before midpoint, should accelerate (< linear)
    expect(easings.easeInOut(0.25)).toBeLessThan(0.25);
    // After midpoint, should decelerate (> linear)
    expect(easings.easeInOut(0.75)).toBeGreaterThan(0.75);
  });

  test("all easings are bounded [0,1] → [0,1]", () => {
    for (const [_name, fn] of Object.entries(easings)) {
      expect(fn(0)).toBe(0);
      expect(fn(1)).toBe(1);
      // Check midpoint is within bounds
      const mid = fn(0.5);
      expect(mid).toBeGreaterThanOrEqual(0);
      expect(mid).toBeLessThanOrEqual(1);
    }
  });
});

describe("interpolateMark", () => {
  test("interpolates RectMark", () => {
    const from: RectMark = { h: 50, id: "r1", type: "rect", w: 10, x: 0, y: 0 };
    const to: RectMark = {
      h: 100,
      id: "r1",
      type: "rect",
      w: 20,
      x: 10,
      y: 20,
    };

    const mid = interpolateMark(from, to, 0.5) as RectMark;
    expect(mid.type).toBe("rect");
    expect(mid.id).toBe("r1");
    expect(mid.x).toBe(5);
    expect(mid.y).toBe(10);
    expect(mid.w).toBe(15);
    expect(mid.h).toBe(75);
  });

  test("interpolates CircleMark", () => {
    const from: CircleMark = { cx: 0, cy: 0, id: "c1", r: 10, type: "circle" };
    const to: CircleMark = {
      cx: 100,
      cy: 100,
      id: "c1",
      r: 50,
      type: "circle",
    };

    const mid = interpolateMark(from, to, 0.5) as CircleMark;
    expect(mid.type).toBe("circle");
    expect(mid.cx).toBe(50);
    expect(mid.cy).toBe(50);
    expect(mid.r).toBe(30);
  });

  test("interpolates LineMark", () => {
    const from: LineMark = {
      id: "l1",
      type: "line",
      x1: 0,
      x2: 10,
      y1: 0,
      y2: 10,
    };
    const to: LineMark = {
      id: "l1",
      type: "line",
      x1: 100,
      x2: 200,
      y1: 100,
      y2: 200,
    };

    const mid = interpolateMark(from, to, 0.5) as LineMark;
    expect(mid.type).toBe("line");
    expect(mid.x1).toBe(50);
    expect(mid.y1).toBe(50);
    expect(mid.x2).toBe(105);
    expect(mid.y2).toBe(105);
  });

  test("interpolates TextMark position (text snaps)", () => {
    const from: TextMark = {
      id: "t1",
      text: "Hello",
      type: "text",
      x: 0,
      y: 0,
    };
    const to: TextMark = {
      id: "t1",
      text: "World",
      type: "text",
      x: 100,
      y: 100,
    };

    const mid = interpolateMark(from, to, 0.5) as TextMark;
    expect(mid.x).toBe(50);
    expect(mid.y).toBe(50);
    // Text should remain "Hello" at t=0.5
    expect(mid.text).toBe("Hello");

    // Text snaps at t=1
    const end = interpolateMark(from, to, 1) as TextMark;
    expect(end.text).toBe("World");
  });

  test("preserves ID on interpolated marks", () => {
    const from: RectMark = {
      h: 10,
      id: "unique-id",
      type: "rect",
      w: 10,
      x: 0,
      y: 0,
    };
    const to: RectMark = {
      h: 50,
      id: "unique-id",
      type: "rect",
      w: 50,
      x: 100,
      y: 100,
    };

    const mid = interpolateMark(from, to, 0.5);
    expect(mid.id).toBe("unique-id");
  });

  test("snaps to target on type mismatch", () => {
    const from: RectMark = { h: 10, id: "m1", type: "rect", w: 10, x: 0, y: 0 };
    const to: CircleMark = { cx: 50, cy: 50, id: "m1", r: 25, type: "circle" };

    const result = interpolateMark(from, to, 0.5);
    expect(result).toBe(to);
  });

  test("interpolates opacity values", () => {
    const from: RectMark = {
      h: 10,
      id: "r1",
      opacity: 0,
      type: "rect",
      w: 10,
      x: 0,
      y: 0,
    };
    const to: RectMark = {
      h: 10,
      id: "r1",
      opacity: 1,
      type: "rect",
      w: 10,
      x: 0,
      y: 0,
    };

    const mid = interpolateMark(from, to, 0.5) as RectMark;
    expect(mid.opacity).toBe(0.5);
  });
});

describe("interpolateModel", () => {
  const createModel = (marks: RenderModel["marks"]): RenderModel => ({
    height: 100,
    marks,
    stats: { hasDefs: false, markCount: marks.length, textCount: 0 },
    width: 200,
  });

  test("interpolates matching marks by ID", () => {
    const from = createModel([
      { h: 50, id: "bar-1", type: "rect", w: 10, x: 0, y: 0 },
      { h: 30, id: "bar-2", type: "rect", w: 10, x: 20, y: 0 },
    ]);
    const to = createModel([
      { h: 100, id: "bar-1", type: "rect", w: 10, x: 0, y: 0 },
      { h: 80, id: "bar-2", type: "rect", w: 10, x: 20, y: 0 },
    ]);

    const mid = interpolateModel(from, to, 0.5);
    expect((mid.marks[0] as RectMark).h).toBe(75);
    expect((mid.marks[1] as RectMark).h).toBe(55);
  });

  test("interpolates viewport dimensions", () => {
    const from = createModel([]);
    const to: RenderModel = { ...from, height: 200, width: 400 };

    const mid = interpolateModel(from, to, 0.5);
    expect(mid.width).toBe(300);
    expect(mid.height).toBe(150);
  });

  test("new marks appear immediately", () => {
    const from = createModel([
      { h: 50, id: "bar-1", type: "rect", w: 10, x: 0, y: 0 },
    ]);
    const to = createModel([
      { h: 100, id: "bar-1", type: "rect", w: 10, x: 0, y: 0 },
      { h: 80, id: "bar-2", type: "rect", w: 10, x: 20, y: 0 },
    ]);

    const mid = interpolateModel(from, to, 0.5);
    expect(mid.marks.length).toBe(2);
    // New mark should appear with target values
    expect((mid.marks[1] as RectMark).h).toBe(80);
  });

  test("preserves other model properties", () => {
    const from: RenderModel = {
      a11y: { label: "Chart", role: "img" },
      defs: [{ id: "g1", stops: [], type: "linearGradient" }],
      height: 100,
      marks: [],
      stats: { hasDefs: true, markCount: 0, textCount: 0 },
      width: 200,
    };
    const to: RenderModel = {
      ...from,
      a11y: { label: "Updated Chart", role: "img" },
    };

    const mid = interpolateModel(from, to, 0.5);
    // Should use target's properties
    expect(mid.a11y?.label).toBe("Updated Chart");
    expect(mid.defs).toEqual(to.defs);
  });
});
