/**
 * Validation module for microviz.
 *
 * Provides domain-specific validation for chart data with excellent error messages.
 * Designed for humans, LLMs, vibecoders, and debuggers.
 *
 * @example
 * ```ts
 * import { validateChartData, formatErrors } from "@microviz/core";
 *
 * const result = validateChartData({ type: "donut" }, userData);
 * if (!result.success) {
 *   console.error(formatErrors(result.errors));
 * }
 * ```
 */

// Chart-specific validators
export type { Segment } from "./chart-validators";
export {
  validateChartData,
  validateSegmentData,
  validateSparklineData,
} from "./chart-validators";
// Formatting utilities
export {
  COLORS,
  formatError,
  formatErrors,
  formatForLLM,
  formatForVibecoder,
  formatPath,
  NO_COLORS,
  stringify,
  validatorHint,
} from "./format";
// Primitive validators
export {
  validateArray,
  validateNumber,
  validateNumberInRange,
  validateString,
} from "./primitives";
// Core types
export type {
  ValidationError,
  ValidationErrorCode,
  ValidationResult,
  Validator,
} from "./types";
export { fail, failure, prependPath, success } from "./types";
