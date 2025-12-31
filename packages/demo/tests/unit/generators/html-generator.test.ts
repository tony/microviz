/**
 * TDD tests for HTML generator.
 */

import { describe, expect, it, test } from "vitest";
import { generateHtml } from "../../../src/cdn-playground/generators/html-generator";
import type { GeneratorContext } from "../../../src/cdn-playground/generators/types";
import {
  UNIFIED_PRESETS,
  type UnifiedPreset,
} from "../../../src/cdn-playground/unified-presets";

// ─────────────────────────────────────────────────────────────────────────────
// Test Fixtures
// ─────────────────────────────────────────────────────────────────────────────

const defaultContext: GeneratorContext = {
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

describe("generateHtml - basic output", () => {
  it("returns GeneratedCode with correct language", () => {
    const result = generateHtml(getPreset("sparkline"), defaultContext);

    expect(result).toHaveProperty("display");
    expect(result).toHaveProperty("copyable");
    expect(result).toHaveProperty("language");
    expect(result.language).toBe("html");
  });

  it("display and copyable are identical for HTML", () => {
    const result = generateHtml(getPreset("sparkline"), defaultContext);

    expect(result.display).toBe(result.copyable);
  });

  it("includes DOCTYPE and html structure", () => {
    const result = generateHtml(getPreset("sparkline"), defaultContext);

    expect(result.display).toContain("<!DOCTYPE html>");
    expect(result.display).toContain("<html>");
    expect(result.display).toContain("<head>");
    expect(result.display).toContain("<body>");
  });

  it("includes CDN URL placeholder", () => {
    const result = generateHtml(getPreset("sparkline"), defaultContext);

    expect(result.display).toContain("{{CDN_URL}}");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Element Tag Generation
// ─────────────────────────────────────────────────────────────────────────────

describe("generateHtml - element tags", () => {
  it("generates microviz-sparkline for sparkline preset", () => {
    const result = generateHtml(getPreset("sparkline"), defaultContext);

    expect(result.display).toContain("<microviz-sparkline");
    expect(result.display).toContain("</microviz-sparkline>");
  });

  it("generates microviz-chart for bar-chart preset", () => {
    const result = generateHtml(getPreset("bar-chart"), defaultContext);

    expect(result.display).toContain("<microviz-chart");
    expect(result.display).toContain("</microviz-chart>");
  });

  it("generates microviz-auto for auto presets", () => {
    const result = generateHtml(getPreset("auto-inference"), defaultContext);

    expect(result.display).toContain("<microviz-auto");
    expect(result.display).toContain("</microviz-auto>");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Attribute Generation
// ─────────────────────────────────────────────────────────────────────────────

describe("generateHtml - attributes", () => {
  it("includes data attribute", () => {
    const result = generateHtml(getPreset("sparkline"), defaultContext);

    expect(result.display).toMatch(/data="[\d, ]+"/);
  });

  it("includes width and height attributes", () => {
    const result = generateHtml(getPreset("sparkline"), defaultContext);

    expect(result.display).toContain('width="');
    expect(result.display).toContain('height="');
  });

  it("includes spec attribute for microviz-chart", () => {
    const result = generateHtml(getPreset("bar-chart"), defaultContext);

    expect(result.display).toContain("spec='");
    expect(result.display).toContain("sparkline-bars");
  });

  it("includes data-kind for microviz-auto", () => {
    const result = generateHtml(getPreset("auto-inference"), defaultContext);

    expect(result.display).toContain('data-kind="series"');
    expect(result.display).toContain('data-kind="delta"');
    expect(result.display).toContain('data-kind="segments"');
    expect(result.display).toContain('data-kind="value"');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Layout Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("generateHtml - layouts", () => {
  it("single layout has no grid wrapper", () => {
    const result = generateHtml(getPreset("sparkline"), defaultContext);

    expect(result.display).not.toContain('class="grid"');
  });

  it("cards layout includes grid wrapper", () => {
    const result = generateHtml(getPreset("multiple-charts"), defaultContext);

    expect(result.display).toContain('class="grid"');
    expect(result.display).toContain('class="card"');
  });

  it("cards layout includes labels", () => {
    const result = generateHtml(getPreset("multiple-charts"), defaultContext);

    expect(result.display).toContain("<h2>Revenue Trend</h2>");
    expect(result.display).toContain("<h2>Sales by Region</h2>");
    expect(result.display).toContain("<h2>Traffic Sources</h2>");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Determinism Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("generateHtml - determinism", () => {
  it("same seed produces same output", () => {
    const preset = getPreset("sparkline");
    const a = generateHtml(preset, defaultContext);
    const b = generateHtml(preset, defaultContext);

    expect(a.display).toBe(b.display);
  });

  it("different seeds produce different data", () => {
    const preset = getPreset("sparkline");
    const a = generateHtml(preset, { ...defaultContext, seed: "seed-a" });
    const b = generateHtml(preset, { ...defaultContext, seed: "seed-b" });

    expect(a.display).not.toBe(b.display);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Special Case: CSP-Safe
// ─────────────────────────────────────────────────────────────────────────────

describe("generateHtml - csp-safe", () => {
  it("uses importmap instead of CDN bundle", () => {
    const result = generateHtml(getPreset("csp-safe"), defaultContext);

    expect(result.display).toContain("importmap");
    expect(result.display).toContain("@microviz/core");
    expect(result.display).toContain("@microviz/renderers");
    expect(result.display).not.toContain("{{CDN_URL}}");
  });

  it("uses computeModel and renderSvgString", () => {
    const result = generateHtml(getPreset("csp-safe"), defaultContext);

    expect(result.display).toContain("computeModel");
    expect(result.display).toContain("renderSvgString");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Special Case: CDN Dev Preview
// ─────────────────────────────────────────────────────────────────────────────

describe("generateHtml - cdn-dev-preview", () => {
  it("uses custom CDN pattern", () => {
    const result = generateHtml(getPreset("cdn-dev-preview"), defaultContext);

    expect(result.display).toContain("cdn-dev.microviz.org");
    expect(result.display).toContain("REPLACE_SHA");
    expect(result.display).not.toContain("{{CDN_URL}}");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Interactive Preset Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("generateHtml - interactive", () => {
  it("includes event listener script", () => {
    const result = generateHtml(getPreset("interactive"), defaultContext);

    expect(result.display).toContain("addEventListener");
    expect(result.display).toContain("microviz-hit");
  });

  it("includes output element", () => {
    const result = generateHtml(getPreset("interactive"), defaultContext);

    expect(result.display).toContain('id="output"');
    expect(result.display).toContain("Hover over the chart...");
  });

  it("includes interactive attribute", () => {
    const result = generateHtml(getPreset("interactive"), defaultContext);

    expect(result.display).toMatch(/interactive\b/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Snapshot Tests (All presets)
// ─────────────────────────────────────────────────────────────────────────────

describe("generateHtml - snapshots", () => {
  test.for(
    UNIFIED_PRESETS.map((p) => ({ id: p.id, name: p.name })),
  )("snapshot for $name ($id)", ({ id }) => {
    const result = generateHtml(getPreset(id), {
      ...defaultContext,
      seed: "snapshot-seed",
    });

    expect(result.display).toMatchSnapshot();
  });
});
