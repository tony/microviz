/**
 * Universal chart randomization system.
 * Detects microviz embeds in HTML and provides deterministic random data generation.
 */

import { PRESETS } from "./presets";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type MicrovizEmbed = {
  index: number;
  tagName: string;
  data: string | null;
  spec: string | null;
  dataKind: string | null;
  selector: string;
  dataQuote: "'" | '"' | null;
};

export type DataShape =
  | { type: "series"; length: number }
  | { type: "segments"; count: number }
  | { type: "delta" }
  | { type: "value" }
  | { type: "csv"; headers: string[]; rows: number }
  | { type: "unknown" };

export type AttributeUpdate = {
  selector: string;
  attribute: string;
  value: string;
};

export type RandomizationResult = {
  html: string;
  updates: AttributeUpdate[];
  canRandomize: boolean;
};

// ─────────────────────────────────────────────────────────────────────────────
// Seeded RNG (FNV-1a hash → Mulberry32 PRNG)
// ─────────────────────────────────────────────────────────────────────────────

function fnv1aHash(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(initialSeed: number): () => number {
  let state = initialSeed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createRng(seed: string): () => number {
  return mulberry32(fnv1aHash(seed));
}

// ─────────────────────────────────────────────────────────────────────────────
// Module 1: Embed Detection
// ─────────────────────────────────────────────────────────────────────────────

const MICROVIZ_TAG_REGEX = /<(microviz-(?:sparkline|chart|auto))\b([^>]*)>/gi;
const DATA_ATTR_REGEX = /\bdata\s*=\s*(["'])([\s\S]*?)\1/i;
const SPEC_ATTR_REGEX = /\bspec\s*=\s*(["'])([\s\S]*?)\1/i;
const DATA_KIND_ATTR_REGEX = /\bdata-kind\s*=\s*(["'])([\s\S]*?)\1/i;

export function detectEmbeds(html: string): MicrovizEmbed[] {
  const embeds: MicrovizEmbed[] = [];
  const matches = html.matchAll(MICROVIZ_TAG_REGEX);
  let index = 0;

  for (const match of matches) {
    const tagName = match[1].toLowerCase();
    const attrs = match[2];

    const dataMatch = attrs.match(DATA_ATTR_REGEX);
    const specMatch = attrs.match(SPEC_ATTR_REGEX);
    const dataKindMatch = attrs.match(DATA_KIND_ATTR_REGEX);

    embeds.push({
      data: dataMatch ? dataMatch[2] : null,
      dataKind: dataKindMatch ? dataKindMatch[2] : null,
      dataQuote: dataMatch ? (dataMatch[1] as "'" | '"') : null,
      index,
      selector: `${tagName}:nth-of-type(${index + 1})`,
      spec: specMatch ? specMatch[2] : null,
      tagName,
    });

    index++;
  }

  return embeds;
}

// ─────────────────────────────────────────────────────────────────────────────
// Module 2: Data Shape Inference
// ─────────────────────────────────────────────────────────────────────────────

export function inferDataShape(data: string | null | undefined): DataShape {
  if (!data || data.trim() === "") {
    return { type: "unknown" };
  }

  const trimmed = data.trim();

  // Try JSON parse first
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);

      // Array of numbers → series
      if (Array.isArray(parsed) && parsed.every((v) => typeof v === "number")) {
        return { length: parsed.length, type: "series" };
      }

      // Array of objects with pct → segments
      if (
        Array.isArray(parsed) &&
        parsed.length > 0 &&
        typeof parsed[0]?.pct === "number"
      ) {
        return { count: parsed.length, type: "segments" };
      }

      // Object with current/previous → delta
      if (
        typeof parsed === "object" &&
        "current" in parsed &&
        "previous" in parsed
      ) {
        return { type: "delta" };
      }

      // Object with value → value
      if (typeof parsed === "object" && "value" in parsed) {
        return { type: "value" };
      }
    } catch {
      // Not valid JSON, continue to other checks
    }
  }

  // CSV detection (has newlines and comma-separated values)
  if (trimmed.includes("\n")) {
    const lines = trimmed.split("\n").filter((l) => l.trim());
    if (lines.length >= 2 && lines[0].includes(",")) {
      const headers = lines[0].split(",").map((h) => h.trim());
      return { headers, rows: lines.length - 1, type: "csv" };
    }
  }

  // Comma-separated numbers → series
  const commaSplit = trimmed.split(",").map((s) => s.trim());
  if (
    commaSplit.length >= 2 &&
    commaSplit.every((s) => !Number.isNaN(Number(s)))
  ) {
    return { length: commaSplit.length, type: "series" };
  }

  return { type: "unknown" };
}

// ─────────────────────────────────────────────────────────────────────────────
// Module 3: Random Data Generation
// ─────────────────────────────────────────────────────────────────────────────

const SEGMENT_COLORS = [
  "#6366f1",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#14b8a6",
];

export function generateRandomData(
  shape: DataShape,
  seed: string,
): string | null {
  const rng = createRng(seed);

  switch (shape.type) {
    case "series": {
      const values = Array.from({ length: shape.length }, () =>
        Math.round(rng() * 100),
      );
      return values.join(", ");
    }

    case "segments": {
      // Generate random percentages that sum to 100
      const rawValues = Array.from({ length: shape.count }, () => rng());
      const sum = rawValues.reduce((a, b) => a + b, 0);
      const segments = rawValues.map((v, i) => ({
        color: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
        pct: Math.round((v / sum) * 100),
      }));

      // Adjust last segment to ensure sum is exactly 100
      const totalPct = segments.reduce((a, s) => a + s.pct, 0);
      if (totalPct !== 100 && segments.length > 0) {
        segments[segments.length - 1].pct += 100 - totalPct;
      }

      return JSON.stringify(segments);
    }

    case "delta": {
      const current = Math.round(rng() * 100);
      const previous = Math.round(rng() * 100);
      const max = Math.max(current, previous) + Math.round(rng() * 50);
      return JSON.stringify({ current, max, previous });
    }

    case "value": {
      const max = Math.round(50 + rng() * 50);
      const value = Math.round(rng() * max);
      return JSON.stringify({ max, value });
    }

    case "csv": {
      const { headers, rows } = shape;
      const lines = [headers.join(",")];

      for (let i = 0; i < rows; i++) {
        const row = headers.map((h) => {
          if (h === "pct") return String(Math.round(rng() * 100));
          if (h === "color") return SEGMENT_COLORS[i % SEGMENT_COLORS.length];
          if (h === "name") return `Item ${i + 1}`;
          return String(Math.round(rng() * 100));
        });
        lines.push(row.join(","));
      }

      return lines.join("\n");
    }

    case "unknown":
      return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Module 4: Attribute Serialization (Quote Preservation)
// ─────────────────────────────────────────────────────────────────────────────

export function replaceDataAttribute(
  html: string,
  newValue: string,
  embedIndex: number,
): string {
  let currentIndex = 0;

  return html.replace(MICROVIZ_TAG_REGEX, (fullMatch, tagName, attrs) => {
    if (currentIndex++ !== embedIndex) {
      return fullMatch;
    }

    // Find and replace the data attribute while preserving quote style
    const newAttrs = attrs.replace(
      DATA_ATTR_REGEX,
      (_: string, quote: string) => {
        return `data=${quote}${newValue}${quote}`;
      },
    );

    return `<${tagName}${newAttrs}>`;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Module 5: Reactive Updates
// ─────────────────────────────────────────────────────────────────────────────

export function generateReactiveUpdates(
  html: string,
  seed: string,
): AttributeUpdate[] {
  const embeds = detectEmbeds(html);
  const updates: AttributeUpdate[] = [];

  for (const embed of embeds) {
    const shape = inferDataShape(embed.data);
    if (shape.type === "unknown") continue;

    // Sub-seed by index for different values per embed
    const subSeed = `${seed}-${embed.index}`;
    const newValue = generateRandomData(shape, subSeed);

    if (newValue) {
      updates.push({
        attribute: "data",
        selector: embed.selector,
        value: newValue,
      });
    }
  }

  return updates;
}

// ─────────────────────────────────────────────────────────────────────────────
// Module 6: State Shorthands
// ─────────────────────────────────────────────────────────────────────────────

export function canRandomize(html: string): boolean {
  const embeds = detectEmbeds(html);
  return embeds.some((embed) => {
    const shape = inferDataShape(embed.data);
    return shape.type !== "unknown";
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Module 7: Preset Matching
// ─────────────────────────────────────────────────────────────────────────────

export function matchPreset(code: string): string | null {
  const preset = PRESETS.find((p) => p.code === code);
  return preset?.id ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Module 8: Full Integration
// ─────────────────────────────────────────────────────────────────────────────

export function applyRandomData(
  html: string,
  seed: string,
): RandomizationResult {
  const embeds = detectEmbeds(html);
  const updates: AttributeUpdate[] = [];
  let result = html;

  for (const embed of embeds) {
    const shape = inferDataShape(embed.data);
    if (shape.type === "unknown") continue;

    const subSeed = `${seed}-${embed.index}`;
    const newValue = generateRandomData(shape, subSeed);

    if (newValue) {
      result = replaceDataAttribute(result, newValue, embed.index);
      updates.push({
        attribute: "data",
        selector: embed.selector,
        value: newValue,
      });
    }
  }

  return {
    canRandomize: updates.length > 0,
    html: result,
    updates,
  };
}
