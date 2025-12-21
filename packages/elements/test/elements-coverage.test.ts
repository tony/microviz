import { getAllChartMeta } from "@microviz/core";
import { describe, expect, it } from "vitest";
import { registerMicrovizElements } from "../src";

describe("@microviz/elements coverage", () => {
  it("registers a custom element for every chart type", () => {
    registerMicrovizElements();

    const missing: string[] = [];
    for (const meta of getAllChartMeta()) {
      const tag = `microviz-${meta.type}`;
      if (!customElements.get(tag)) missing.push(tag);
    }

    expect(missing, `Missing custom elements: ${missing.join(", ")}`).toEqual(
      [],
    );
  });
});
