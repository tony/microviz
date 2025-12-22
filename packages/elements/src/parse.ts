export function parseNumber(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function parseOptionalNumber(value: string | null): number | undefined {
  if (value === null) return undefined;
  const raw = value.trim();
  if (raw === "") return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

export function parseBoolean(value: string | null, fallback: boolean): boolean {
  if (value === null) return fallback;
  const raw = value.trim().toLowerCase();
  if (raw === "") return true;
  if (raw === "true" || raw === "1" || raw === "yes" || raw === "on")
    return true;
  if (raw === "false" || raw === "0" || raw === "no" || raw === "off")
    return false;
  return fallback;
}

/**
 * Parse a data attribute into a number array.
 *
 * Supports multiple formats for vibe-coding / sandbox friendliness:
 * - JSON array: `[1, 2, 3]`
 * - Comma-separated: `1,2,3` or `1, 2, 3`
 * - Space-separated: `1 2 3`
 * - Mixed delimiters: `1, 2 3` (comma + space)
 */
export function parseNumberArray(value: string | null): number[] {
  if (!value) return [];

  const trimmed = value.trim();
  if (!trimmed) return [];

  // Try JSON first (handles arrays with brackets)
  if (trimmed.startsWith("[")) {
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(
        (v): v is number => typeof v === "number" && Number.isFinite(v),
      );
    } catch {
      // Fall through to delimiter parsing
    }
  }

  // Try comma/space-separated (lenient parsing for vibe coding)
  // Matches: "1,2,3" or "1 2 3" or "1, 2, 3" or "-1.5, 2.5, 3"
  const numbers = trimmed
    .split(/[\s,]+/)
    .filter(Boolean)
    .map(Number)
    .filter(Number.isFinite);

  return numbers;
}

export type BitfieldSegmentInput = {
  name?: string;
  pct: number;
  color: string;
};

export function parseBitfieldSegments(
  value: string | null,
): BitfieldSegmentInput[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    const segments: BitfieldSegmentInput[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const pct = (item as { pct?: unknown }).pct;
      const color = (item as { color?: unknown }).color;
      const name = (item as { name?: unknown }).name;

      if (typeof pct !== "number" || !Number.isFinite(pct)) continue;
      if (typeof color !== "string" || color.length === 0) continue;

      segments.push({
        color,
        name: typeof name === "string" ? name : undefined,
        pct,
      });
    }
    return segments;
  } catch {
    return [];
  }
}
