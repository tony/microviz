import type { RenderModel } from "@microviz/core";
import { describe, expect, it } from "vitest";
import type { Canvas2DContext } from "./canvas";
import {
  getCanvasUnsupportedFilterPrimitiveTypes,
  renderCanvas,
} from "./canvas";

type RecordedCall = {
  args: ReadonlyArray<unknown>;
  fillStyle: string | FakeCanvasGradient | FakeCanvasPattern;
  filter: string;
  fn: string;
  globalAlpha: number;
  lineCap: CanvasLineCap;
  lineJoin: CanvasLineJoin;
  lineWidth: number;
  shadowBlur: number;
  shadowColor: string;
  shadowOffsetX: number;
  shadowOffsetY: number;
  strokeStyle: string;
  textAlign: CanvasTextAlign;
  textBaseline: CanvasTextBaseline;
};

class FakeCanvasGradient {
  readonly stops: Array<{ color: string; offset: number }> = [];

  constructor(
    readonly x1: number,
    readonly y1: number,
    readonly x2: number,
    readonly y2: number,
  ) {}

  addColorStop(offset: number, color: string): void {
    this.stops.push({ color, offset });
  }
}

class FakeCanvasPattern {
  transforms: unknown[] = [];

  setTransform(transform: unknown): void {
    this.transforms.push(transform);
  }
}

class FakeCanvas2DContext {
  calls: RecordedCall[] = [];

  filter = "none";
  fillStyle: string | FakeCanvasGradient | FakeCanvasPattern = "";
  globalAlpha = 1;
  lineCap: CanvasLineCap = "butt";
  lineDashOffset = 0;
  lineJoin: CanvasLineJoin = "miter";
  lineWidth = 1;
  shadowBlur = 0;
  shadowColor = "";
  shadowOffsetX = 0;
  shadowOffsetY = 0;
  strokeStyle = "";
  textAlign: CanvasTextAlign = "start";
  textBaseline: CanvasTextBaseline = "alphabetic";

