import type { RenderModel } from "@microviz/core";
import { describe, expect, it } from "vitest";
import {
  getHtmlUnsupportedDefTypes,
  getHtmlUnsupportedMarkEffects,
  getHtmlUnsupportedMarkTypes,
  renderHtmlString,
} from "./html";

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
});

describe("HTML renderer diagnostics", () => {
  it("reports unsupported marks/defs/effects", () => {
    const model: RenderModel = {
      defs: [
        {
          id: "grad-1",
          stops: [
            { color: "red", offset: 0 },
            { color: "blue", offset: 1 },
          ],
          type: "linearGradient",
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

    expect(getHtmlUnsupportedMarkTypes(model)).toEqual(["path"]);
    expect(getHtmlUnsupportedDefTypes(model)).toEqual(["linearGradient"]);
    expect(getHtmlUnsupportedMarkEffects(model)).toEqual(["clipPath"]);
  });
});
