/**
 * TDD tests for data generator.
 */

import { describe, expect, it, test } from "vitest";
import {
  buildNamedSegments,
  generateArrayData,
  generateDataForShape,
  generateFormattedData,
} from "../../../src/cdn-playground/generators/data-generator";
import type { DataShape } from "../../../src/cdn-playground/unified-presets";

// ─────────────────────────────────────────────────────────────────────────────
// Determinism Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("determinism", () => {
  test.for([
    { length: 5, type: "series" },
    { length: 10, type: "series" },
    { count: 3, type: "segments" },
    { count: 5, type: "segments" },
    { type: "delta" },
    { type: "value" },
    { headers: ["pct", "color", "name"], rows: 3, type: "csv" },
  ] as DataShape[])("same seed produces same output for %j", (shape) => {
    const seed = "determinism-test";
    const a = generateFormattedData(shape, seed);
    const b = generateFormattedData(shape, seed);
    expect(a).toBe(b);
  });

  it("different seeds produce different outputs", () => {
    const shape: DataShape = { length: 5, type: "series" };
    const a = generateFormattedData(shape, "seed-a");
    const b = generateFormattedData(shape, "seed-b");
    expect(a).not.toBe(b);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Series Generation
// ─────────────────────────────────────────────────────────────────────────────

describe("series generation", () => {
  it("generates comma-separated values", () => {
    const shape: DataShape = { length: 5, type: "series" };
    const result = generateFormattedData(shape, "test-seed");
    const parts = result.split(", ");
    expect(parts).toHaveLength(5);
    parts.forEach((p) => {
      expect(Number.isNaN(Number(p))).toBe(false);
    });
  });

  it("returns array via generateArrayData", () => {
    const shape: DataShape = { length: 5, type: "series" };
    const result = generateArrayData(shape, "test-seed");
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(5);
    result.forEach((v) => {
      expect(typeof v).toBe("number");
    });
  });

  it("respects length parameter", () => {
    const shape3: DataShape = { length: 3, type: "series" };
    const shape10: DataShape = { length: 10, type: "series" };
    expect(generateArrayData(shape3, "seed")).toHaveLength(3);
    expect(generateArrayData(shape10, "seed")).toHaveLength(10);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Segments Generation
// ─────────────────────────────────────────────────────────────────────────────

describe("segments generation", () => {
  it("generates JSON with pct, color, name", () => {
    const shape: DataShape = { count: 3, type: "segments" };
    const result = generateFormattedData(shape, "test-seed");
    const parsed = JSON.parse(result);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(3);
    parsed.forEach((segment: Record<string, unknown>) => {
      expect(segment).toHaveProperty("pct");
      expect(segment).toHaveProperty("color");
      expect(segment).toHaveProperty("name");
      expect(typeof segment.pct).toBe("number");
      expect(typeof segment.color).toBe("string");
      expect(typeof segment.name).toBe("string");
    });
  });

  it("percentages sum to 100", () => {
    const shape: DataShape = { count: 4, type: "segments" };
    const result = generateFormattedData(shape, "test-seed");
    const parsed = JSON.parse(result) as Array<{ pct: number }>;
    const sum = parsed.reduce((acc, s) => acc + s.pct, 0);
    expect(sum).toBe(100);
  });

  it("uses consistent color palette", () => {
    const segments = buildNamedSegments("test", 3);
    expect(segments[0].color).toBe("#6366f1"); // Indigo
    expect(segments[1].color).toBe("#22c55e"); // Green
    expect(segments[2].color).toBe("#f59e0b"); // Amber
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Delta Generation
// ─────────────────────────────────────────────────────────────────────────────

describe("delta generation", () => {
  it("generates JSON with current, previous, max", () => {
    const shape: DataShape = { type: "delta" };
    const result = generateFormattedData(shape, "test-seed");
    const parsed = JSON.parse(result);
    expect(parsed).toHaveProperty("current");
    expect(parsed).toHaveProperty("previous");
    expect(parsed).toHaveProperty("max");
    expect(typeof parsed.current).toBe("number");
    expect(typeof parsed.previous).toBe("number");
    expect(typeof parsed.max).toBe("number");
  });

  it("current and previous are within max bounds", () => {
    const shape: DataShape = { type: "delta" };
    // Test multiple seeds
    for (let i = 0; i < 10; i++) {
      const result = generateFormattedData(shape, `seed-${i}`);
      const parsed = JSON.parse(result);
      expect(parsed.current).toBeLessThanOrEqual(parsed.max);
      expect(parsed.previous).toBeLessThanOrEqual(parsed.max);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Value Generation
// ─────────────────────────────────────────────────────────────────────────────

describe("value generation", () => {
  it("generates JSON with value and max", () => {
    const shape: DataShape = { type: "value" };
    const result = generateFormattedData(shape, "test-seed");
    const parsed = JSON.parse(result);
    expect(parsed).toHaveProperty("value");
    expect(parsed).toHaveProperty("max");
    expect(typeof parsed.value).toBe("number");
    expect(typeof parsed.max).toBe("number");
  });

  it("value is within max bounds", () => {
    const shape: DataShape = { type: "value" };
    for (let i = 0; i < 10; i++) {
      const result = generateFormattedData(shape, `seed-${i}`);
      const parsed = JSON.parse(result);
      expect(parsed.value).toBeLessThanOrEqual(parsed.max);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CSV Generation
// ─────────────────────────────────────────────────────────────────────────────

describe("csv generation", () => {
  it("generates CSV with headers", () => {
    const shape: DataShape = {
      headers: ["pct", "color", "name"],
      rows: 3,
      type: "csv",
    };
    const result = generateFormattedData(shape, "test-seed");
    const lines = result.split("\n");
    expect(lines[0]).toBe("pct,color,name");
    expect(lines).toHaveLength(4); // header + 3 rows
  });

  it("generates correct number of rows", () => {
    const shape: DataShape = {
      headers: ["pct", "color"],
      rows: 5,
      type: "csv",
    };
    const result = generateFormattedData(shape, "test-seed");
    const lines = result.split("\n");
    expect(lines).toHaveLength(6); // header + 5 rows
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Snapshot Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("snapshots", () => {
  test.for([
    { label: "series-5", shape: { length: 5, type: "series" } },
    { label: "series-10", shape: { length: 10, type: "series" } },
    { label: "segments-3", shape: { count: 3, type: "segments" } },
    { label: "delta", shape: { type: "delta" } },
    { label: "value", shape: { type: "value" } },
    {
      label: "csv",
      shape: { headers: ["pct", "color", "name"], rows: 3, type: "csv" },
    },
  ] as const)("$label", ({ shape }) => {
    const result = generateFormattedData(shape as DataShape, "snapshot-seed");
    expect(result).toMatchSnapshot();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// generateDataForShape - Full Object Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("generateDataForShape", () => {
  it("returns typed data for series", () => {
    const data = generateDataForShape({ length: 3, type: "series" }, "seed");
    expect(data.type).toBe("series");
    if (data.type === "series") {
      expect(Array.isArray(data.values)).toBe(true);
      expect(data.values).toHaveLength(3);
    }
  });

  it("returns typed data for segments", () => {
    const data = generateDataForShape({ count: 2, type: "segments" }, "seed");
    expect(data.type).toBe("segments");
    if (data.type === "segments") {
      expect(Array.isArray(data.segments)).toBe(true);
      expect(data.segments).toHaveLength(2);
    }
  });

  it("returns typed data for delta", () => {
    const data = generateDataForShape({ type: "delta" }, "seed");
    expect(data.type).toBe("delta");
    if (data.type === "delta") {
      expect(typeof data.current).toBe("number");
      expect(typeof data.previous).toBe("number");
      expect(typeof data.max).toBe("number");
    }
  });

  it("returns typed data for value", () => {
    const data = generateDataForShape({ type: "value" }, "seed");
    expect(data.type).toBe("value");
    if (data.type === "value") {
      expect(typeof data.value).toBe("number");
      expect(typeof data.max).toBe("number");
    }
  });

  it("returns typed data for csv", () => {
    const data = generateDataForShape(
      { headers: ["a", "b"], rows: 2, type: "csv" },
      "seed",
    );
    expect(data.type).toBe("csv");
    if (data.type === "csv") {
      expect(typeof data.content).toBe("string");
    }
  });
});
