/**
 * Primitive validators for basic JavaScript types.
 * These are the building blocks for chart-specific validators.
 */

import { stringify } from "./format";
import {
  fail,
  failure,
  prependPath,
  success,
  type ValidationError,
  type ValidationResult,
  type Validator,
} from "./types";

/**
 * Validate that input is a finite number (not NaN, not Infinity).
 */
export function validateNumber(input: unknown): ValidationResult<number> {
  // Handle undefined/null
  if (input === undefined || input === null) {
    return fail({
      code: "MISSING_VALUE",
      expected: "number",
      hint: "Provide a numeric value",
      message: `Expected number, got ${input === null ? "null" : "undefined"}`,
      path: [],
      received: String(input),
    });
  }

  // Handle wrong type
  if (typeof input !== "number") {
    return fail({
      code: "INVALID_TYPE",
      expected: "number",
      hint:
        typeof input === "string"
          ? "Remove quotes if this should be a number"
          : "Use a numeric value",
      message: `Expected number, got ${typeof input}`,
      path: [],
      received: stringify(input),
    });
  }

  // Handle NaN
  if (Number.isNaN(input)) {
    return fail({
      code: "INVALID_VALUE",
      expected: "finite number",
      hint: "Check for division by zero or invalid math operations",
      message: "Expected finite number, got NaN",
      path: [],
      received: "NaN",
    });
  }

  // Handle Infinity
  if (!Number.isFinite(input)) {
    return fail({
      code: "INVALID_VALUE",
      expected: "finite number",
      hint: "Check for overflow or division by very small numbers",
      message: `Expected finite number, got ${input > 0 ? "Infinity" : "-Infinity"}`,
      path: [],
      received: String(input),
    });
  }

  return success(input);
}

/**
 * Validate that input is a string.
 */
export function validateString(input: unknown): ValidationResult<string> {
  if (input === undefined || input === null) {
    return fail({
      code: "MISSING_VALUE",
      expected: "string",
      hint: "Provide a string value",
      message: `Expected string, got ${input === null ? "null" : "undefined"}`,
      path: [],
      received: String(input),
    });
  }

  if (typeof input !== "string") {
    return fail({
      code: "INVALID_TYPE",
      expected: "string",
      hint: "Wrap value in quotes",
      message: `Expected string, got ${typeof input}`,
      path: [],
      received: stringify(input),
    });
  }

  return success(input);
}

/**
 * Validate that input is an array and validate each item.
 * Uses soft validation - collects all errors instead of failing fast.
 */
export function validateArray<T>(
  input: unknown,
  itemValidator: Validator<T>,
): ValidationResult<T[]> {
  if (!Array.isArray(input)) {
    return fail({
      code: "INVALID_TYPE",
      expected: "array",
      hint: "Use JSON array syntax: [1, 2, 3]",
      message: `Expected array, got ${typeof input}`,
      path: [],
      received: stringify(input),
    });
  }

  const results: T[] = [];
  const errors: ValidationError[] = [];

  // Soft validation: collect all errors
  for (let i = 0; i < input.length; i++) {
    const result = itemValidator(input[i]);
    if (result.success) {
      results.push(result.data);
    } else {
      // Prepend index to error paths
      const withPath = prependPath(result, i);
      if (!withPath.success) {
        errors.push(...withPath.errors);
      }
    }
  }

  if (errors.length > 0) {
    return failure(errors);
  }

  return success(results);
}

/**
 * Validate a number is within a range.
 */
export function validateNumberInRange(
  input: unknown,
  min: number,
  max: number,
  context?: { fieldName?: string; hint?: string },
): ValidationResult<number> {
  const numResult = validateNumber(input);
  if (!numResult.success) return numResult;

  const value = numResult.data;
  if (value < min || value > max) {
    return fail({
      code: "OUT_OF_RANGE",
      expected: `number between ${min} and ${max}`,
      hint: context?.hint ?? `Value must be between ${min} and ${max}`,
      message: `${context?.fieldName ? `${context.fieldName} out of range` : "Value out of range"}: ${value}`,
      path: [],
      received: String(value),
    });
  }

  return success(value);
}
