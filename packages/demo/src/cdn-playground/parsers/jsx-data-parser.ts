/**
 * Parse data values from JSX/Solid code for live preview updates.
 * Similar to randomization.ts:detectEmbeds() but for JSX syntax.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type ParsedDataResult = {
  success: boolean;
  /** Map of chart index (as string) to parsed data value */
  data: Record<string, unknown>;
  /** Parse errors if any */
  errors?: ParseError[];
};

export type ParseError = {
  index: number;
  message: string;
  raw: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Regex Patterns
// ─────────────────────────────────────────────────────────────────────────────

// Matches data={...} with balanced braces (handles nested objects/arrays)
// Uses a non-greedy approach with lookahead for the closing pattern
const DATA_PROP_CURLY_REGEX =
  /\bdata=\{((?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*)\}/g;

// Matches data="..." or data='...'
const DATA_PROP_STRING_REGEX = /\bdata=(["'])((?:\\.|[^\\])*?)\1/g;

// ─────────────────────────────────────────────────────────────────────────────
// Safe Literal Parser
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Safely parse a JavaScript literal (array or object) without eval.
 * Uses JSON.parse with preprocessing to handle JS object literal syntax.
 */
function safeParseLiteral(code: string): unknown {
  const trimmed = code.trim();

  // Handle simple array of numbers: [1, 2, 3]
  if (trimmed.startsWith("[")) {
    try {
      // Try direct JSON parse first (works for arrays of numbers)
      return JSON.parse(trimmed);
    } catch {
      // Try preprocessing for JS syntax
      return parseJsLiteral(trimmed);
    }
  }

  // Handle objects: { current: 10, previous: 5 }
  if (trimmed.startsWith("{")) {
    return parseJsLiteral(trimmed);
  }

  // Handle bare numbers
  const num = Number(trimmed);
  if (!Number.isNaN(num)) {
    return num;
  }

  throw new Error(`Cannot parse literal: ${trimmed.slice(0, 50)}`);
}

/**
 * Parse JS object/array literal by converting to JSON.
 */
function parseJsLiteral(code: string): unknown {
  let json = code;

  // Remove trailing commas: [1, 2, 3,] → [1, 2, 3]
  json = json.replace(/,(\s*[}\]])/g, "$1");

  // Quote unquoted property keys: { foo: 1 } → { "foo": 1 }
  // Match: start of object/after comma, whitespace, identifier, colon
  json = json.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)(\s*:)/g, '$1"$2"$3');

  // Handle hex colors without quotes: #6366f1 → "#6366f1"
  // This is tricky because # could be in a string already
  // Only match unquoted hex colors after colons
  json = json.replace(/:\s*(#[a-fA-F0-9]{3,8})(\s*[,}\]])/g, ': "$1"$2');

  try {
    return JSON.parse(json);
  } catch (e) {
    throw new Error(
      `JSON parse failed: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
}

/**
 * Parse comma-separated string into array of numbers.
 * "10, 20, 30" → [10, 20, 30]
 */
function parseCommaSeparatedNumbers(str: string): number[] | null {
  const parts = str.split(",").map((s) => s.trim());
  if (parts.length === 0) return null;

  const numbers: number[] = [];
  for (const part of parts) {
    const num = Number(part);
    if (Number.isNaN(num)) return null;
    numbers.push(num);
  }
  return numbers;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Parser
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse JSX/Solid code to extract data values from microviz components.
 *
 * Supports:
 * - data={[1, 2, 3]} - array literals
 * - data={{ current: 10, previous: 5, max: 100 }} - object literals
 * - data="10, 20, 30" - comma-separated strings
 * - data={[{pct: 60, color: "#6366f1"}, ...]} - segment arrays
 *
 * Returns a map of chart index to parsed data, allowing preview panes
 * to use the parsed data instead of generated data.
 */
export function parseJsxData(code: string): ParsedDataResult {
  const data: Record<string, unknown> = {};
  const errors: ParseError[] = [];
  let index = 0;

  // Process curly brace data props: data={...}
  const curlyMatches = code.matchAll(DATA_PROP_CURLY_REGEX);
  for (const match of curlyMatches) {
    const raw = match[1];
    try {
      const parsed = safeParseLiteral(raw);
      data[String(index)] = parsed;
    } catch (e) {
      errors.push({
        index,
        message: e instanceof Error ? e.message : String(e),
        raw,
      });
    }
    index++;
  }

  // Process string data props: data="..."
  const stringMatches = code.matchAll(DATA_PROP_STRING_REGEX);
  for (const match of stringMatches) {
    const raw = match[2];
    try {
      // Try to parse as comma-separated numbers first
      const numbers = parseCommaSeparatedNumbers(raw);
      if (numbers) {
        data[String(index)] = numbers;
      } else {
        // Keep as string (could be CSV or other format)
        data[String(index)] = raw;
      }
    } catch (e) {
      errors.push({
        index,
        message: e instanceof Error ? e.message : String(e),
        raw,
      });
    }
    index++;
  }

  return {
    data,
    errors: errors.length > 0 ? errors : undefined,
    success: errors.length === 0,
  };
}

/**
 * Check if a code string contains any data props that could be parsed.
 */
export function hasDataProps(code: string): boolean {
  DATA_PROP_CURLY_REGEX.lastIndex = 0;
  DATA_PROP_STRING_REGEX.lastIndex = 0;
  return DATA_PROP_CURLY_REGEX.test(code) || DATA_PROP_STRING_REGEX.test(code);
}
