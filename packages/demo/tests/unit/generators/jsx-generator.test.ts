/**
 * TDD tests for JSX generator.
 */

import { describe, expect, it, test } from "vitest";
import { generateJsx } from "../../../src/cdn-playground/generators/jsx-generator";
import type { GeneratorContext } from "../../../src/cdn-playground/generators/types";
import {
  UNIFIED_PRESETS,
  type UnifiedPreset,
} from "../../../src/cdn-playground/unified-presets";

// ─────────────────────────────────────────────────────────────────────────────
// Test Fixtures
// ─────────────────────────────────────────────────────────────────────────────

const defaultContext: GeneratorContext = {
  cdnSource: { type: "jsdelivr" },
  cdnUrl: "https://cdn.jsdelivr.net/npm/@microviz/elements/cdn/microviz.js",
  seed: "test-seed",
  theme: "light",
};

/** Get preset by ID with proper type narrowing (avoids non-null assertion) */
function getPreset(id: string): UnifiedPreset {
  const preset = UNIFIED_PRESETS.find((p) => p.id === id);
  if (!preset) {
    throw new Error(`Preset "${id}" not found in UNIFIED_PRESETS`);
  }
  return preset;
}

// ─────────────────────────────────────────────────────────────────────────────
// Basic Output Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("generateJsx - basic output", () => {
  it("returns GeneratedCode with correct language", () => {
    const result = generateJsx(getPreset("sparkline"), defaultContext);

    expect(result).toHaveProperty("display");
    expect(result).toHaveProperty("copyable");
    expect(result).toHaveProperty("language");
    expect(result.language).toBe("tsx");
  });

  it("display does not contain imports", () => {
    const result = generateJsx(getPreset("sparkline"), defaultContext);

    expect(result.display).not.toContain("import");
    expect(result.display).not.toContain("@microviz/react");
  });

  it("copyable contains imports", () => {
    const result = generateJsx(getPreset("sparkline"), defaultContext);

    expect(result.copyable).toContain("import {");
    expect(result.copyable).toContain("@microviz/react");
  });

  it("copyable contains export function", () => {
    const result = generateJsx(getPreset("sparkline"), defaultContext);

    expect(result.copyable).toContain("export function Chart()");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Component Mapping Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("generateJsx - component mapping", () => {
  it("maps sparkline to Sparkline component", () => {
    const result = generateJsx(getPreset("sparkline"), defaultContext);

    expect(result.display).toContain("<Sparkline");
    expect(result.copyable).toContain("Sparkline");
  });

  it("maps bar-chart to Bar component", () => {
    const result = generateJsx(getPreset("bar-chart"), defaultContext);

    expect(result.display).toContain("<Bar");
    expect(result.copyable).toContain("Bar");
  });

  it("maps donut to MicrovizChart component", () => {
    const result = generateJsx(getPreset("donut"), defaultContext);

    expect(result.display).toContain("<MicrovizChart");
    expect(result.copyable).toContain("MicrovizChart");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Props Generation Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("generateJsx - props", () => {
  it("includes data prop with array", () => {
    const result = generateJsx(getPreset("sparkline"), defaultContext);

    expect(result.display).toMatch(/data=\{\[[\d, ]+\]\}/);
  });

  it("includes width and height props for simple components", () => {
    const result = generateJsx(getPreset("sparkline"), defaultContext);

    expect(result.display).toContain("width={");
    expect(result.display).toContain("height={");
  });

  it("includes input prop for MicrovizChart", () => {
    const result = generateJsx(getPreset("donut"), defaultContext);

    expect(result.display).toContain("input={{");
    expect(result.display).toContain("data:");
    expect(result.display).toContain("spec:");
    expect(result.display).toContain("size:");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Layout Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("generateJsx - layouts", () => {
  it("single layout returns bare component", () => {
    const result = generateJsx(getPreset("sparkline"), defaultContext);

    // Should not have grid wrapper
    expect(result.display).not.toContain("gridTemplateColumns");
    expect(result.display).toMatch(/^<Sparkline/);
  });

  it("grid layout wraps in div with grid style", () => {
    const result = generateJsx(getPreset("multiple-charts"), defaultContext);

    expect(result.display).toContain('display: "grid"');
    expect(result.display).toContain("gridTemplateColumns");
  });

  it("cards layout includes labels when present", () => {
    const result = generateJsx(getPreset("multiple-charts"), defaultContext);

    // Should include card labels
    expect(result.display).toContain("<h2>Revenue Trend</h2>");
    expect(result.display).toContain("<h2>Sales by Region</h2>");
    expect(result.display).toContain("<h2>Traffic Sources</h2>");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Determinism Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("generateJsx - determinism", () => {
  it("same seed produces same output", () => {
    const preset = getPreset("sparkline");
    const a = generateJsx(preset, defaultContext);
    const b = generateJsx(preset, defaultContext);

    expect(a.display).toBe(b.display);
    expect(a.copyable).toBe(b.copyable);
  });

  it("different seeds produce different data", () => {
    const preset = getPreset("sparkline");
    const a = generateJsx(preset, { ...defaultContext, seed: "seed-a" });
    const b = generateJsx(preset, { ...defaultContext, seed: "seed-b" });

    expect(a.display).not.toBe(b.display);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Interactive Preset Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("generateJsx - interactive", () => {
  it("includes event handler for interactive presets", () => {
    const result = generateJsx(getPreset("interactive"), defaultContext);

    expect(result.copyable).toContain("handleHit");
    expect(result.copyable).toContain("event.detail");
  });

  it("includes output element", () => {
    const result = generateJsx(getPreset("interactive"), defaultContext);

    expect(result.copyable).toContain('id="output"');
    expect(result.copyable).toContain("Hover over the chart...");
  });

  it("includes interactive prop", () => {
    const result = generateJsx(getPreset("interactive"), defaultContext);

    expect(result.display).toContain("interactive");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Snapshot Tests (All JSX-supporting presets)
// ─────────────────────────────────────────────────────────────────────────────

describe("generateJsx - snapshots", () => {
  const jsxPresets = UNIFIED_PRESETS.filter((p) => p.formats.includes("jsx"));

  test.for(
    jsxPresets.map((p) => ({ id: p.id, name: p.name })),
  )("snapshot for $name ($id)", ({ id }) => {
    const result = generateJsx(getPreset(id), {
      ...defaultContext,
      seed: "snapshot-seed",
    });

    expect(result.display).toMatchSnapshot("display");
    expect(result.copyable).toMatchSnapshot("copyable");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Import Deduplication Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("generateJsx - imports", () => {
  it("deduplicates imports when same component used multiple times", () => {
    // Create a preset with multiple sparklines
    const testPreset: UnifiedPreset = {
      charts: [
        {
          chartType: "sparkline",
          dataShape: { length: 5, type: "series" },
          element: "microviz-sparkline",
          height: 32,
          id: "a",
          width: 100,
        },
        {
          chartType: "sparkline",
          dataShape: { length: 5, type: "series" },
          element: "microviz-sparkline",
          height: 32,
          id: "b",
          width: 100,
        },
      ],
      description: "Test",
      formats: ["jsx"],
      id: "test",
      layout: { columns: 2, type: "grid" },
      name: "Test",
    };

    const result = generateJsx(testPreset, defaultContext);
    const matches = result.copyable.match(/Sparkline/g);

    // Should appear in import once, and twice in JSX
    expect(result.copyable).toContain("import { Sparkline }");
    expect(matches?.length).toBeGreaterThan(2); // import + 2 usages
  });

  it("imports multiple components when different types used", () => {
    const result = generateJsx(getPreset("multiple-charts"), defaultContext);

    // Should import multiple components
    expect(result.copyable).toMatch(/import \{ .+, .+ \}/);
  });
});
