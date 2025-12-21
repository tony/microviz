import type { RenderModel } from "@microviz/core";
import { describe, expect, it } from "vitest";
import {
  getHtmlUnsupportedDefTypes,
  getHtmlUnsupportedMarkEffects,
  getHtmlUnsupportedMarkTypes,
  renderHtmlString,
} from "./html";

function extractBackgroundImageUrl(html: string): string {
  const entityMatch = /background-image:url\(&quot;([\s\S]+?)&quot;\)/.exec(
    html,
  );
  if (entityMatch) return entityMatch[1];
  const match = /background-image:url\(([^)]+)\)/.exec(html);
  if (!match) return "";
  return match[1].replaceAll("&quot;", "").replaceAll('"', "");
}

describe("renderHtmlString", () => {
  it("renders a container with marks", () => {
    const model: RenderModel = {
      height: 8,
      marks: [
        {
          fill: "oklch(0.7 0.15 150)",
          h: 8,
          id: "r-1",
          type: "rect",
          w: 16,
          x: 2,
          y: 1,
        },
      ],
      width: 20,
    };

    const html = renderHtmlString(model, { title: "Demo" });
    expect(html).toContain('data-mv-renderer="html"');
    expect(html).toContain('aria-label="Demo"');
    expect(html).toContain("width:20px");
    expect(html).toContain("height:8px");
    expect(html).toContain('data-mark-id="r-1"');
  });

  it("maps linearGradient fills to CSS gradients", () => {
    const model: RenderModel = {
      defs: [
        {
          id: "grad-1",
          stops: [
            { color: "red", offset: 0 },
            { color: "blue", offset: 1 },
          ],
          type: "linearGradient",
          x1: 0,
          x2: 1,
          y1: 0,
          y2: 0,
        },
      ],
      height: 10,
      marks: [
        {
          fill: "url(#grad-1)",
          h: 6,
          id: "r-1",
          type: "rect",
          w: 12,
          x: 1,
          y: 2,
        },
      ],
      width: 20,
    };

    const html = renderHtmlString(model);
    expect(html).toContain("linear-gradient");
  });

  it("wraps clipped rects in an overflow container", () => {
    const model: RenderModel = {
      defs: [
        {
          h: 6,
          id: "clip-1",
          rx: 2,
          type: "clipRect",
          w: 10,
          x: 2,
          y: 1,
        },
      ],
      height: 10,
      marks: [
        {
          clipPath: "clip-1",
          h: 8,
          id: "r-1",
          type: "rect",
          w: 12,
          x: 1,
          y: 0,
        },
      ],
      width: 20,
    };

    const html = renderHtmlString(model);
    expect(html).toContain("overflow:hidden");
    expect(html).toContain("border-radius:2px / 2px");
  });

  it("renders pattern fills as background images", () => {
    const model: RenderModel = {
      defs: [
        {
          height: 6,
          id: "pattern-1",
          marks: [
            {
              fill: "white",
              h: 6,
              type: "rect",
              w: 2,
              x: 0,
              y: 0,
            },
          ],
          type: "pattern",
          width: 6,
        },
      ],
      height: 10,
      marks: [
        {
          fill: "url(#pattern-1)",
          h: 6,
          id: "r-1",
          type: "rect",
          w: 12,
          x: 1,
          y: 2,
        },
      ],
      width: 20,
    };

    const html = renderHtmlString(model);
    expect(html).toContain("background-image:url");
    expect(html).toContain("background-repeat:repeat");
  });

  it("applies patternTransform inside pattern SVGs", () => {
    const model: RenderModel = {
      defs: [
        {
          height: 4,
          id: "pattern-rot",
          marks: [
            {
              fill: "white",
              h: 4,
              type: "rect",
              w: 2,
              x: 0,
              y: 0,
            },
          ],
          patternTransform: "rotate(45)",
          type: "pattern",
          width: 4,
        },
      ],
      height: 10,
      marks: [
        {
          fill: "url(#pattern-rot)",
          h: 6,
          id: "r-1",
          type: "rect",
          w: 12,
          x: 1,
          y: 2,
        },
      ],
      width: 20,
    };

    const html = renderHtmlString(model);
    const url = extractBackgroundImageUrl(html);
    const encodedSvg = url.split(",", 2)[1] ?? "";
    const decoded = decodeURIComponent(encodedSvg);

    expect(decoded).toContain('transform="rotate(45)"');
  });

  it("does not reuse cached pattern URLs across different defs with the same id", () => {
    const baseModel: RenderModel = {
      defs: [
        {
          height: 4,
          id: "pattern-1",
          marks: [
            {
              fill: "white",
              h: 4,
              type: "rect",
              w: 2,
              x: 0,
              y: 0,
            },
          ],
          type: "pattern",
          width: 4,
        },
      ],
      height: 10,
      marks: [
        {
          fill: "url(#pattern-1)",
          h: 6,
          id: "r-1",
          type: "rect",
          w: 12,
          x: 1,
          y: 2,
        },
      ],
      width: 20,
    };

    const html1 = renderHtmlString(baseModel);
    const url1 = extractBackgroundImageUrl(html1);

    const html2 = renderHtmlString({
      ...baseModel,
      defs: [
        {
          height: 4,
          id: "pattern-1",
          marks: [
            {
              fill: "black",
              h: 4,
              type: "rect",
              w: 2,
              x: 0,
              y: 0,
            },
          ],
          type: "pattern",
          width: 4,
        },
      ],
    });
    const url2 = extractBackgroundImageUrl(html2);

    expect(url1).not.toEqual("");
    expect(url2).not.toEqual("");
    expect(url1).not.toEqual(url2);
  });

  it("applies mask defs as CSS masks", () => {
    const model: RenderModel = {
      defs: [
        {
          height: 1,
          id: "mask-1",
          marks: [{ cx: 0.5, cy: 0.5, fill: "white", r: 0.5, type: "circle" }],
          maskContentUnits: "objectBoundingBox",
          maskUnits: "objectBoundingBox",
          type: "mask",
          width: 1,
        },
      ],
      height: 10,
      marks: [
        {
          fill: "red",
          h: 6,
          id: "r-1",
          mask: "mask-1",
          type: "rect",
          w: 12,
          x: 1,
          y: 2,
        },
      ],
      width: 20,
    };

    const html = renderHtmlString(model);
    expect(html).toContain("mask-image:url");
  });

  it("applies drop-shadow filters via CSS", () => {
    const model: RenderModel = {
      defs: [
        {
          id: "filter-1",
          primitives: [
            {
              dx: 1,
              dy: 2,
              stdDeviation: 3,
              type: "dropShadow",
            },
          ],
          type: "filter",
        },
      ],
      height: 10,
      marks: [
        {
          filter: "filter-1",
          h: 6,
          id: "r-1",
          type: "rect",
          w: 12,
          x: 1,
          y: 2,
        },
      ],
      width: 20,
    };

    const html = renderHtmlString(model);
    expect(html).toContain("drop-shadow");
  });
});