  #lineDash: number[] = [];
  #stack: Array<{
    filter: string;
    fillStyle: string | FakeCanvasGradient;
    globalAlpha: number;
    lineCap: CanvasLineCap;
    lineDash: number[];
    lineDashOffset: number;
    lineJoin: CanvasLineJoin;
    lineWidth: number;
    shadowBlur: number;
    shadowColor: string;
    shadowOffsetX: number;
    shadowOffsetY: number;
    strokeStyle: string;
    textAlign: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
  }> = [];

  getLineDash(): number[] {
    return [...this.#lineDash];
  }

  setLineDash(pattern: number[]): void {
    this.#lineDash = [...pattern];
    this.#record("setLineDash", [pattern]);
  }

  beginPath(): void {
    this.#record("beginPath", []);
  }

  arc(cx: number, cy: number, r: number, sAngle: number, eAngle: number): void {
    this.#record("arc", [cx, cy, r, sAngle, eAngle]);
  }

  clearRect(x: number, y: number, w: number, h: number): void {
    this.#record("clearRect", [x, y, w, h]);
  }

  closePath(): void {
    this.#record("closePath", []);
  }

  fill(): void {
    this.#record("fill", []);
  }

  fillRect(x: number, y: number, w: number, h: number): void {
    this.#record("fillRect", [x, y, w, h]);
  }

  stroke(): void {
    this.#record("stroke", []);
  }

  strokeRect(x: number, y: number, w: number, h: number): void {
    this.#record("strokeRect", [x, y, w, h]);
  }

  moveTo(x: number, y: number): void {
    this.#record("moveTo", [x, y]);
  }

  lineTo(x: number, y: number): void {
    this.#record("lineTo", [x, y]);
  }

  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void {
    this.#record("quadraticCurveTo", [cpx, cpy, x, y]);
  }

  fillText(text: string, x: number, y: number): void {
    this.#record("fillText", [text, x, y]);
  }

  createLinearGradient(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
  ): FakeCanvasGradient {
    this.#record("createLinearGradient", [x1, y1, x2, y2]);
    return new FakeCanvasGradient(x1, y1, x2, y2);
  }

  createPattern(_image: unknown, repetition: string): FakeCanvasPattern | null {
    this.#record("createPattern", [_image, repetition]);
    return new FakeCanvasPattern();
  }

  drawImage(image: unknown, dx: number, dy: number): void {
    this.#record("drawImage", [image, dx, dy]);
  }

  save(): void {
    this.#stack.push({
      fillStyle: this.fillStyle,
      filter: this.filter,
      globalAlpha: this.globalAlpha,
      lineCap: this.lineCap,
      lineDash: [...this.#lineDash],
      lineDashOffset: this.lineDashOffset,
      lineJoin: this.lineJoin,
      lineWidth: this.lineWidth,
      shadowBlur: this.shadowBlur,
      shadowColor: this.shadowColor,
      shadowOffsetX: this.shadowOffsetX,
      shadowOffsetY: this.shadowOffsetY,
      strokeStyle: this.strokeStyle,
      textAlign: this.textAlign,
      textBaseline: this.textBaseline,
    });
    this.#record("save", []);
  }

  restore(): void {
    const state = this.#stack.pop();
    if (!state) return;
    this.filter = state.filter;
    this.fillStyle = state.fillStyle;
    this.globalAlpha = state.globalAlpha;
    this.lineCap = state.lineCap;
    this.#lineDash = [...state.lineDash];
    this.lineDashOffset = state.lineDashOffset;
    this.lineJoin = state.lineJoin;
    this.lineWidth = state.lineWidth;
    this.shadowBlur = state.shadowBlur;
    this.shadowColor = state.shadowColor;
    this.shadowOffsetX = state.shadowOffsetX;
    this.shadowOffsetY = state.shadowOffsetY;
    this.strokeStyle = state.strokeStyle;
    this.textAlign = state.textAlign;
    this.textBaseline = state.textBaseline;
    this.#record("restore", []);
  }

  clip(...args: ReadonlyArray<unknown>): void {
    this.#record("clip", args);
  }

  transform(
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number,
  ): void {
    this.#record("transform", [a, b, c, d, e, f]);
  }

  setTransform(
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number,
  ): void {
    this.#record("setTransform", [a, b, c, d, e, f]);
  }

  #record(fn: string, args: ReadonlyArray<unknown>): void {
    this.calls.push({
      args,
      fillStyle: this.fillStyle,
      filter: this.filter,
      fn,
      globalAlpha: this.globalAlpha,
      lineCap: this.lineCap,
      lineJoin: this.lineJoin,
      lineWidth: this.lineWidth,
      shadowBlur: this.shadowBlur,
      shadowColor: this.shadowColor,
      shadowOffsetX: this.shadowOffsetX,
      shadowOffsetY: this.shadowOffsetY,
      strokeStyle: this.strokeStyle,
      textAlign: this.textAlign,
      textBaseline: this.textBaseline,
    });
  }
}

