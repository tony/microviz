/**
 * TDD-first validation tests.
 * These snapshots define the expected error output format.
 * Write tests first, then implement to make them pass.
 */
import { describe, expect, it } from "vitest";

import {
  type ValidationError,
  validateArray,
  validateChartData,
  validateNumber,
  validateSegmentData,
  validateSparklineData,
  validateString,
} from "../index";

describe("validation types", () => {
  describe("validateNumber", () => {
    it("accepts valid numbers", () => {
      expect(validateNumber(42)).toEqual({ data: 42, success: true });
      expect(validateNumber(0)).toEqual({ data: 0, success: true });
      expect(validateNumber(-5.5)).toEqual({ data: -5.5, success: true });
    });

    it("rejects non-numbers with helpful message", () => {
      const result = validateNumber("42");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toMatchInlineSnapshot(`
					[
					  {
					    "code": "INVALID_TYPE",
					    "expected": "number",
					    "hint": "Remove quotes if this should be a number",
					    "message": "Expected number, got string",
					    "path": [],
					    "received": ""42"",
					  },
					]
				`);
      }
    });

    it("rejects NaN with specific hint", () => {
      const result = validateNumber(Number.NaN);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toMatchInlineSnapshot(`
					[
					  {
					    "code": "INVALID_VALUE",
					    "expected": "finite number",
					    "hint": "Check for division by zero or invalid math operations",
					    "message": "Expected finite number, got NaN",
					    "path": [],
					    "received": "NaN",
					  },
					]
				`);
      }
    });

    it("rejects Infinity", () => {
      const result = validateNumber(Number.POSITIVE_INFINITY);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].code).toBe("INVALID_VALUE");
        expect(result.errors[0].received).toBe("Infinity");
      }
    });

    it("rejects undefined with helpful hint", () => {
      const result = validateNumber(undefined);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toMatchInlineSnapshot(`
					[
					  {
					    "code": "MISSING_VALUE",
					    "expected": "number",
					    "hint": "Provide a numeric value",
					    "message": "Expected number, got undefined",
					    "path": [],
					    "received": "undefined",
					  },
					]
				`);
      }
    });
  });

  describe("validateString", () => {
    it("accepts valid strings", () => {
      expect(validateString("hello")).toEqual({ data: "hello", success: true });
      expect(validateString("")).toEqual({ data: "", success: true });
    });

    it("rejects non-strings", () => {
      const result = validateString(123);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].code).toBe("INVALID_TYPE");
        expect(result.errors[0].expected).toBe("string");
      }
    });
  });

  describe("validateArray", () => {
    it("accepts valid arrays", () => {
      const result = validateArray([1, 2, 3], validateNumber);
      expect(result).toEqual({ data: [1, 2, 3], success: true });
    });

    it("collects all item errors (soft validation)", () => {
      const result = validateArray(["a", 2, "b", 4], validateNumber);
      expect(result.success).toBe(false);
      if (!result.success) {
        // Should report errors for indices 0 and 2, not fail fast
        expect(result.errors).toHaveLength(2);
        expect(result.errors[0].path).toEqual([0]);
        expect(result.errors[1].path).toEqual([2]);
      }
    });

    it("rejects non-arrays with helpful hint", () => {
      const result = validateArray("1,2,3", validateNumber);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toMatchInlineSnapshot(`
					[
					  {
					    "code": "INVALID_TYPE",
					    "expected": "array",
					    "hint": "Use JSON array syntax: [1, 2, 3]",
					    "message": "Expected array, got string",
					    "path": [],
					    "received": ""1,2,3"",
					  },
					]
				`);
      }
    });
  });
});

