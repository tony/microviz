/**
 * TDD tests for Solid generator.
 */

import { describe, expect, it, test } from "vitest";
import { generateSolid } from "../../../src/cdn-playground/generators/solid-generator";
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

describe("generateSolid - basic output", () => {
  it("returns GeneratedCode with correct language", () => {
    const result = generateSolid(getPreset("sparkline"), defaultContext);

    expect(result).toHaveProperty("display");
    expect(result).toHaveProperty("copyable");
    expect(result).toHaveProperty("language");
    expect(result.language).toBe("tsx");
  });

  it("display is compact, copyable has imports", () => {
    const result = generateSolid(getPreset("sparkline"), defaultContext);

    // Display should NOT have import statement
    expect(result.display).not.toContain("import");
    // Copyable should have import from @microviz/solid
    expect(result.copyable).toContain("@microviz/solid");
    expect(result.copyable).toContain("import");
  });

  it("copyable includes export function wrapper", () => {
    const result = generateSolid(getPreset("sparkline"), defaultContext);

    expect(result.copyable).toContain("export function Chart()");
    expect(result.copyable).toContain("return (");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Component Mapping Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("generateSolid - component mapping", () => {
  it("uses Sparkline component for sparkline preset", () => {
    const result = generateSolid(getPreset("sparkline"), defaultContext);

    expect(result.display).toContain("<Sparkline");
    expect(result.copyable).toContain("import { Sparkline }");
  });

  it("uses Bar component for bar-chart preset", () => {
    const result = generateSolid(getPreset("bar-chart"), defaultContext);

    // bar-chart uses microviz-chart with sparkline-bars spec, which maps to Bar
    expect(result.copyable).toContain("@microviz/solid");
  });

  it("uses MicrovizChart for donut preset", () => {
    const result = generateSolid(getPreset("donut"), defaultContext);

    expect(result.display).toContain("<MicrovizChart");
    expect(result.copyable).toContain("import { MicrovizChart }");
  });

  it("uses MicrovizChart for auto presets", () => {
    const result = generateSolid(getPreset("auto-csv"), defaultContext);

    expect(result.display).toContain("<MicrovizChart");
    expect(result.copyable).toContain("input={{");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Props Generation Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("generateSolid - props", () => {
  it("includes data prop for Sparkline", () => {
    const result = generateSolid(getPreset("sparkline"), defaultContext);

    expect(result.display).toContain("data={[");
    expect(result.display).toContain("width={");
    expect(result.display).toContain("height={");
  });

  it("includes input prop for MicrovizChart", () => {
    const result = generateSolid(getPreset("donut"), defaultContext);

    expect(result.display).toContain("input={{");
    expect(result.display).toContain("data:");
    expect(result.display).toContain("spec:");
    expect(result.display).toContain("size:");
  });

  it("includes spec in input prop", () => {
    const result = generateSolid(getPreset("donut"), defaultContext);

    expect(result.display).toContain('type: "donut"');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Layout Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("generateSolid - layouts", () => {
  it("single layout has no wrapper", () => {
    const result = generateSolid(getPreset("sparkline"), defaultContext);

    expect(result.display).not.toContain("<div");
  });

  it("cards layout uses class (not className)", () => {
    const result = generateSolid(getPreset("multiple-charts"), defaultContext);

    // Solid uses 'class' instead of 'className'
    expect(result.display).toContain('class="card"');
  });

  it("cards layout includes labels", () => {
    const result = generateSolid(getPreset("multiple-charts"), defaultContext);

    expect(result.display).toContain("<h2>Revenue Trend</h2>");
    expect(result.display).toContain("<h2>Sales by Region</h2>");
    expect(result.display).toContain("<h2>Traffic Sources</h2>");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Determinism Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("generateSolid - determinism", () => {
  it("same seed produces same output", () => {
    const preset = getPreset("sparkline");
    const a = generateSolid(preset, defaultContext);
    const b = generateSolid(preset, defaultContext);

    expect(a.display).toBe(b.display);
    expect(a.copyable).toBe(b.copyable);
  });

  it("different seeds produce different data", () => {
    const preset = getPreset("sparkline");
    const a = generateSolid(preset, { ...defaultContext, seed: "seed-a" });
    const b = generateSolid(preset, { ...defaultContext, seed: "seed-b" });

    expect(a.display).not.toBe(b.display);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Interactive Preset Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("generateSolid - interactive", () => {
  it("uses createSignal for interactive state", () => {
    const result = generateSolid(getPreset("interactive"), defaultContext);

    expect(result.copyable).toContain("createSignal");
    expect(result.copyable).toContain("import { createSignal");
  });

  it("includes MicrovizChart with input prop", () => {
    const result = generateSolid(getPreset("interactive"), defaultContext);

    expect(result.copyable).toContain("<MicrovizChart");
    expect(result.copyable).toContain("input={{");
  });

  it("includes output element", () => {
    const result = generateSolid(getPreset("interactive"), defaultContext);

    expect(result.copyable).toContain('id="output"');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Snapshot Tests (All presets that support solid)
// ─────────────────────────────────────────────────────────────────────────────

describe("generateSolid - snapshots", () => {
  const solidPresets = UNIFIED_PRESETS.filter((p) =>
    p.formats.includes("solid"),
  );

  test.for(
    solidPresets.map((p) => ({ id: p.id, name: p.name })),
  )("snapshot for $name ($id)", ({ id }) => {
    const result = generateSolid(getPreset(id), {
      ...defaultContext,
      seed: "snapshot-seed",
    });

    expect(result.display).toMatchSnapshot();
    expect(result.copyable).toMatchSnapshot();
  });
});
