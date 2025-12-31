/**
 * Vitest tests for the stateless preset machine.
 * Tests are organized in tiers:
 * - Tier 0: Pure function tests for generatePresetCode()
 * - Tier 1: Registry completeness tests (all wrappers have presets)
 * - Tier 2: Data generation determinism tests (same seed → same output)
 * - Tier 3: CDN URL generation tests for all source types
 */

import { describe, expect, it, test } from "vitest";
import type { CdnSource } from "../../src/cdn-playground/cdnSources";
import {
  canRandomizePreset,
  generatePresetCode,
  getCdnUrlForWrapper,
} from "../../src/cdn-playground/presetMachine";
import {
  getDefaultPreset,
  getPreset,
  PRESET_REGISTRY,
  WRAPPER_TYPES,
  type WrapperType,
} from "../../src/cdn-playground/presetRegistry";

// ─────────────────────────────────────────────────────────────────────────────
// Tier 0: Pure Function Tests for generatePresetCode()
// ─────────────────────────────────────────────────────────────────────────────

describe("Tier 0: generatePresetCode", () => {
  // Generate test cases for all wrapper+preset combinations
  const allCombinations = WRAPPER_TYPES.flatMap((wrapper) =>
    PRESET_REGISTRY[wrapper].presets.map((preset) => ({
      presetId: preset.id,
      presetName: preset.name,
      wrapper,
    })),
  );

  test.for(allCombinations)("generates valid code for $wrapper/$presetId", ({
    wrapper,
    presetId,
  }) => {
    const result = generatePresetCode({
      cdnSource: { type: "local" },
      presetId,
      seed: "test-seed",
      wrapper,
    });

    // Code should be valid HTML
    expect(result.code).toContain("<!DOCTYPE html>");
    expect(result.code).toContain("<html>");
    expect(result.code).toContain("</html>");

    // CDN URL placeholder should be replaced
    expect(result.code).not.toContain("{{CDN_URL}}");
    // biome-ignore lint/suspicious/noTemplateCurlyInString: Testing that template literal placeholders are resolved
    expect(result.code).not.toContain("${cdnUrl}");

    // Should have metadata
    expect(typeof result.canRandomize).toBe("boolean");
  });

  it("returns reactiveUpdates for randomizable presets", () => {
    const result = generatePresetCode({
      cdnSource: { type: "local" },
      presetId: "sparkline",
      seed: "update-test",
      wrapper: "elements",
    });

    expect(result.canRandomize).toBe(true);
    expect(result.reactiveUpdates).not.toBeNull();

    const updates = result.reactiveUpdates ?? [];
    expect(updates.length).toBeGreaterThan(0);

    // Each update should have required properties
    for (const update of updates) {
      expect(update).toHaveProperty("selector");
      expect(update).toHaveProperty("attribute");
      expect(update).toHaveProperty("value");
    }
  });

  it("returns null reactiveUpdates for non-randomizable presets", () => {
    const result = generatePresetCode({
      cdnSource: { type: "local" },
      presetId: "csp-safe",
      seed: "csp-test",
      wrapper: "elements",
    });

    expect(result.canRandomize).toBe(false);
    expect(result.reactiveUpdates).toBeNull();
  });

  it("falls back to default preset for unknown presetId", () => {
    const result = generatePresetCode({
      cdnSource: { type: "local" },
      presetId: "nonexistent-preset-id",
      seed: "fallback-test",
      wrapper: "elements",
    });

    // Should not throw, should return valid code
    expect(result.code).toContain("<!DOCTYPE html>");
    expect(result.code.length).toBeGreaterThan(100);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tier 1: Registry Completeness Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("Tier 1: Registry Completeness", () => {
  test.for(WRAPPER_TYPES)("wrapper '%s' has at least one preset", (wrapper) => {
    const config = PRESET_REGISTRY[wrapper];
    expect(config.presets.length).toBeGreaterThan(0);
  });

  test.for(
    WRAPPER_TYPES,
  )("wrapper '%s' has valid default preset", (wrapper) => {
    const config = PRESET_REGISTRY[wrapper];
    const defaultPreset = config.presets.find(
      (p) => p.id === config.defaultPresetId,
    );
    expect(defaultPreset).toBeDefined();
    expect(defaultPreset?.id).toBe(config.defaultPresetId);
  });

  test.for(WRAPPER_TYPES)("wrapper '%s' has getCdnUrl function", (wrapper) => {
    const config = PRESET_REGISTRY[wrapper];
    expect(typeof config.getCdnUrl).toBe("function");
  });

  it("all presets have required properties", () => {
    for (const wrapper of WRAPPER_TYPES) {
      for (const preset of PRESET_REGISTRY[wrapper].presets) {
        expect(preset.id).toBeTruthy();
        expect(preset.name).toBeTruthy();
        expect(preset.description).toBeTruthy();
        expect(typeof preset.codeFactory).toBe("function");
        expect(preset.dataConfig).toBeDefined();
        expect(typeof preset.dataConfig.supportsReactiveUpdates).toBe(
          "boolean",
        );
      }
    }
  });

  it("preset IDs are unique within each wrapper", () => {
    for (const wrapper of WRAPPER_TYPES) {
      const ids = PRESET_REGISTRY[wrapper].presets.map((p) => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    }
  });

  it("getPreset returns correct preset", () => {
    const preset = getPreset("elements", "sparkline");
    expect(preset).toBeDefined();
    expect(preset?.id).toBe("sparkline");
    expect(preset?.name).toBe("Sparkline");
  });

  it("getPreset returns undefined for unknown preset", () => {
    const preset = getPreset("elements", "nonexistent");
    expect(preset).toBeUndefined();
  });

  it("getDefaultPreset returns correct default", () => {
    const preset = getDefaultPreset("elements");
    expect(preset.id).toBe("auto-inference");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tier 2: Data Generation Determinism Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("Tier 2: Determinism", () => {
  const deterministicTestCases = [
    { presetId: "sparkline", wrapper: "elements" as WrapperType },
    { presetId: "bar-chart", wrapper: "elements" as WrapperType },
    { presetId: "donut", wrapper: "elements" as WrapperType },
    { presetId: "auto-inference", wrapper: "elements" as WrapperType },
    { presetId: "sparkline", wrapper: "solid" as WrapperType },
  ];

  test.for(
    deterministicTestCases,
  )("same seed produces same output for $wrapper/$presetId", ({
    wrapper,
    presetId,
  }) => {
    const input = {
      cdnSource: { type: "local" } as CdnSource,
      presetId,
      seed: "determinism-test-fixed-seed",
      wrapper,
    };

    const result1 = generatePresetCode(input);
    const result2 = generatePresetCode(input);

    expect(result1.code).toBe(result2.code);
    expect(result1.canRandomize).toBe(result2.canRandomize);

    if (result1.reactiveUpdates && result2.reactiveUpdates) {
      expect(result1.reactiveUpdates).toEqual(result2.reactiveUpdates);
    }
  });

  it("different seeds produce different output", () => {
    const baseInput = {
      cdnSource: { type: "local" } as CdnSource,
      presetId: "sparkline",
      wrapper: "elements" as WrapperType,
    };

    const result1 = generatePresetCode({ ...baseInput, seed: "seed-alpha" });
    const result2 = generatePresetCode({ ...baseInput, seed: "seed-beta" });

    // Code should differ (data values are different)
    expect(result1.code).not.toBe(result2.code);
  });

  it("reactive updates are also deterministic", () => {
    const input = {
      cdnSource: { type: "local" } as CdnSource,
      presetId: "auto-inference",
      seed: "reactive-determinism",
      wrapper: "elements" as WrapperType,
    };

    const result1 = generatePresetCode(input);
    const result2 = generatePresetCode(input);

    expect(result1.reactiveUpdates).toEqual(result2.reactiveUpdates);
  });

  // Snapshot tests for regression detection
  test.for(deterministicTestCases)("snapshot: $wrapper/$presetId", ({
    wrapper,
    presetId,
  }) => {
    const result = generatePresetCode({
      cdnSource: { type: "local" },
      presetId,
      seed: "snapshot-seed-v1",
      wrapper,
    });

    expect(result).toMatchSnapshot();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tier 3: CDN URL Generation Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("Tier 3: CDN URL Generation", () => {
  const cdnSourceTypes: CdnSource[] = [
    { type: "local" },
    { type: "cdn-dev" },
    { type: "jsdelivr" },
    { type: "unpkg" },
    { type: "esm-sh" },
    { type: "custom", url: "https://example.com/microviz.js" },
  ];

  test.for(
    WRAPPER_TYPES,
  )("wrapper '%s' generates URLs for all CDN sources", (wrapper) => {
    for (const cdnSource of cdnSourceTypes) {
      const url = getCdnUrlForWrapper(wrapper, cdnSource);
      expect(url).toBeTruthy();
      expect(typeof url).toBe("string");

      // URL should be valid
      if (cdnSource.type !== "local") {
        expect(url).toMatch(/^https?:\/\//);
      } else {
        expect(url).toMatch(/^\//);
      }
    }
  });

  it("local source returns relative paths", () => {
    expect(getCdnUrlForWrapper("elements", { type: "local" })).toBe(
      "/cdn/microviz.js",
    );
    expect(getCdnUrlForWrapper("solid", { type: "local" })).toBe(
      "/cdn/solid.js",
    );
    expect(getCdnUrlForWrapper("react", { type: "local" })).toBe(
      "/cdn/react.js",
    );
  });

  it("cdn-dev source returns correct canary URLs", () => {
    const elementsUrl = getCdnUrlForWrapper("elements", { type: "cdn-dev" });
    expect(elementsUrl).toContain("cdn-dev.microviz.org");
    expect(elementsUrl).toContain("@microviz/elements");

    const solidUrl = getCdnUrlForWrapper("solid", { type: "cdn-dev" });
    expect(solidUrl).toContain("cdn-dev.microviz.org");
    expect(solidUrl).toContain("@microviz/solid");
  });

  it("esm.sh source returns esm.sh URLs", () => {
    const url = getCdnUrlForWrapper("elements", { type: "esm-sh" });
    expect(url).toContain("esm.sh");
    expect(url).toContain("@microviz/elements");
  });

  it("custom source preserves URL pattern", () => {
    const customSource: CdnSource = {
      type: "custom",
      url: "https://my-cdn.com/libs/microviz.js",
    };

    const elementsUrl = getCdnUrlForWrapper("elements", customSource);
    expect(elementsUrl).toBe("https://my-cdn.com/libs/microviz.js");

    const solidUrl = getCdnUrlForWrapper("solid", customSource);
    expect(solidUrl).toBe("https://my-cdn.com/libs/solid.js");
  });

  it("generated code contains correct CDN URL", () => {
    const result = generatePresetCode({
      cdnSource: { type: "jsdelivr" },
      presetId: "sparkline",
      seed: "cdn-test",
      wrapper: "elements",
    });

    expect(result.code).toContain("cdn.jsdelivr.net");
    expect(result.code).toContain("@microviz/elements");
  });

  it("solid presets use solid CDN URL in import map", () => {
    const result = generatePresetCode({
      cdnSource: { type: "jsdelivr" },
      presetId: "sparkline",
      seed: "solid-cdn-test",
      wrapper: "solid",
    });

    expect(result.code).toContain("@microviz/solid");
    expect(result.code).toContain("cdn.jsdelivr.net");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Utility Function Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("Utility Functions", () => {
  describe("canRandomizePreset", () => {
    it("returns true for randomizable elements presets", () => {
      expect(canRandomizePreset("elements", "sparkline")).toBe(true);
      expect(canRandomizePreset("elements", "bar-chart")).toBe(true);
      expect(canRandomizePreset("elements", "donut")).toBe(true);
    });

    it("returns false for non-randomizable presets", () => {
      expect(canRandomizePreset("elements", "csp-safe")).toBe(false);
      expect(canRandomizePreset("solid", "sparkline")).toBe(false);
    });

    it("returns false for unknown presets", () => {
      expect(canRandomizePreset("elements", "nonexistent")).toBe(false);
    });
  });
});
