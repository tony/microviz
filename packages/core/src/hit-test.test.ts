import { describe, expect, test } from "vitest";
import { hitTest } from "./hit-test";
import type { RenderModel } from "./model";

describe("hitTest", () => {
  test("hits rect marks", () => {
    const model: RenderModel = {
      height: 100,
      marks: [{ h: 20, id: "r", type: "rect", w: 20, x: 10, y: 10 }],
      width: 100,
    };

    expect(hitTest(model, { x: 15, y: 15 })).toEqual({
      markId: "r",
      markType: "rect",
    });
    expect(hitTest(model, { x: 5, y: 5 })).toBeNull();
  });

  test("hits circle marks", () => {
    const model: RenderModel = {
      height: 100,
      marks: [{ cx: 50, cy: 50, id: "c", r: 10, type: "circle" }],
      width: 100,
    };

    expect(hitTest(model, { x: 56, y: 56 })?.markId).toBe("c");
    expect(hitTest(model, { x: 80, y: 80 })).toBeNull();
  });

  test("hits stroked circle rings when fill is none", () => {
    const model: RenderModel = {
      height: 100,
      marks: [
        {
          cx: 50,
          cy: 50,
          fill: "none",
          id: "ring",
          r: 10,
          strokeWidth: 2,
          type: "circle",
        },
      ],
      width: 100,
    };

    expect(hitTest(model, { x: 60, y: 50 })?.markId).toBe("ring");
    expect(hitTest(model, { x: 50, y: 50 })).toBeNull();
  });

  test("hits line marks with stroke tolerance", () => {
    const model: RenderModel = {
      height: 100,
      marks: [
        {
          id: "l",
          strokeWidth: 2,
          type: "line",
          x1: 10,
          x2: 90,
          y1: 10,
          y2: 10,
        },
      ],
      width: 100,
    };

    expect(hitTest(model, { x: 50, y: 12 })?.markId).toBe("l");
    expect(hitTest(model, { x: 50, y: 20 })).toBeNull();
  });

  test("hits filled polygon path marks", () => {
    const model: RenderModel = {
      height: 100,
      marks: [
        {
          d: "M 10 10 L 30 10 30 30 10 30 Z",
          fill: "black",
          id: "p",
          type: "path",
        },
      ],
      width: 100,
    };

    expect(hitTest(model, { x: 20, y: 20 })?.markId).toBe("p");
    expect(hitTest(model, { x: 5, y: 5 })).toBeNull();
  });

  test("hits stroked polygon path marks when fill is none", () => {
    const model: RenderModel = {
      height: 100,
      marks: [
        {
          d: "M 10 10 L 30 10 30 30 10 30 Z",
          fill: "none",
          id: "ps",
          stroke: "black",
          strokeWidth: 2,
          type: "path",
        },
      ],
      width: 100,
    };

    expect(hitTest(model, { x: 10, y: 20 })?.markId).toBe("ps");
    expect(hitTest(model, { x: 1, y: 1 })).toBeNull();
  });

  test("ignores non-polygon path commands", () => {
    const model: RenderModel = {
      height: 100,
      marks: [
        {
          d: "M 0 0 C 10 10 20 20 30 30",
          fill: "black",
          id: "cubic",
          type: "path",
        },
      ],
      width: 100,
    };

    expect(hitTest(model, { x: 1, y: 1 })).toBeNull();
  });

  test("hits arc path marks when Path2D is available", () => {
    const canUseCanvasPath2D =
      typeof Path2D !== "undefined" &&
      (typeof OffscreenCanvas !== "undefined" ||
        (typeof document !== "undefined" &&
          typeof document.createElement === "function"));

    if (!canUseCanvasPath2D) return;

    const model: RenderModel = {
      height: 100,
      marks: [
        {
          d: "M 50 40 A 10 10 0 1 0 50 60 A 10 10 0 1 0 50 40 Z",
          fill: "black",
          id: "arc",
          type: "path",
        },
      ],
      width: 100,
    };

    expect(hitTest(model, { x: 50, y: 50 })?.markId).toBe("arc");
    expect(hitTest(model, { x: 10, y: 10 })).toBeNull();
  });
});
