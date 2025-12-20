import type { RenderModel } from "@microviz/core";
import { describe, expect, it } from "vitest";
import { renderSvgString } from "./svg";

describe("renderSvgString", () => {
  it("renders a basic svg with escaped text", () => {
    const model: RenderModel = {
      a11y: { label: "My <chart> & stuff", role: "img" },
      height: 20,
      marks: [
        {
          className: "mv-text",
          fill: "oklch(0.7 0.15 150)",
          id: 't-"quote"',
          text: 'Hello & <world> "quotes"',
          type: "text",
          x: 2,
          y: 3,
        },
      ],
      width: 10,
    };

    const svg = renderSvgString(model);
    expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('width="10"');
    expect(svg).toContain('height="20"');
    expect(svg).toContain('viewBox="0 0 10 20"');
    expect(svg).toContain("<title>My &lt;chart&gt; &amp; stuff</title>");
    expect(svg).toContain(
      '<text id="t-&quot;quote&quot;" x="2" y="3" fill="oklch(0.7 0.15 150)" class="mv-text">Hello &amp; &lt;world&gt; "quotes"</text>',
    );
  });

  it("renders defs and allows overriding the title", () => {
    const model: RenderModel = {
      a11y: { label: "from-a11y", role: "img" },
      defs: [
        {
          id: "grad-1",
          stops: [
            { color: "red", offset: 0 },
            { color: "blue", offset: 1, opacity: 0.6 },
          ],
          type: "linearGradient",
          x1: 0,
          x2: 1,
          y1: 0,
          y2: 0,
        },
        {
          h: 10,
          id: "clip-1",
          type: "clipRect",
          w: 10,
          x: 0,
          y: 0,
        },
      ],
      height: 10,
      marks: [
        {
          d: "M 0 0 L 10 10",
          id: "path-1",
          stroke: "black",
          strokeWidth: 2,
          type: "path",
        },
      ],
      width: 10,
    };

    const svg = renderSvgString(model, { title: "override-title" });
    expect(svg).toContain("<title>override-title</title>");
    expect(svg).toContain('<defs><linearGradient id="grad-1"');
    expect(svg).toContain(
      '<stop offset="0%" stop-color="red" /><stop offset="100%" stop-color="blue" stop-opacity="0.6" />',
    );
    expect(svg).toContain('<clipPath id="clip-1"><rect x="0" y="0"');
  });

  it("renders clipRect defs and clip-path references", () => {
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

    const svg = renderSvgString(model);
    expect(svg).toContain('<clipPath id="clip-1"');
    expect(svg).toContain('clip-path="url(#clip-1)"');
  });

  it("renders pattern defs", () => {
    const model: RenderModel = {
      defs: [
        {
          height: 4,
          id: "pat-1",
          marks: [
            { fill: "white", h: 4, type: "rect", w: 4, x: 0, y: 0 },
            {
              d: "M 0 0 L 4 4",
              stroke: "black",
              strokeWidth: 1,
              type: "path",
            },
          ],
          patternUnits: "userSpaceOnUse",
          type: "pattern",
          width: 4,
        },
      ],
      height: 10,
      marks: [
        {
          fill: "url(#pat-1)",
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

    const svg = renderSvgString(model);
    expect(svg).toContain('<pattern id="pat-1"');
    expect(svg).toContain('patternUnits="userSpaceOnUse"');
    expect(svg).toContain('width="4"');
    expect(svg).toContain('height="4"');
    expect(svg).toContain(
      '<rect x="0" y="0" width="4" height="4" fill="white"',
    );
    expect(svg).toContain(
      '<path d="M 0 0 L 4 4" stroke="black" stroke-width="1"',
    );
  });

  it("renders circle stroke dash and linecap", () => {
    const model: RenderModel = {
      height: 10,
      marks: [
        {
          cx: 5,
          cy: 5,
          id: "c-1",
          r: 4,
          stroke: "black",
          strokeDasharray: "1 2",
          strokeDashoffset: "3",
          strokeLinecap: "round",
          strokeWidth: 2,
          type: "circle",
        },
      ],
      width: 10,
    };

    const svg = renderSvgString(model);
    expect(svg).toContain('stroke-dasharray="1 2"');
    expect(svg).toContain('stroke-dashoffset="3"');
    expect(svg).toContain('stroke-linecap="round"');
  });

  it("renders mask defs and mask references", () => {
    const model: RenderModel = {
      defs: [
        {
          id: "mask-1",
          marks: [
            {
              d: "M 0 0 L 10 0 L 10 10 L 0 10 Z",
              fill: "white",
              type: "path",
            },
          ],
          type: "mask",
        },
      ],
      height: 10,
      marks: [
        {
          fill: "red",
          h: 10,
          id: "r-1",
          mask: "mask-1",
          type: "rect",
          w: 10,
          x: 0,
          y: 0,
        },
      ],
      width: 10,
    };

    const svg = renderSvgString(model);
    expect(svg).toContain('<mask id="mask-1"');
    expect(svg).toContain('mask="url(#mask-1)"');
  });

  it("renders filter defs and filter references", () => {
    const model: RenderModel = {
      defs: [
        {
          id: "filter-1",
          primitives: [
            {
              dx: 1,
              dy: 2,
              floodColor: "black",
              floodOpacity: 0.5,
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
          fill: "red",
          filter: "filter-1",
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

    const svg = renderSvgString(model);
    expect(svg).toContain('<filter id="filter-1"');
    expect(svg).toContain("<feDropShadow");
    expect(svg).toContain('flood-color="black"');
    expect(svg).toContain('filter="url(#filter-1)"');
  });

  it("renders gaussian blur filter primitives", () => {
    const model: RenderModel = {
      defs: [
        {
          id: "filter-1",
          primitives: [{ stdDeviation: 4, type: "gaussianBlur" }],
          type: "filter",
        },
      ],
      height: 10,
      marks: [
        {
          fill: "red",
          filter: "filter-1",
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

    const svg = renderSvgString(model);
    expect(svg).toContain('<filter id="filter-1"');
    expect(svg).toContain('<feGaussianBlur stdDeviation="4" />');
    expect(svg).toContain('filter="url(#filter-1)"');
  });

  it("renders turbulence + displacementMap filter primitives", () => {
    const model: RenderModel = {
      defs: [
        {
          id: "filter-1",
          primitives: [
            {
              baseFrequency: "0.02 0.08",
              noiseType: "fractalNoise",
              numOctaves: 2,
              result: "noise",
              seed: 7,
              stitchTiles: "stitch",
              type: "turbulence",
            },
            {
              in: "SourceGraphic",
              in2: "noise",
              result: "displaced",
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
          filter: "filter-1",
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

    const svg = renderSvgString(model);
    expect(svg).toContain('<filter id="filter-1"');
    expect(svg).toContain(
      '<feTurbulence type="fractalNoise" baseFrequency="0.02 0.08" numOctaves="2" seed="7" stitchTiles="stitch" result="noise" />',
    );
    expect(svg).toContain(
      '<feDisplacementMap in="SourceGraphic" in2="noise" scale="12" xChannelSelector="R" yChannelSelector="G" result="displaced" />',
    );
    expect(svg).toContain('filter="url(#filter-1)"');
  });
});
