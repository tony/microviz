import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { chartRegistry } from "./registry";

describe("chartRegistry coverage", () => {
  test("every registered chart has a matching per-chart test file", () => {
    const chartsDir = dirname(fileURLToPath(import.meta.url));
    const testFiles = new Set(
      readdirSync(chartsDir, { withFileTypes: true })
        .filter((entry) => entry.isFile())
        .map((entry) => entry.name),
    );

    for (const type of Object.keys(chartRegistry)) {
      const expected = `${type}.test.ts`;
      expect(
        testFiles.has(expected),
        `missing ${join(chartsDir, expected)}`,
      ).toBe(true);
    }
  });
});
