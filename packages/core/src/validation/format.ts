/**
 * Vitest-inspired error formatting utilities.
 * Provides semantic coloring and graceful stringification.
 */

import type { ValidationError } from "./types";

/**
 * ANSI color codes for semantic highlighting.
 * Like vitest's printReceived/printExpected pattern.
 */
export const COLORS = {
  /** Bold - emphasis */
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
  /** Green - what was expected */
  expected: (s: string) => `\x1b[32m${s}\x1b[0m`,
  /** Dim - hints and suggestions */
  hint: (s: string) => `\x1b[2m${s}\x1b[0m`,
  /** Cyan - paths and locations */
  path: (s: string) => `\x1b[36m${s}\x1b[0m`,
  /** Red - what was received */
  received: (s: string) => `\x1b[31m${s}\x1b[0m`,
  /** Reset - clear formatting */
  reset: "\x1b[0m",
  /** Yellow - warnings */
  warning: (s: string) => `\x1b[33m${s}\x1b[0m`,
};

/**
 * No-color versions for environments without ANSI support.
 */
export const NO_COLORS = {
  bold: (s: string) => s,
  expected: (s: string) => s,
  hint: (s: string) => s,
  path: (s: string) => s,
  received: (s: string) => s,
  reset: "",
  warning: (s: string) => s,
};

/**
 * Graceful stringify that never throws.
 * Like vitest's display.ts pattern - handles circular refs, toJSON errors, etc.
 */
export function stringify(value: unknown, maxLength = 200): string {
  try {
    if (value === undefined) return "undefined";
    if (value === null) return "null";
    if (typeof value === "string") return JSON.stringify(value);
    if (typeof value === "number") return String(value);
    if (typeof value === "boolean") return String(value);
    if (typeof value === "function") return "[Function]";
    if (typeof value === "symbol") return value.toString();

    // Try JSON stringify with truncation
    const json = JSON.stringify(value);
    if (json.length > maxLength) {
      return `${json.slice(0, maxLength)}...`;
    }
    return json;
  } catch {
    // Fallback for circular refs, toJSON errors, etc.
    try {
      return String(value);
    } catch {
      return "[Unserializable]";
    }
  }
}

/**
 * Format a path array as a dot-notation string.
 */
export function formatPath(path: (string | number)[]): string {
  if (path.length === 0) return "root";
  return path
    .map((p, i) => {
      if (typeof p === "number") return `[${p}]`;
      if (i === 0) return p;
      return `.${p}`;
    })
    .join("");
}

/**
 * Format a single error for console output (human-readable).
 */
export function formatError(
  error: ValidationError,
  colors = NO_COLORS,
): string {
  const pathStr = colors.path(formatPath(error.path));
  const lines = [
    `❌ ${error.message}`,
    `   Path: ${pathStr}`,
    `   Expected: ${colors.expected(error.expected)}`,
    `   Received: ${colors.received(error.received)}`,
  ];

  if (error.hint) {
    lines.push(`   💡 ${colors.hint(error.hint)}`);
  }

  return lines.join("\n");
}

/**
 * Format multiple errors for console output.
 */
export function formatErrors(
  errors: ValidationError[],
  colors = NO_COLORS,
): string {
  if (errors.length === 0) return "No errors";
  if (errors.length === 1) return formatError(errors[0], colors);

  return errors.map((e) => formatError(e, colors)).join("\n\n");
}

/**
 * Format errors for LLM consumption.
 * Structured, copy-pasteable fixes.
 */
export function formatForLLM(errors: ValidationError[]): string {
  return errors
    .map((e) => {
      const path = formatPath(e.path);
      const location = path !== "root" ? ` at ${path}` : "";
      return `Error${location}: ${e.message}. Fix: ${e.hint}`;
    })
    .join("\n");
}

/**
 * Format errors for vibecoders.
 * Emoji-rich, encouraging, friendly.
 */
export function formatForVibecoder(errors: ValidationError[]): string {
  if (errors.length === 0) return "✨ All good!";

  return errors
    .map((e) => {
      return `🚨 Oops! ${e.message}\n✨ Quick fix: ${e.hint}`;
    })
    .join("\n\n");
}

/**
 * Validator hint - shows validator name with colored input.
 * Like vitest's matcherHint().
 */
export function validatorHint(
  name: string,
  received: string,
  colors = NO_COLORS,
): string {
  return `${name}(${colors.received(received)})`;
}