describe("renderCanvas", () => {
  it("respects per-mark paint and opacity, and restores context state", () => {
    const ctx = new FakeCanvas2DContext();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = "black";
    ctx.strokeStyle = "black";

    const model: RenderModel = {
      height: 10,
      marks: [
        {
          fill: "red",
          fillOpacity: 0.5,
          h: 2,
          id: "rect",
          opacity: 0.8,
          type: "rect",
          w: 3,
          x: 1,
          y: 1,
        },
        {
          cx: 6,
          cy: 3,
          fill: "green",
          id: "circle",
          opacity: 1,
          r: 1,
          type: "circle",
        },
        {
          id: "line",
          opacity: 0.5,
          stroke: "blue",
          strokeOpacity: 0.25,
          strokeWidth: 2,
          type: "line",
          x1: 0,
          x2: 10,
          y1: 0,
          y2: 10,
        },
        {
          anchor: "middle",
          baseline: "middle",
          fill: "purple",
          id: "text",
          opacity: 0.1,
          text: "Hi",
          type: "text",
          x: 5,
          y: 5,
        },
      ],
      width: 10,
    };

    renderCanvas(ctx as unknown as Canvas2DContext, model);

    expect(ctx.calls[0]).toMatchObject({
      args: [0, 0, 10, 10],
      fn: "clearRect",
    });

    const fillRect = ctx.calls.find((c) => c.fn === "fillRect");
    expect(fillRect?.fillStyle).toBe("red");
    expect(fillRect?.globalAlpha).toBeCloseTo(0.2, 6);

    const circleFill = ctx.calls.find(
      (c) => c.fn === "fill" && c.fillStyle === "green",
    );
    expect(circleFill).toBeDefined();

    const lineStroke = ctx.calls.find(
      (c) => c.fn === "stroke" && c.strokeStyle === "blue",
    );
    expect(lineStroke?.globalAlpha).toBeCloseTo(0.0625, 6);
    expect(lineStroke?.lineWidth).toBe(2);

    const fillText = ctx.calls.find((c) => c.fn === "fillText");
    expect(fillText?.fillStyle).toBe("purple");
    expect(fillText?.globalAlpha).toBeCloseTo(0.05, 6);
    expect(fillText?.textAlign).toBe("center");
    expect(fillText?.textBaseline).toBe("middle");

    expect(ctx.globalAlpha).toBe(0.5);
    expect(ctx.textAlign).toBe("start");
    expect(ctx.textBaseline).toBe("alphabetic");
    expect(ctx.lineWidth).toBe(1);
  });

  it("strokes circles with options.strokeStyle when strokeWidth is provided", () => {
    const ctx = new FakeCanvas2DContext();

    const model: RenderModel = {
      height: 10,
      marks: [
        {
          cx: 5,
          cy: 5,
          id: "circle",
          r: 2,
          strokeOpacity: 0.5,
          strokeWidth: 2,
          type: "circle",
        },
      ],
      width: 10,
    };

    renderCanvas(ctx as unknown as Canvas2DContext, model, {
      fillStyle: "black",
      strokeStyle: "blue",
    });

    const strokeCall = ctx.calls.find((c) => c.fn === "stroke");
    expect(strokeCall?.strokeStyle).toBe("blue");
    expect(strokeCall?.lineWidth).toBe(2);
    expect(strokeCall?.globalAlpha).toBeCloseTo(0.5, 6);
  });

  it("applies circle strokeLinecap and dash settings, and restores them", () => {
    const ctx = new FakeCanvas2DContext();

    const model: RenderModel = {
      height: 10,
      marks: [
        {
          cx: 5,
          cy: 5,
          id: "circle",
          r: 2,
          strokeDasharray: "1 2",
          strokeDashoffset: "3",
          strokeLinecap: "round",
          strokeWidth: 2,
          type: "circle",
        },
      ],
      width: 10,
    };

    renderCanvas(ctx as unknown as Canvas2DContext, model, {
      strokeStyle: "blue",
    });

    const setDash = ctx.calls.find((c) => c.fn === "setLineDash");
    expect(setDash?.args[0]).toEqual([1, 2]);

    const strokeCall = ctx.calls.find((c) => c.fn === "stroke");
    expect(strokeCall?.lineCap).toBe("round");

    expect(ctx.getLineDash()).toEqual([]);
    expect(ctx.lineDashOffset).toBe(0);
    expect(ctx.lineCap).toBe("butt");
  });

  it("renders rounded rects when rx/ry are set", () => {
    const ctx = new FakeCanvas2DContext();

    const model: RenderModel = {
      height: 10,
      marks: [
        {
          fill: "red",
          h: 10,
          id: "rounded-rect",
          rx: 2,
          ry: 2,
          type: "rect",
          w: 10,
          x: 0,
          y: 0,
        },
      ],
      width: 10,
    };

    renderCanvas(ctx as unknown as Canvas2DContext, model);

    expect(ctx.calls.some((c) => c.fn === "fillRect")).toBe(false);
    expect(ctx.calls.some((c) => c.fn === "quadraticCurveTo")).toBe(true);
    expect(ctx.calls.some((c) => c.fn === "fill")).toBe(true);
  });

  it("resolves url(#id) linear gradients from model.defs", () => {
    const ctx = new FakeCanvas2DContext();

    const model: RenderModel = {
      defs: [
        {
          id: "grad-1",
          stops: [
            {
              color: "var(--mv-series-1, currentColor)",
              offset: 0,
              opacity: 0.45,
            },
            {
              color: "var(--mv-series-1, currentColor)",
              offset: 1,
              opacity: 0,
            },
          ],
          type: "linearGradient",
          x1: 0,
          x2: 0,
          y1: 0,
          y2: 1,
        },
      ],
      height: 10,
      marks: [
        {
          fill: "url(#grad-1)",
          h: 10,
          id: "rect",
          type: "rect",
          w: 10,
          x: 0,
          y: 0,
        },
      ],
      width: 10,
    };

    renderCanvas(ctx as unknown as Canvas2DContext, model, {
      fillStyle: "red",
    });

    const create = ctx.calls.find((c) => c.fn === "createLinearGradient");
    expect(create?.args).toEqual([0, 0, 0, 10]);

    const fillRect = ctx.calls.find((c) => c.fn === "fillRect");
    expect(fillRect?.fillStyle).toBeInstanceOf(FakeCanvasGradient);
    if (fillRect?.fillStyle instanceof FakeCanvasGradient) {
      expect(fillRect.fillStyle.stops).toEqual([
        {
          color: "color-mix(in oklch, red 45%, transparent)",
          offset: 0,
        },
        { color: "transparent", offset: 1 },
      ]);
    }
  });

  it("resolves url(#id) patterns from model.defs", () => {
    class FakeOffscreenCanvas {
      #ctx = new FakeCanvas2DContext();

      constructor(
        readonly width: number,
        readonly height: number,
      ) {}

      getContext(_type: "2d"): FakeCanvas2DContext {
        return this.#ctx;
      }
    }

    const prev = (globalThis as unknown as { OffscreenCanvas?: unknown })
      .OffscreenCanvas;
    (globalThis as unknown as { OffscreenCanvas?: unknown }).OffscreenCanvas =
      FakeOffscreenCanvas;

    try {
      const ctx = new FakeCanvas2DContext();

      const model: RenderModel = {
        defs: [
          {
            height: 3,
            id: "pat-1",
            marks: [
              {
                stroke: "white",
                strokeOpacity: 0.4,
                strokeWidth: 1,
                type: "line",
                x1: 0,
                x2: 0,
                y1: 0,
                y2: 3,
              },
            ],
            patternTransform: "rotate(45)",
            patternUnits: "userSpaceOnUse",
            type: "pattern",
            width: 3,
          },
        ],
        height: 10,
        marks: [
          {
            fill: "url(#pat-1)",
            h: 10,
            id: "rect",
            type: "rect",
            w: 10,
            x: 0,
            y: 0,
          },
        ],
        width: 10,
      };

      renderCanvas(ctx as unknown as Canvas2DContext, model);

      expect(ctx.calls.some((c) => c.fn === "createPattern")).toBe(true);

      const fillRect = ctx.calls.find((c) => c.fn === "fillRect");
      expect(fillRect?.fillStyle).toBeInstanceOf(FakeCanvasPattern);

      if (fillRect?.fillStyle instanceof FakeCanvasPattern) {
        expect(fillRect.fillStyle.transforms.length).toBeGreaterThan(0);
        const t = fillRect.fillStyle.transforms[0] as {
          a?: number;
          b?: number;
          c?: number;
          d?: number;
          e?: number;
          f?: number;
        };
        expect(t.a).toBeCloseTo(Math.SQRT1_2, 6);
        expect(t.b).toBeCloseTo(Math.SQRT1_2, 6);
        expect(t.c).toBeCloseTo(-Math.SQRT1_2, 6);
        expect(t.d).toBeCloseTo(Math.SQRT1_2, 6);
        expect(t.e ?? 0).toBeCloseTo(0, 6);
        expect(t.f ?? 0).toBeCloseTo(0, 6);
      }
    } finally {
      (globalThis as unknown as { OffscreenCanvas?: unknown }).OffscreenCanvas =
        prev;
    }
  });

  it("applies clipRect clipPaths from model.defs", () => {
    const ctx = new FakeCanvas2DContext();

    const model: RenderModel = {
      defs: [{ h: 10, id: "clip-1", type: "clipRect", w: 10, x: 0, y: 0 }],
      height: 10,
      marks: [
        {
          clipPath: "clip-1",
          fill: "red",
          h: 10,
          id: "r-1",
          type: "rect",
          w: 10,
          x: 0,
          y: 0,
        },
      ],
      width: 10,
    };

    renderCanvas(ctx as unknown as Canvas2DContext, model);

    expect(ctx.calls.some((c) => c.fn === "save")).toBe(true);
    expect(ctx.calls.some((c) => c.fn === "clip")).toBe(true);
    expect(ctx.calls.some((c) => c.fn === "fillRect")).toBe(true);
    expect(ctx.calls.some((c) => c.fn === "restore")).toBe(true);
  });

  it("applies url(#id) drop-shadow filters from model.defs", () => {
    const ctx = new FakeCanvas2DContext();

    const model: RenderModel = {
      defs: [
        {
          id: "shadow-1",
          primitives: [
            {
              dx: 2,
              dy: 3,
              floodColor: "black",
              floodOpacity: 0.25,
              stdDeviation: 2,
              type: "dropShadow",
            },
          ],
          type: "filter",
        },
      ],
      height: 10,
      marks: [
        {
          fill: "red",
          filter: "shadow-1",
          h: 10,
          id: "rect",
          type: "rect",
          w: 10,
          x: 0,
          y: 0,
        },
      ],
      width: 10,
    };

    renderCanvas(ctx as unknown as Canvas2DContext, model);

    const fillRect = ctx.calls.find((c) => c.fn === "fillRect");
    expect(fillRect?.shadowOffsetX).toBe(2);
    expect(fillRect?.shadowOffsetY).toBe(3);
    expect(fillRect?.shadowBlur).toBe(4);
    expect(fillRect?.shadowColor).toBe(
      "color-mix(in oklch, black 25%, transparent)",
    );

    expect(ctx.shadowBlur).toBe(0);
    expect(ctx.shadowOffsetX).toBe(0);
    expect(ctx.shadowOffsetY).toBe(0);
  });

  it("applies url(#id) gaussian blur filters from model.defs", () => {
    const ctx = new FakeCanvas2DContext();

    const model: RenderModel = {
      defs: [
        {
          id: "blur-1",
          primitives: [{ stdDeviation: 3, type: "gaussianBlur" }],
          type: "filter",
        },
      ],
      height: 10,
      marks: [
        {
          fill: "red",
          filter: "blur-1",
          h: 10,
          id: "rect",
          type: "rect",
          w: 10,
          x: 0,
          y: 0,
        },
      ],
      width: 10,
    };

    renderCanvas(ctx as unknown as Canvas2DContext, model);

    const fillRect = ctx.calls.find((c) => c.fn === "fillRect");
    expect(fillRect?.filter).toBe("blur(3px)");
    expect(ctx.filter).toBe("none");
  });

  it("renders noise displacement filters via drawImage when OffscreenCanvas supports ImageData", () => {
    class FakeNoiseCanvas2DContext extends FakeCanvas2DContext {
      getImageData(_x: number, _y: number, w: number, h: number): ImageData {
        return {
          data: new Uint8ClampedArray(w * h * 4),
          height: h,
          width: w,
        } as unknown as ImageData;
      }

      createImageData(w: number, h: number): ImageData {
        return {
          data: new Uint8ClampedArray(w * h * 4),
          height: h,
          width: w,
        } as unknown as ImageData;
      }

      putImageData(_data: ImageData, _dx: number, _dy: number): void {}
    }

    class FakeOffscreenCanvas {
      #ctx = new FakeNoiseCanvas2DContext();

      constructor(
        readonly width: number,
        readonly height: number,
      ) {}

      getContext(_type: "2d"): FakeNoiseCanvas2DContext {
        return this.#ctx;
      }
    }

    const prev = (globalThis as unknown as { OffscreenCanvas?: unknown })
      .OffscreenCanvas;
    (globalThis as unknown as { OffscreenCanvas?: unknown }).OffscreenCanvas =
      FakeOffscreenCanvas;

    try {
      const ctx = new FakeCanvas2DContext();

      const model: RenderModel = {
        defs: [
          {
            id: "noise-1",
            primitives: [
              {
                baseFrequency: "0.02 0.08",
                noiseType: "fractalNoise",
                numOctaves: 2,
                result: "noise",
                seed: 7,
                type: "turbulence",
              },
              {
                in: "SourceGraphic",
                in2: "noise",
                scale: 12,
                type: "displacementMap",
                xChannelSelector: "R",
                yChannelSelector: "G",
              },
            ],
            type: "filter",
          },
        ],
        height: 10,
        marks: [
          {
            fill: "red",
            filter: "noise-1",
            h: 10,
            id: "rect",
            type: "rect",
            w: 10,
            x: 0,
            y: 0,
          },
        ],
        width: 10,
      };

      renderCanvas(ctx as unknown as Canvas2DContext, model);

      expect(ctx.calls.some((c) => c.fn === "drawImage")).toBe(true);
      expect(ctx.calls.some((c) => c.fn === "fillRect")).toBe(false);

      const draw = ctx.calls.find((c) => c.fn === "drawImage");
      expect(draw?.args[0]).toBeInstanceOf(FakeOffscreenCanvas);
      expect(draw?.args.slice(1)).toEqual([0, 0]);
    } finally {
      (globalThis as unknown as { OffscreenCanvas?: unknown }).OffscreenCanvas =
        prev;
    }
  });

  it("applies masks via canvas clipping when Path2D is available", () => {
    class FakePath2D {
      addPath(_path: FakePath2D): void {}
      arc(_x: number, _y: number, _r: number, _s: number, _e: number): void {}
      rect(_x: number, _y: number, _w: number, _h: number): void {}
    }

    const prev = (globalThis as unknown as { Path2D?: unknown }).Path2D;
    (globalThis as unknown as { Path2D?: unknown }).Path2D = FakePath2D;

    try {
      const ctx = new FakeCanvas2DContext();

      const model: RenderModel = {
        defs: [
          {
            height: 1,
            id: "mask-1",
            marks: [{ d: "M0 0H1V1H0Z", fill: "white", type: "path" }],
            maskContentUnits: "objectBoundingBox",
            maskUnits: "objectBoundingBox",
            type: "mask",
            width: 1,
            x: 0,
            y: 0,
          },
        ],
        height: 10,
        marks: [
          {
            fill: "red",
            h: 10,
            id: "rect",
            mask: "mask-1",
            type: "rect",
            w: 10,
            x: 0,
            y: 0,
          },
        ],
        width: 10,
      };

      renderCanvas(ctx as unknown as Canvas2DContext, model);

      expect(ctx.calls.some((c) => c.fn === "save")).toBe(true);
      expect(ctx.calls.some((c) => c.fn === "clip")).toBe(true);
      expect(ctx.calls.some((c) => c.fn === "setTransform")).toBe(true);
      expect(ctx.calls.some((c) => c.fn === "restore")).toBe(true);
    } finally {
      (globalThis as unknown as { Path2D?: unknown }).Path2D = prev;
    }
  });
});

