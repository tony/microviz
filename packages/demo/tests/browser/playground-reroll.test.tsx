/**
 * Browser integration tests for playground Reroll functionality.
 *
 * Tests the data generation → parsing → rendering pipeline in a real browser,
 * ensuring generated random data is valid JSON that microviz elements can parse.
 */

import { describe, expect, it, test } from "vitest";
import {
  type DataShape,
  generateRandomData,
} from "../../src/cdn-playground/randomization";

describe("Reroll data format compatibility", () => {
  /**
   * Verify generateRandomData returns valid JSON that JSON.parse can handle.
   * This is the root cause of the INVALID_JSON error - comma-separated format
   * wasn't valid JSON.
   */
  test.for([
    { length: 5, type: "series" as const },
    { length: 10, type: "series" as const },
    { length: 3, type: "series" as const },
  ])("series data $length items is valid JSON", ({ type, length }) => {
    const shape: DataShape = { length, type };
    const data = generateRandomData(shape, "test-seed");

    expect(data).not.toBeNull();
    if (data === null) return; // Type narrowing

    // Must be valid JSON
    expect(() => JSON.parse(data)).not.toThrow();

    // Must parse to array of numbers
    const parsed = JSON.parse(data);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(length);
    expect(parsed.every((v: unknown) => typeof v === "number")).toBe(true);
  });

  it("segments data is valid JSON", () => {
    const shape: DataShape = { count: 3, type: "segments" };
    const data = generateRandomData(shape, "test-seed");

    expect(data).not.toBeNull();
    if (data === null) return;

    expect(() => JSON.parse(data)).not.toThrow();

    const parsed = JSON.parse(data);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(3);
    expect(
      parsed.every((s: { pct: number }) => typeof s.pct === "number"),
    ).toBe(true);
  });

  it("delta data is valid JSON", () => {
    const shape: DataShape = { type: "delta" };
    const data = generateRandomData(shape, "test-seed");

    expect(data).not.toBeNull();
    if (data === null) return;

    expect(() => JSON.parse(data)).not.toThrow();

    const parsed = JSON.parse(data);
    expect(parsed).toHaveProperty("current");
    expect(parsed).toHaveProperty("previous");
    expect(parsed).toHaveProperty("max");
  });

  it("value data is valid JSON", () => {
    const shape: DataShape = { type: "value" };
    const data = generateRandomData(shape, "test-seed");

    expect(data).not.toBeNull();
    if (data === null) return;

    expect(() => JSON.parse(data)).not.toThrow();

    const parsed = JSON.parse(data);
    expect(parsed).toHaveProperty("value");
    expect(parsed).toHaveProperty("max");
  });
});

describe("Microviz element data parsing", () => {
  it("microviz-chart accepts generated series data", async () => {
    // Import elements to register custom elements
    await import("@microviz/elements");

    // Generate random data
    const shape: DataShape = { length: 5, type: "series" };
    const data = generateRandomData(shape, "browser-test");
    if (data === null) throw new Error("Expected data to be generated");

    // Create element and set attributes
    const chart = document.createElement("microviz-chart");
    chart.setAttribute("spec", JSON.stringify({ type: "sparkline" }));
    chart.setAttribute("data", data);
    chart.setAttribute("width", "200");
    chart.setAttribute("height", "32");

    // Add to DOM to trigger connectedCallback
    document.body.appendChild(chart);

    // Wait for rendering
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Check that it rendered (has shadow DOM content)
    const shadow = chart.shadowRoot;
    expect(shadow).not.toBeNull();

    // Check for SVG or canvas content
    const svg = shadow?.querySelector("svg");
    const canvas = shadow?.querySelector("canvas");
    expect(svg || canvas).not.toBeNull();

    // Clean up
    chart.remove();
  });

  it("microviz-chart accepts generated segments data", async () => {
    await import("@microviz/elements");

    const shape: DataShape = { count: 3, type: "segments" };
    const data = generateRandomData(shape, "browser-test-segments");
    if (data === null) throw new Error("Expected data to be generated");

    const chart = document.createElement("microviz-chart");
    chart.setAttribute("spec", JSON.stringify({ type: "donut" }));
    chart.setAttribute("data", data);
    chart.setAttribute("width", "100");
    chart.setAttribute("height", "100");

    document.body.appendChild(chart);
    await new Promise((resolve) => setTimeout(resolve, 100));

    const shadow = chart.shadowRoot;
    expect(shadow).not.toBeNull();

    const svg = shadow?.querySelector("svg");
    const canvas = shadow?.querySelector("canvas");
    expect(svg || canvas).not.toBeNull();

    chart.remove();
  });

  it("setAttribute updates work after initial render", async () => {
    await import("@microviz/elements");

    // Initial data
    const initialData = JSON.stringify([10, 20, 30, 40, 50]);
    const chart = document.createElement("microviz-chart");
    chart.setAttribute("spec", JSON.stringify({ type: "sparkline" }));
    chart.setAttribute("data", initialData);
    chart.setAttribute("width", "200");
    chart.setAttribute("height", "32");

    document.body.appendChild(chart);
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Generate new random data (simulating Reroll)
    const shape: DataShape = { length: 5, type: "series" };
    const newData = generateRandomData(shape, "reroll-test");
    if (newData === null) throw new Error("Expected data to be generated");

    // Update via setAttribute (this is what Reroll does via postMessage)
    chart.setAttribute("data", newData);

    // Wait for re-render
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify still rendering
    const shadow = chart.shadowRoot;
    const svg = shadow?.querySelector("svg");
    const canvas = shadow?.querySelector("canvas");
    expect(svg || canvas).not.toBeNull();

    chart.remove();
  });
});
