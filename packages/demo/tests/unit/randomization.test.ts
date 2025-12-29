/**
 * TDD tests for universal chart randomization system.
 * Uses modern vitest patterns: test.for, test.extend, test.concurrent.for
 */

import { describe, expect, it, test } from "vitest";
import { PRESETS } from "../../src/cdn-playground/presets";
import {
  applyRandomData,
  canRandomize,
  type DataShape,
  detectEmbeds,
  generateRandomData,
  generateReactiveUpdates,
  inferDataShape,
  matchPreset,
  replaceDataAttribute,
} from "../../src/cdn-playground/randomization";

// ─────────────────────────────────────────────────────────────────────────────
// Module 1: Embed Detection
// ─────────────────────────────────────────────────────────────────────────────

describe("detectEmbeds", () => {
  test.for([
    {
      expectedCount: 1,
      html: '<microviz-sparkline data="1,2,3"></microviz-sparkline>',
      name: "single sparkline",
    },
    {
      expectedCount: 1,
      html: '<microviz-chart data="[1,2,3]"></microviz-chart>',
      name: "single chart",
    },
    {
      expectedCount: 1,
      html: '<microviz-auto data-kind="series" data="1,2,3"></microviz-auto>',
      name: "single auto",
    },
    {
      expectedCount: 2,
      html: '<microviz-sparkline data="1"></microviz-sparkline><microviz-chart data="[2]"></microviz-chart>',
      name: "multiple mixed",
    },
    {
      expectedCount: 1,
      html: '<div><p><microviz-sparkline data="1,2"></microviz-sparkline></p></div>',
      name: "nested in divs",
    },
    { expectedCount: 0, html: "<div>Hello World</div>", name: "no embeds" },
    { expectedCount: 0, html: "", name: "empty string" },
    {
      expectedCount: 1,
      html: '<!DOCTYPE html><html><body><microviz-sparkline data="1"></microviz-sparkline></body></html>',
      name: "full HTML document",
    },
  ])("detects $expectedCount embeds in: $name", ({ html, expectedCount }) => {
    const embeds = detectEmbeds(html);
    expect(embeds).toHaveLength(expectedCount);
  });

  it("extracts all attributes correctly", () => {
    const html = `<microviz-chart
      data='[1,2,3]'
      spec='{"type":"bar"}'
      style="width:200px"
    ></microviz-chart>`;

    const [embed] = detectEmbeds(html);
    expect(embed).toMatchObject({
      data: "[1,2,3]",
      spec: '{"type":"bar"}',
      tagName: "microviz-chart",
    });
  });

  it("generates unique selectors for each embed", () => {
    const html = `
      <microviz-sparkline data="1"></microviz-sparkline>
      <microviz-sparkline data="2"></microviz-sparkline>
    `;
    const embeds = detectEmbeds(html);
    expect(embeds[0].selector).not.toBe(embeds[1].selector);
  });

  it("detects quote style for serialization", () => {
    const singleQuote = "<microviz-chart data='[1,2]'></microviz-chart>";
    const doubleQuote = '<microviz-chart data="[1,2]"></microviz-chart>';

    expect(detectEmbeds(singleQuote)[0].dataQuote).toBe("'");
    expect(detectEmbeds(doubleQuote)[0].dataQuote).toBe('"');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Module 2: Data Shape Inference
// ─────────────────────────────────────────────────────────────────────────────

describe("inferDataShape", () => {
  test.for([
    {
      data: "10, 25, 15, 30",
      expectedMeta: { length: 4 },
      expectedType: "series",
      name: "comma-separated",
    },
    {
      data: "10,25,15,30",
      expectedMeta: { length: 4 },
      expectedType: "series",
      name: "comma no spaces",
    },
    {
      data: "[65, 59, 80, 81]",
      expectedMeta: { length: 4 },
      expectedType: "series",
      name: "JSON number array",
    },
    {
      data: '[{"pct":62},{"pct":38}]',
      expectedMeta: { count: 2 },
      expectedType: "segments",
      name: "segments array",
    },
    {
      data: '{"current":12,"previous":9,"max":20}',
      expectedMeta: {},
      expectedType: "delta",
      name: "delta object",
    },
    {
      data: '{"value":15,"max":20}',
      expectedMeta: {},
      expectedType: "value",
      name: "value object",
    },
    {
      data: "pct,color\n62,#fff\n38,#000",
      expectedMeta: { rows: 2 },
      expectedType: "csv",
      name: "CSV multiline",
    },
    {
      data: "",
      expectedMeta: {},
      expectedType: "unknown",
      name: "empty string",
    },
    { data: null, expectedMeta: {}, expectedType: "unknown", name: "null" },
    {
      data: "hello world",
      expectedMeta: {},
      expectedType: "unknown",
      name: "unparseable",
    },
  ] as const)("infers $expectedType for: $name", ({
    data,
    expectedType,
    expectedMeta,
  }) => {
    const shape = inferDataShape(data);
    expect(shape.type).toBe(expectedType);
    if (Object.keys(expectedMeta).length > 0) {
      expect(shape).toMatchObject(expectedMeta);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Module 3: Random Data Generation
// ─────────────────────────────────────────────────────────────────────────────

// Fixture for seeded RNG testing
const seededTest = test.extend<{ fixedSeed: string }>({
  fixedSeed: async ({ task: _ }, use) => {
    await use("test-seed-deterministic");
  },
});

describe("generateRandomData", () => {
  // Snapshot tests for each shape type
  test.for([
    { length: 5, type: "series" },
    { length: 10, type: "series" },
    { count: 3, type: "segments" },
    { type: "delta" },
    { type: "value" },
    { headers: ["pct", "color", "name"], rows: 3, type: "csv" },
  ] as const)("generates data for %j", (shape) => {
    const result = generateRandomData(shape as DataShape, "fixed-seed");
    expect(result).toMatchSnapshot();
  });

  seededTest("is deterministic with same seed", ({ fixedSeed }) => {
    const shape: DataShape = { length: 5, type: "series" };
    const a = generateRandomData(shape, fixedSeed);
    const b = generateRandomData(shape, fixedSeed);
    expect(a).toBe(b);
  });

  it("differs with different seeds", () => {
    const shape: DataShape = { length: 5, type: "series" };
    const a = generateRandomData(shape, "seed-1");
    const b = generateRandomData(shape, "seed-2");
    expect(a).not.toBe(b);
  });

  it("returns null for unknown shape", () => {
    const result = generateRandomData({ type: "unknown" }, "seed");
    expect(result).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Module 4: Attribute Serialization (Quote Preservation)
// ─────────────────────────────────────────────────────────────────────────────

describe("replaceDataAttribute", () => {
  test.for([
    {
      expected: '<microviz-sparkline data="4,5,6">',
      name: "double quotes",
      newValue: "4,5,6",
      original: '<microviz-sparkline data="1,2,3">',
    },
    {
      expected: "<microviz-chart data='[3,4]'>",
      name: "single quotes",
      newValue: "[3,4]",
      original: "<microviz-chart data='[1,2]'>",
    },
    {
      expected: '<microviz-sparkline  data="2" >',
      name: "preserve spacing",
      newValue: "2",
      original: '<microviz-sparkline  data="1" >',
    },
    {
      expected: '<microviz-chart\n  data="2"\n>',
      name: "multiline tag",
      newValue: "2",
      original: '<microviz-chart\n  data="1"\n>',
    },
  ])("$name", ({ original, newValue, expected }) => {
    const result = replaceDataAttribute(original, newValue, 0);
    expect(result).toBe(expected);
  });

  it("handles multiple embeds by index", () => {
    const html = `
      <microviz-sparkline data="1"></microviz-sparkline>
      <microviz-sparkline data="2"></microviz-sparkline>
    `;
    const result = replaceDataAttribute(html, "replaced", 1);
    expect(result).toContain('data="1"'); // First unchanged
    expect(result).toContain('data="replaced"'); // Second changed
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Module 5: Reactive Updates (No DOM Replacement)
// ─────────────────────────────────────────────────────────────────────────────

describe("generateReactiveUpdates", () => {
  it("generates AttributeUpdate[] for each randomizable embed", () => {
    const html = `
      <microviz-sparkline data="1,2,3"></microviz-sparkline>
      <microviz-chart data="[4,5,6]"></microviz-chart>
    `;
    const updates = generateReactiveUpdates(html, "seed-123");

    expect(updates).toHaveLength(2);
    expect(updates[0]).toMatchObject({
      attribute: "data",
      selector: expect.stringContaining("microviz-sparkline"),
      value: expect.any(String),
    });
    expect(updates[1]).toMatchObject({
      attribute: "data",
      selector: expect.stringContaining("microviz-chart"),
      value: expect.any(String),
    });
  });

  it("skips embeds with unknown data shape", () => {
    const html = '<microviz-chart data="unparseable-data"></microviz-chart>';
    const updates = generateReactiveUpdates(html, "seed");
    expect(updates).toHaveLength(0);
  });

  it("uses sub-seeds for each embed", () => {
    const html = `
      <microviz-sparkline data="1,2,3"></microviz-sparkline>
      <microviz-sparkline data="1,2,3"></microviz-sparkline>
    `;
    const updates = generateReactiveUpdates(html, "same-seed");
    // Different values even though same seed - sub-seeded by index
    expect(updates[0].value).not.toBe(updates[1].value);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Module 6: State Shorthands
// ─────────────────────────────────────────────────────────────────────────────

describe("canRandomize", () => {
  test.for([
    {
      expected: true,
      html: '<microviz-sparkline data="1,2,3">',
      name: "has series",
    },
    {
      expected: true,
      html: "<microviz-chart data='[{\"pct\":50}]'>",
      name: "has segments",
    },
    {
      expected: true,
      html: '<microviz-auto data=\'{"current":1,"previous":2}\'>',
      name: "has delta",
    },
    {
      expected: false,
      html: '<microviz-chart data="hello">',
      name: "unknown data",
    },
    { expected: false, html: "<div>Hello</div>", name: "no embeds" },
    {
      expected: true,
      html: '<microviz-sparkline data="1,2,3"><microviz-chart data="bad">',
      name: "mixed (one valid)",
    },
    {
      expected: false,
      html: "<microviz-sparkline></microviz-sparkline>",
      name: "no data attr",
    },
  ])("returns $expected for: $name", ({ html, expected }) => {
    expect(canRandomize(html)).toBe(expected);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Module 7: Preset Matching
// ─────────────────────────────────────────────────────────────────────────────

describe("matchPreset", () => {
  it("returns preset ID when code matches exactly", () => {
    const sparklinePreset = PRESETS.find((p) => p.id === "sparkline");
    if (sparklinePreset) {
      expect(matchPreset(sparklinePreset.code)).toBe("sparkline");
    }
  });

  it("returns null for custom code", () => {
    const customCode =
      "<!DOCTYPE html><html><body><microviz-sparkline></microviz-sparkline></body></html>";
    expect(matchPreset(customCode)).toBeNull();
  });

  // Test all presets match themselves
  test.for(
    PRESETS.map((p) => ({ code: p.code, id: p.id })),
  )("preset $id matches itself", ({ id, code }) => {
    expect(matchPreset(code)).toBe(id);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Module 8: Full Integration
// ─────────────────────────────────────────────────────────────────────────────

describe("applyRandomData (integration)", () => {
  const testCases = [
    {
      html: '<microviz-sparkline data="10, 20, 30"></microviz-sparkline>',
      name: "sparkline",
    },
    {
      html: '<microviz-chart data="[1,2,3,4,5]"></microviz-chart>',
      name: "chart array",
    },
    {
      html: '<microviz-chart data=\'[{"pct":60,"color":"#f00"},{"pct":40,"color":"#0f0"}]\'></microviz-chart>',
      name: "donut segments",
    },
    {
      html: '<microviz-auto data-kind="delta" data=\'{"current":12,"previous":9,"max":20}\'></microviz-auto>',
      name: "auto delta",
    },
    {
      html: '<microviz-sparkline data="1,2,3"></microviz-sparkline><microviz-chart data="[4,5,6]"></microviz-chart>',
      name: "multiple embeds",
    },
    {
      html: '<!DOCTYPE html><html><body><microviz-sparkline data="1,2,3"></microviz-sparkline></body></html>',
      name: "full document",
    },
  ] as const;

  // Concurrent parametrized tests (NEWEST pattern)
  test.concurrent.for(testCases)("snapshot: $name", ({ html }) => {
    const result = applyRandomData(html, "integration-test-seed");
    expect(result).toMatchSnapshot();
  });

  it("returns canRandomize: false for non-randomizable", () => {
    const result = applyRandomData("<div>no embeds</div>", "seed");
    expect(result.canRandomize).toBe(false);
    expect(result.updates).toHaveLength(0);
  });

  it("preserves HTML structure", () => {
    const html = `<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body>
  <h1>Chart</h1>
  <microviz-sparkline data="1,2,3"></microviz-sparkline>
  <p>Footer</p>
</body>
</html>`;

    const result = applyRandomData(html, "seed");
    expect(result.html).toContain("<!DOCTYPE html>");
    expect(result.html).toContain("<title>Test</title>");
    expect(result.html).toContain("<h1>Chart</h1>");
    expect(result.html).toContain("<p>Footer</p>");
  });
});