describe("HTML renderer diagnostics", () => {
  it("reports unsupported marks/defs/effects", () => {
    const model: RenderModel = {
      defs: [
        {
          h: 4,
          id: "clip-1",
          type: "clipRect",
          w: 4,
          x: 1,
          y: 1,
        },
        {
          id: "grad-1",
          stops: [
            { color: "red", offset: 0 },
            { color: "blue", offset: 1 },
          ],
          type: "linearGradient",
        },
        {
          height: 4,
          id: "pattern-1",
          marks: [
            {
              fill: "white",
              h: 2,
              type: "rect",
              w: 2,
              x: 0,
              y: 0,
            },
          ],
          type: "pattern",
          width: 4,
        },
        {
          height: 1,
          id: "mask-1",
          marks: [{ d: "M0 0 L1 1", fill: "white", type: "path" }],
          maskContentUnits: "objectBoundingBox",
          maskUnits: "objectBoundingBox",
          type: "mask",
          width: 1,
        },
        {
          id: "filter-1",
          primitives: [{ stdDeviation: 2, type: "gaussianBlur" }],
          type: "filter",
        },
      ],
      height: 10,
      marks: [
        {
          d: "M 0 0 L 10 10",
          id: "p-1",
          type: "path",
        },
        {
          clipPath: "clip-1",
          filter: "filter-1",
          h: 4,
          id: "r-1",
          mask: "mask-1",
          type: "rect",
          w: 4,
          x: 1,
          y: 1,
        },
      ],
      width: 10,
    };

    expect(getHtmlUnsupportedMarkTypes(model)).toEqual(["path"]);
    expect(getHtmlUnsupportedDefTypes(model)).toEqual([]);
    expect(getHtmlUnsupportedMarkEffects(model)).toEqual([]);
  });

  it("reports unsupported filter primitives", () => {
    const model: RenderModel = {
      defs: [
        {
          id: "filter-1",
          primitives: [{ type: "turbulence" }],
          type: "filter",
        },
      ],
      height: 10,
      marks: [
        {
          filter: "filter-1",
          h: 4,
          id: "r-1",
          type: "rect",
          w: 4,
          x: 1,
          y: 1,
        },
      ],
      width: 10,
    };

    expect(getHtmlUnsupportedDefTypes(model)).toEqual(["filter"]);
    expect(getHtmlUnsupportedMarkEffects(model)).toEqual(["filter"]);
  });

  it("still reports unsupported clipPath references", () => {
    const model: RenderModel = {
      height: 10,
      marks: [
        {
          clipPath: "missing-clip",
          h: 4,
          id: "r-1",
          type: "rect",
          w: 4,
          x: 1,
          y: 1,
        },
      ],
      width: 10,
    };

    expect(getHtmlUnsupportedMarkEffects(model)).toEqual(["clipPath"]);
  });
});
