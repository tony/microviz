/**
 * Chart-specific validators.
 * Domain-specific validation for microviz chart data shapes.
 */

import { stringify } from "./format";
import {
  validateArray,
  validateNumber,
  validateNumberInRange,
  validateString,
} from "./primitives";
import {
  fail,
  failure,
  prependPath,
  success,
  type ValidationError,
  type ValidationResult,
} from "./types";

// Chart types that use simple number arrays
const NUMBER_ARRAY_CHART_TYPES = new Set([
  "sparkline",
  "spark-area",
  "sparkline-bars",
]);

// Chart types that use segment data
const SEGMENT_CHART_TYPES = new Set(["donut", "bitfield"]);

/**
 * Segment data shape for donut/bitfield charts.
 */
export type Segment = {
  pct: number;
  color: string;
  name?: string;
};

/**
 * Validate sparkline data (array of numbers).
 */
export function validateSparklineData(
  input: unknown,
): ValidationResult<number[]> {
  // Handle non-arrays with sparkline-specific hint
  if (!Array.isArray(input)) {
    return fail({
      code: "INVALID_TYPE",
      expected: "array of numbers",
      hint: 'Try: data="[10, 20, 30]" or data="10, 20, 30"',
      message: "Sparkline requires an array of numbers",
      path: [],
      received: stringify(input),
    });
  }

  return validateArray(input, validateNumber);
}

/**
 * Validate a single segment object.
 */
function validateSegment(
  input: unknown,
  index: number,
): ValidationResult<Segment> {
  if (typeof input !== "object" || input === null) {
    return fail({
      code: "INVALID_TYPE",
      expected: "object with {pct, color, name?}",
      hint: 'Use: {pct: 50, color: "#6366f1"}',
      message: "Segment must be an object",
      path: [],
      received: stringify(input),
    });
  }

  const obj = input as Record<string, unknown>;
  const errors: ValidationError[] = [];

  // Validate pct
  if (obj.pct === undefined) {
    errors.push({
      code: "MISSING_FIELD",
      expected: "number (0-100)",
      hint: "Add pct: 50",
      message: "Segment missing required field: pct",
      path: [index, "pct"],
      received: "undefined",
    });
  } else {
    const pctResult = validateNumberInRange(obj.pct, 0, 100, {
      fieldName: "Percentage",
      hint: "Percentages must be 0-100",
    });
    if (!pctResult.success) {
      // Check if it's a type error or range error
      const baseError = pctResult.errors[0];
      if (baseError.code === "INVALID_TYPE") {
        errors.push({
          ...baseError,
          expected: "number (0-100)",
          hint: "Use a number like pct: 50",
          path: [index, "pct"],
        });
      } else {
        errors.push({
          ...baseError,
          path: [index, "pct"],
        });
      }
    }
  }

  // Validate color
  if (obj.color === undefined) {
    errors.push({
      code: "MISSING_FIELD",
      expected: "string (hex color like #f00 or #ff0000)",
      hint: 'Add color: "#6366f1"',
      message: "Segment missing required field: color",
      path: [index, "color"],
      received: "undefined",
    });
  } else {
    const colorResult = validateString(obj.color);
    if (!colorResult.success) {
      errors.push({
        code: "INVALID_TYPE",
        expected: "string (hex color)",
        hint: 'Use a color string like color: "#6366f1"',
        message: `Expected string, got ${typeof obj.color}`,
        path: [index, "color"],
        received: stringify(obj.color),
      });
    }
  }

  // Validate optional name
  if (obj.name !== undefined) {
    const nameResult = validateString(obj.name);
    if (!nameResult.success) {
      const withPath = prependPath(nameResult, "name");
      if (!withPath.success) {
        errors.push(
          ...withPath.errors.map((e) => ({ ...e, path: [index, ...e.path] })),
        );
      }
    }
  }

  if (errors.length > 0) {
    return failure(errors);
  }

  return success({
    color: obj.color as string,
    name: obj.name as string | undefined,
    pct: obj.pct as number,
  });
}

/**
 * Validate segment data for donut/bitfield charts.
 */
export function validateSegmentData(
  input: unknown,
): ValidationResult<Segment[]> {
  if (!Array.isArray(input)) {
    return fail({
      code: "INVALID_TYPE",
      expected: "array of segments [{pct, color, name?}]",
      hint: 'Try: data=\'[{"pct":50,"color":"#6366f1"}]\'',
      message: "Segment data must be an array",
      path: [],
      received: stringify(input),
    });
  }

  const results: Segment[] = [];
  const errors: ValidationError[] = [];

  // Validate each segment
  for (let i = 0; i < input.length; i++) {
    const result = validateSegment(input[i], i);
    if (result.success) {
      results.push(result.data);
    } else {
      errors.push(...result.errors);
    }
  }

  if (errors.length > 0) {
    return failure(errors);
  }

  return success(results);
}

/**
 * Check if data looks like a number array (for detecting wrong shape).
 */
function isNumberArray(data: unknown): boolean {
  return Array.isArray(data) && data.length > 0 && typeof data[0] === "number";
}

/**
 * Get chart type category for validation routing.
 */
function getChartDataType(
  chartType: string,
): "number-array" | "segments" | "unknown" {
  if (NUMBER_ARRAY_CHART_TYPES.has(chartType)) return "number-array";
  if (SEGMENT_CHART_TYPES.has(chartType)) return "segments";
  return "unknown";
}

/**
 * Validate chart data based on spec type.
 * Routes to appropriate validator based on chart type.
 */
export function validateChartData(
  spec: { type: string },
  data: unknown,
): ValidationResult<unknown> {
  const chartType = spec.type;
  const dataType = getChartDataType(chartType);

  // Unknown chart type - skip validation (chart registry handles this)
  if (dataType === "unknown") {
    return success(data);
  }

  // Missing data
  if (data === undefined || data === null) {
    const chartName = chartType.charAt(0).toUpperCase() + chartType.slice(1);
    const expectedShape =
      dataType === "segments"
        ? "array of segments [{pct, color, name?}]"
        : "array of numbers";
    const example =
      dataType === "segments"
        ? `data='[{"pct":50,"color":"#6366f1"}]'`
        : 'data="[10, 20, 30]"';

    return fail({
      code: "MISSING_DATA",
      expected: expectedShape,
      hint: `Try: ${example}`,
      message: `${chartName} chart requires data`,
      path: [],
      received: data === null ? "null" : "undefined",
    });
  }

  // Validate based on chart type
  if (dataType === "segments") {
    // Check for wrong shape (number array instead of segments)
    if (isNumberArray(data)) {
      const chartName = chartType.charAt(0).toUpperCase() + chartType.slice(1);
      return fail({
        code: "INVALID_DATA_SHAPE",
        expected: "array of segments [{pct, color, name?}]",
        hint: `${chartName} needs segment objects, not plain numbers. Try: [{pct: 50, color: "#6366f1"}]`,
        message: `${chartName} chart expects segment objects, got number array`,
        path: [],
        received: stringify(data),
      });
    }
    return validateSegmentData(data);
  }

  // Number array charts
  if (dataType === "number-array") {
    return validateSparklineData(data);
  }

  return success(data);
}