describe("getCanvasUnsupportedFilterPrimitiveTypes", () => {
  it("treats noise displacement primitives as supported when OffscreenCanvas supports ImageData", () => {
    class FakeOffscreenCanvas {
      getContext(_type: "2d"): unknown {
        return {
          createImageData: () => ({}),
          getImageData: () => ({}),
          putImageData: () => {},
        };
      }
    }

    const prev = (globalThis as unknown as { OffscreenCanvas?: unknown })
      .OffscreenCanvas;
    (globalThis as unknown as { OffscreenCanvas?: unknown }).OffscreenCanvas =
      FakeOffscreenCanvas;

    try {
      const model: RenderModel = {
        defs: [
          {
            id: "f-1",
            primitives: [
              {
                baseFrequency: "0.02 0.08",
                noiseType: "fractalNoise",
                numOctaves: 2,
                result: "noise",
                seed: 7,
                type: "turbulence",
              },
              {
                in: "SourceGraphic",
                in2: "noise",
                scale: 8,
                type: "displacementMap",
                xChannelSelector: "R",
                yChannelSelector: "G",
              },
            ],
            type: "filter",
          },
        ],
        height: 10,
        marks: [],
        width: 10,
      };

      expect(getCanvasUnsupportedFilterPrimitiveTypes(model)).toEqual([]);
    } finally {
      (globalThis as unknown as { OffscreenCanvas?: unknown }).OffscreenCanvas =
        prev;
    }
  });

  it("returns unique, sorted unsupported primitive types", () => {
    const model: RenderModel = {
      defs: [
        {
          id: "f-1",
          primitives: [
            { stdDeviation: 1, type: "gaussianBlur" },
            {
              baseFrequency: "0.02 0.08",
              noiseType: "fractalNoise",
              type: "turbulence",
            },
            { in2: "noise", scale: 8, type: "displacementMap" },
          ],
          type: "filter",
        },
        {
          id: "f-2",
          primitives: [{ seed: 1, type: "turbulence" }],
          type: "filter",
        },
      ],
      height: 10,
      marks: [],
      width: 10,
    };

    expect(getCanvasUnsupportedFilterPrimitiveTypes(model)).toEqual([
      "displacementMap",
      "turbulence",
    ]);
  });

  it("returns an empty list when no unsupported primitives are present", () => {
    const model: RenderModel = {
      defs: [
        {
          id: "f-1",
          primitives: [
            { dx: 1, dy: 1, stdDeviation: 1, type: "dropShadow" },
            { stdDeviation: 2, type: "gaussianBlur" },
          ],
          type: "filter",
        },
      ],
      height: 10,
      marks: [],
      width: 10,
    };

    expect(getCanvasUnsupportedFilterPrimitiveTypes(model)).toEqual([]);
  });
});