describe("chart-specific validators", () => {
  describe("validateSparklineData", () => {
    it("accepts number arrays", () => {
      const result = validateSparklineData([1, 2, 3, 4, 5]);
      expect(result).toEqual({ data: [1, 2, 3, 4, 5], success: true });
    });

    it("accepts empty arrays", () => {
      const result = validateSparklineData([]);
      expect(result).toEqual({ data: [], success: true });
    });

    it("reports invalid items with paths", () => {
      const result = validateSparklineData([1, "two", 3, null, 5]);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toMatchInlineSnapshot(`
					[
					  {
					    "code": "INVALID_TYPE",
					    "expected": "number",
					    "hint": "Remove quotes if this should be a number",
					    "message": "Expected number, got string",
					    "path": [
					      1,
					    ],
					    "received": ""two"",
					  },
					  {
					    "code": "MISSING_VALUE",
					    "expected": "number",
					    "hint": "Provide a numeric value",
					    "message": "Expected number, got null",
					    "path": [
					      3,
					    ],
					    "received": "null",
					  },
					]
				`);
      }
    });

    it("rejects non-array with sparkline-specific hint", () => {
      const result = validateSparklineData("10, 20, 30");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toMatchInlineSnapshot(`
					[
					  {
					    "code": "INVALID_TYPE",
					    "expected": "array of numbers",
					    "hint": "Try: data="[10, 20, 30]" or data="10, 20, 30"",
					    "message": "Sparkline requires an array of numbers",
					    "path": [],
					    "received": ""10, 20, 30"",
					  },
					]
				`);
      }
    });
  });

  describe("validateSegmentData", () => {
    it("accepts valid segments", () => {
      const result = validateSegmentData([
        { color: "#f00", pct: 50 },
        { color: "#0f0", name: "Green", pct: 30 },
        { color: "#00f", pct: 20 },
      ]);
      expect(result.success).toBe(true);
    });

    it("reports missing required fields", () => {
      const result = validateSegmentData([
        { pct: 50 }, // missing color
        { color: "#f00" }, // missing pct
      ]);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toMatchInlineSnapshot(`
					[
					  {
					    "code": "MISSING_FIELD",
					    "expected": "string (hex color like #f00 or #ff0000)",
					    "hint": "Add color: "#6366f1"",
					    "message": "Segment missing required field: color",
					    "path": [
					      0,
					      "color",
					    ],
					    "received": "undefined",
					  },
					  {
					    "code": "MISSING_FIELD",
					    "expected": "number (0-100)",
					    "hint": "Add pct: 50",
					    "message": "Segment missing required field: pct",
					    "path": [
					      1,
					      "pct",
					    ],
					    "received": "undefined",
					  },
					]
				`);
      }
    });

    it("reports invalid field types", () => {
      const result = validateSegmentData([{ color: 123, pct: "fifty" }]);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toMatchInlineSnapshot(`
					[
					  {
					    "code": "INVALID_TYPE",
					    "expected": "number (0-100)",
					    "hint": "Use a number like pct: 50",
					    "message": "Expected number, got string",
					    "path": [
					      0,
					      "pct",
					    ],
					    "received": ""fifty"",
					  },
					  {
					    "code": "INVALID_TYPE",
					    "expected": "string (hex color)",
					    "hint": "Use a color string like color: "#6366f1"",
					    "message": "Expected string, got number",
					    "path": [
					      0,
					      "color",
					    ],
					    "received": "123",
					  },
					]
				`);
      }
    });

    it("reports out-of-range percentages", () => {
      const result = validateSegmentData([
        { color: "#f00", pct: 150 },
        { color: "#0f0", pct: -10 },
      ]);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toMatchInlineSnapshot(`
					[
					  {
					    "code": "OUT_OF_RANGE",
					    "expected": "number between 0 and 100",
					    "hint": "Percentages must be 0-100",
					    "message": "Percentage out of range: 150",
					    "path": [
					      0,
					      "pct",
					    ],
					    "received": "150",
					  },
					  {
					    "code": "OUT_OF_RANGE",
					    "expected": "number between 0 and 100",
					    "hint": "Percentages must be 0-100",
					    "message": "Percentage out of range: -10",
					    "path": [
					      1,
					      "pct",
					    ],
					    "received": "-10",
					  },
					]
				`);
      }
    });
  });

  describe("validateChartData", () => {
    it("validates sparkline data", () => {
      const result = validateChartData({ type: "sparkline" }, [1, 2, 3]);
      expect(result.success).toBe(true);
    });

    it("validates donut data", () => {
      const result = validateChartData({ type: "donut" }, [
        { color: "#f00", pct: 60 },
        { color: "#0f0", pct: 40 },
      ]);
      expect(result.success).toBe(true);
    });

    it("reports missing data with chart-specific hint", () => {
      const result = validateChartData({ type: "donut" }, undefined);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toMatchInlineSnapshot(`
					[
					  {
					    "code": "MISSING_DATA",
					    "expected": "array of segments [{pct, color, name?}]",
					    "hint": "Try: data='[{"pct":50,"color":"#6366f1"}]'",
					    "message": "Donut chart requires data",
					    "path": [],
					    "received": "undefined",
					  },
					]
				`);
      }
    });

    it("reports wrong data shape for chart type", () => {
      const result = validateChartData(
        { type: "donut" },
        [1, 2, 3], // number array instead of segments
      );
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toMatchInlineSnapshot(`
					[
					  {
					    "code": "INVALID_DATA_SHAPE",
					    "expected": "array of segments [{pct, color, name?}]",
					    "hint": "Donut needs segment objects, not plain numbers. Try: [{pct: 50, color: "#6366f1"}]",
					    "message": "Donut chart expects segment objects, got number array",
					    "path": [],
					    "received": "[1,2,3]",
					  },
					]
				`);
      }
    });

    it("passes through unknown chart type (chart registry handles validation)", () => {
      const result = validateChartData({ type: "unknown-chart" }, [1, 2, 3]);
      expect(result.success).toBe(true);
    });
  });
});

describe("error formatting", () => {
  it("formatError produces readable console output", async () => {
    const { formatError } = await import("../format");
    const error: ValidationError = {
      code: "MISSING_DATA",
      expected: "array of segments",
      hint: 'Try: data=\'[{"pct":50,"color":"#6366f1"}]\'',
      message: "Donut chart requires data",
      path: ["data"],
      received: "undefined",
    };

    const formatted = formatError(error);
    // Should contain all key parts
    expect(formatted).toContain("Donut chart requires data");
    expect(formatted).toContain("data");
    expect(formatted).toContain("array of segments");
    expect(formatted).toContain("undefined");
    expect(formatted).toContain("Try:");
  });

  it("formatForLLM produces copy-pasteable fixes", async () => {
    const { formatForLLM } = await import("../format");
    const errors: ValidationError[] = [
      {
        code: "MISSING_DATA",
        expected: "array of segments",
        hint: 'data=\'[{"pct":50,"color":"#6366f1"}]\'',
        message: "Donut chart requires data",
        path: [],
        received: "undefined",
      },
    ];

    const formatted = formatForLLM(errors);
    expect(formatted).toMatchInlineSnapshot(
      `"Error: Donut chart requires data. Fix: data='[{"pct":50,"color":"#6366f1"}]'"`,
    );
  });
});
