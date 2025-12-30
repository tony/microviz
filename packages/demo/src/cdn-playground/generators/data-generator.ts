/**
 * Seeded random data generation for unified presets.
 * Reuses the RNG from browse/seed.ts for consistency.
 */

import { buildSegments, buildSeries, createSeededRng } from "../../browse/seed";
import type { DataShape } from "../unified-presets";

// ─────────────────────────────────────────────────────────────────────────────
// Segment Colors & Names
// ─────────────────────────────────────────────────────────────────────────────

const SEGMENT_COLORS = [
  "#6366f1", // Indigo
  "#22c55e", // Green
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#8b5cf6", // Purple
  "#14b8a6", // Teal
];

const SEGMENT_NAMES = [
  "Desktop",
  "Mobile",
  "Tablet",
  "Other",
  "Unknown",
  "Legacy",
];

// ─────────────────────────────────────────────────────────────────────────────
// Named Segments Builder
// ─────────────────────────────────────────────────────────────────────────────

export type NamedSegment = {
  pct: number;
  color: string;
  name: string;
};

export function buildNamedSegments(
  seed: string,
  count: number,
): NamedSegment[] {
  const segments = buildSegments(seed, count);
  return segments.map((segment, i) => ({
    color: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
    name: SEGMENT_NAMES[i % SEGMENT_NAMES.length],
    pct: segment.pct,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Data Generation by Shape
// ─────────────────────────────────────────────────────────────────────────────

export type GeneratedData =
  | { type: "series"; values: number[]; formatted: string }
  | { type: "segments"; segments: NamedSegment[]; formatted: string }
  | {
      type: "delta";
      current: number;
      previous: number;
      max: number;
      formatted: string;
    }
  | { type: "value"; value: number; max: number; formatted: string }
  | { type: "csv"; content: string; formatted: string };

/**
 * Generates data for a given shape with a deterministic seed.
 * Returns both raw values and formatted string for attributes.
 */
export function generateDataForShape(
  shape: DataShape,
  seed: string,
): GeneratedData {
  const rng = createSeededRng(seed);

  switch (shape.type) {
    case "series": {
      const values = buildSeries(seed, shape.length, "random-walk").map((v) =>
        Math.round(v),
      );
      return {
        formatted: values.join(", "),
        type: "series",
        values,
      };
    }

    case "segments": {
      const segments = buildNamedSegments(seed, shape.count);
      return {
        formatted: JSON.stringify(segments),
        segments,
        type: "segments",
      };
    }

    case "delta": {
      const max = rng.int(12, 40);
      const currentMin = Math.max(1, Math.floor(max * 0.4));
      const current = rng.int(currentMin, max);
      const previous = rng.int(1, max);
      return {
        current,
        formatted: JSON.stringify({ current, max, previous }),
        max,
        previous,
        type: "delta",
      };
    }

    case "value": {
      const max = rng.int(10, 40);
      const value = rng.int(1, max);
      return {
        formatted: JSON.stringify({ max, value }),
        max,
        type: "value",
        value,
      };
    }

    case "csv": {
      const { headers, rows } = shape;
      const segments = buildNamedSegments(seed, rows);
      const lines = [headers.join(",")];

      for (let i = 0; i < rows; i++) {
        const segment = segments[i];
        const row = headers.map((h) => {
          if (h === "pct") return String(segment?.pct ?? 0);
          if (h === "color") return segment?.color ?? "#000";
          if (h === "name") return segment?.name ?? `Item ${i + 1}`;
          return String(rng.int(0, 100));
        });
        lines.push(row.join(","));
      }

      const content = lines.join("\n");
      return {
        content,
        formatted: content,
        type: "csv",
      };
    }
  }
}

/**
 * Generates a formatted data string for a chart's data attribute.
 * This is the simple API for code generators.
 */
export function generateFormattedData(shape: DataShape, seed: string): string {
  return generateDataForShape(shape, seed).formatted;
}

/**
 * Generates an array of values (for React props that take arrays).
 */
export function generateArrayData(shape: DataShape, seed: string): number[] {
  const data = generateDataForShape(shape, seed);
  if (data.type === "series") return data.values;
  if (data.type === "segments") return data.segments.map((s) => s.pct);
  return [];
}
