/**
 * Core validation types.
 * Inspired by zod's Result pattern but tailored for chart validation.
 */

/**
 * Validation mode for chart elements.
 * - "normal": Validate after parsing (default)
 * - "strict": Warn about dropped/coerced values during parsing
 * - "skip": No validation (performance, trusted data)
 */
export type ValidationMode = "normal" | "strict" | "skip";

/**
 * Validation error codes.
 * Each code has a specific meaning for tooling and error handling.
 */
export type ValidationErrorCode =
  | "INVALID_TYPE" // Wrong JavaScript type
  | "INVALID_VALUE" // Right type but invalid value (NaN, Infinity)
  | "INVALID_DATA_SHAPE" // Array of wrong shape for chart type
  | "MISSING_VALUE" // undefined or null where value required
  | "MISSING_FIELD" // Object missing required property
  | "MISSING_DATA" // Chart data attribute missing
  | "OUT_OF_RANGE" // Number outside valid range
  | "UNKNOWN_CHART_TYPE"; // Spec type not in registry

/**
 * A single validation error with full context.
 * Designed for humans, LLMs, and debuggers.
 */
export type ValidationError = {
  /** Error classification for tooling */
  code: ValidationErrorCode;
  /** Human-readable error message */
  message: string;
  /** Path to the error location (e.g., ["data", 0, "pct"]) */
  path: (string | number)[];
  /** What was expected (for error messages) */
  expected: string;
  /** What was received (stringified) */
  received: string;
  /** Actionable fix suggestion (copy-pasteable when possible) */
  hint: string;
  /** Copy-pasteable HTML example showing correct usage */
  example?: string;
};

/**
 * Validation result - either success with data or failure with errors.
 * Pattern from zod's safeParse.
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: ValidationError[] };

/**
 * Validator function signature.
 * Takes unknown input and returns typed result.
 */
export type Validator<T> = (input: unknown) => ValidationResult<T>;

/**
 * Helper to create a success result.
 */
export function success<T>(data: T): ValidationResult<T> {
  return { data, success: true };
}

/**
 * Helper to create a failure result.
 */
export function failure(errors: ValidationError[]): ValidationResult<never> {
  return { errors, success: false };
}

/**
 * Helper to create a single-error failure.
 */
export function fail(error: ValidationError): ValidationResult<never> {
  return { errors: [error], success: false };
}

/**
 * Prepend a path segment to all errors in a result.
 * Used when validating nested structures.
 */
export function prependPath<T>(
  result: ValidationResult<T>,
  segment: string | number,
): ValidationResult<T> {
  if (result.success) return result;
  return {
    errors: result.errors.map((e) => ({
      ...e,
      path: [segment, ...e.path],
    })),
    success: false,
  };
}
