import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";

const SEGMENTS = [
  { color: "#2563eb", name: "A", pct: 38 },
  { color: "#16a34a", name: "B", pct: 22 },
  { color: "#f59e0b", name: "C", pct: 14 },
  { color: "#ef4444", name: "D", pct: 10 },
  { color: "#a855f7", name: "E", pct: 16 },
] as const;

const SERIES = [6, 10, 7, 12, 9, 14, 11, 13, 8, 15, 12, 16] as const;

describe("mini chart footprints", () => {
  test("computeModel supports common 32px/8px micro presets without warnings", () => {
    const cases = [
      // Mini-Charts
      {
        input: {
          data: SEGMENTS,
          size: { height: 32, width: 32 },
          spec: { type: "code-minimap" as const },
        },
        name: "code-minimap 32×32",
      },
      {
        input: {
          data: SEGMENTS,
          size: { height: 8, width: 32 },
          spec: {
            bins: 32,
            gap: 0,
            interleave: true,
            pad: 0,
            type: "barcode" as const,
          },
        },
        name: "barcode-strip 32×8",
      },
      {
        input: {
          data: SEGMENTS,
          size: { height: 32, width: 32 },
          spec: {
            barWidth: 4,
            bins: 6,
            gap: 1,
            pad: 1,
            type: "equalizer" as const,
          },
        },
        name: "equalizer 32×32",
      },
      {
        input: {
          data: SERIES,
          size: { height: 32, width: 32 },
          spec: {
            barRadius: 1,
            colors: SEGMENTS.map((s) => s.color),
            gap: 1,
            pad: 0,
            type: "sparkline-bars" as const,
          },
        },
        name: "sparkline-bars 32×32",
      },

      // Bars
      {
        input: {
          data: SEGMENTS,
          size: { height: 8, width: 32 },
          spec: { pad: 0, type: "stacked-bar" as const },
        },
        name: "stacked-bar 32×8",
      },
      {
        input: {
          data: SEGMENTS,
          size: { height: 8, width: 32 },
          spec: { gap: 1, pad: 0, type: "segmented-bar" as const },
        },
        name: "bar+gaps (segmented-bar) 32×8",
      },
      {
        input: {
          data: SEGMENTS,
          size: { height: 8, width: 32 },
          spec: { gap: 2, pad: 0, type: "progress-pills" as const },
        },
        name: "progress-pills 32×8",
      },
      {
        input: {
          data: SEGMENTS,
          size: { height: 8, width: 32 },
          spec: { pad: 0, type: "segmented-pill" as const },
        },
        name: "segmented-pill 32×8",
      },
      {
        input: {
          data: SEGMENTS,
          size: { height: 8, width: 32 },
          spec: { gap: 1, minPx: 1, pad: 0, type: "pixel-pill" as const },
        },
        name: "pixel-pill 32×8",
      },
      {
        input: {
          data: SEGMENTS,
          size: { height: 16, width: 32 },
          spec: {
            gap: 0.5,
            pad: 0,
            pillHeight: 4,
            type: "progress-pills" as const,
          },
        },
        name: "curved-bar (progress-pills) 32×16",
      },
      {
        input: {
          data: SEGMENTS,
          size: { height: 12, width: 32 },
          spec: {
            maxChips: 4,
            overlap: 4,
            pad: 0,
            type: "stacked-chips" as const,
          },
        },
        name: "stacked-chips 32×12",
      },
      {
        input: {
          data: SEGMENTS,
          size: { height: 8, width: 32 },
          spec: { pad: 0, type: "pattern-tiles" as const },
        },
        name: "pattern-tiles 32×8",
      },
      {
        input: {
          data: SEGMENTS,
          size: { height: 32, width: 8 },
          spec: { pad: 0, type: "vertical-stack" as const },
        },
        name: "vertical-stack 8×32",
      },
      {
        input: {
          data: SEGMENTS,
          size: { height: 32, width: 8 },
          spec: { gap: 1, minPx: 1, pad: 0, type: "pixel-column" as const },
        },
        name: "pixel-column 8×32",
      },

      // Circular
      {
        input: {
          data: SEGMENTS,
          size: { height: 32, width: 32 },
          spec: { innerRadius: 0.45, pad: 0, type: "donut" as const },
        },
        name: "donut 32×32",
      },
      {
        input: {
          data: SEGMENTS,
          size: { height: 32, width: 32 },
          spec: { pad: 0, type: "segmented-ring" as const },
        },
        name: "segmented-ring 32×32",
      },
      {
        input: {
          data: SEGMENTS,
          size: { height: 32, width: 32 },
          spec: {
            ringGap: 1,
            rings: 4,
            strokeWidth: 2.5,
            type: "concentric-arcs" as const,
          },
        },
        name: "concentric-arcs 32×32",
      },
      {
        input: {
          data: SEGMENTS,
          size: { height: 32, width: 32 },
          spec: {
            maxLength: 12,
            minLength: 3,
            pad: 0,
            strokeWidth: 2.5,
            type: "radial-bars" as const,
          },
        },
        name: "radial-bars 32×32",
      },

      // Odd
      {
        input: {
          data: SEGMENTS,
          size: { height: 8, width: 32 },
          spec: { maxShapes: 4, pad: 0, type: "shape-row" as const },
        },
        name: "shape-row 32×8",
      },
      {
        input: {
          data: SEGMENTS,
          size: { height: 4, width: 32 },
          spec: { dots: 8, gap: 0, pad: 0, type: "dot-row" as const },
        },
        name: "dot-row 32×4",
      },
    ] as const;

    for (const { input, name } of cases) {
      const a = computeModel(input);
      const b = computeModel(input);

      expect(a, `${name}: deterministic`).toEqual(b);
      expect(a.stats?.warnings, `${name}: warnings`).toBeUndefined();
      expect(a.width, `${name}: width`).toBe(input.size.width);
      expect(a.height, `${name}: height`).toBe(input.size.height);
      expect(a.marks.length, `${name}: marks`).toBeGreaterThan(0);
    }
  });
});
