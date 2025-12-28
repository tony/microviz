import type { ChartType } from "./charts/registry";
import type { ChartSpec } from "./compute";

export type InferredValueType =
  | "quantitative"
  | "temporal"
  | "nominal"
  | "unknown";

export type InferredSeriesType = {
  kind: InferredValueType;
  sampleCount: number;
  numericCount: number;
  temporalCount: number;
  nominalCount: number;
  unknownCount: number;
};

const NUMERIC_RE = /^[-+]?(\d+(\.\d*)?|\.\d+)(e[-+]?\d+)?$/i;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}/;
const TIME_RE = /\d{2}:\d{2}/;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function coerceNumber(value: unknown): number | null {
  if (isFiniteNumber(value)) return value;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!NUMERIC_RE.test(trimmed)) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function looksTemporalString(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (!ISO_DATE_RE.test(trimmed) && !TIME_RE.test(trimmed)) return false;
  return Number.isFinite(Date.parse(trimmed));
}

export function inferValueType(value: unknown): InferredValueType {
  if (isFiniteNumber(value)) return "quantitative";
  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? "temporal" : "unknown";
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "unknown";
    if (NUMERIC_RE.test(trimmed)) return "quantitative";
    if (looksTemporalString(trimmed)) return "temporal";
    return "nominal";
  }
  if (typeof value === "boolean") return "nominal";
  if (value === null || value === undefined) return "unknown";
  return "unknown";
}

export function inferSeriesType(
  values: ReadonlyArray<unknown>,
  sampleLimit = 200,
): InferredSeriesType {
  const sample = values.slice(0, Math.max(0, sampleLimit));
  let numericCount = 0;
  let temporalCount = 0;
  let nominalCount = 0;
  let unknownCount = 0;

  for (const value of sample) {
    const kind = inferValueType(value);
    switch (kind) {
      case "quantitative":
        numericCount += 1;
        break;
      case "temporal":
        temporalCount += 1;
        break;
      case "nominal":
        nominalCount += 1;
        break;
      default:
        unknownCount += 1;
        break;
    }
  }

  let kind: InferredValueType = "unknown";
  if (numericCount > 0) kind = "quantitative";
  if (temporalCount > numericCount && temporalCount >= nominalCount)
    kind = "temporal";
  if (nominalCount > numericCount && nominalCount > temporalCount)
    kind = "nominal";

  return {
    kind,
    nominalCount,
    numericCount,
    sampleCount: sample.length,
    temporalCount,
    unknownCount,
  };
}

type Segment = { pct: number; color: string; name?: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function coerceNumberArray(value: unknown): number[] | null {
  if (!Array.isArray(value)) return null;
  const series: number[] = [];
  for (const entry of value) {
    const num = coerceNumber(entry);
    if (num === null) return null;
    series.push(num);
  }
  return series;
}

function coerceSegmentArray(value: unknown): Segment[] | null {
  if (!Array.isArray(value)) return null;
  const segments: Segment[] = [];
  for (const entry of value) {
    if (!isRecord(entry)) return null;
    const pct = coerceNumber(entry.pct);
    const color = typeof entry.color === "string" ? entry.color : null;
    if (pct === null || !color) return null;
    segments.push({
      color,
      name: typeof entry.name === "string" ? entry.name : undefined,
      pct,
    });
  }
  return segments;
}

export type InferenceReason =
  | "number-array"
  | "segment-array"
  | "segments-field"
  | "bullet-delta"
  | "dumbbell"
  | "bar"
  | "series-object"
  | "fallback";

export type InferredSpec = {
  spec: ChartSpec;
  data: unknown;
  reason: InferenceReason;
};

export type InferSpecOptions = {
  fallbackType?: ChartType;
};

export function inferSpec(
  input: unknown,
  options: InferSpecOptions = {},
): InferredSpec | null {
  const numberArray = coerceNumberArray(input);
  if (numberArray) {
    return {
      data: numberArray,
      reason: "number-array",
      spec: { type: "sparkline" },
    };
  }

  const segments = coerceSegmentArray(input);
  if (segments) {
    return {
      data: segments,
      reason: "segment-array",
      spec: { type: "donut" },
    };
  }

  if (isRecord(input)) {
    if ("segments" in input) {
      const segmentField = coerceSegmentArray(input.segments);
      if (segmentField) {
        return {
          data: segmentField,
          reason: "segments-field",
          spec: { type: "donut" },
        };
      }
    }

    const current = coerceNumber(input.current);
    const previous = coerceNumber(input.previous);
    if (current !== null && previous !== null) {
      const max = coerceNumber(input.max ?? null);
      return {
        data: { current, max: max ?? undefined, previous },
        reason: "bullet-delta",
        spec: { type: "bullet-delta" },
      };
    }

    const target = coerceNumber(input.target);
    if (current !== null && target !== null) {
      const max = coerceNumber(input.max ?? null);
      return {
        data: { current, max: max ?? undefined, target },
        reason: "dumbbell",
        spec: { type: "dumbbell" },
      };
    }

    const value = coerceNumber(input.value);
    if (value !== null) {
      const max = coerceNumber(input.max ?? null);
      return {
        data: { max: max ?? undefined, value },
        reason: "bar",
        spec: { type: "bar" },
      };
    }

    const series = coerceNumberArray(input.series);
    if (series) {
      const opacities = coerceNumberArray(input.opacities);
      return {
        data: { opacities: opacities ?? undefined, series },
        reason: "series-object",
        spec: { type: "histogram" },
      };
    }
  }

  if (options.fallbackType) {
    return {
      data: input,
      reason: "fallback",
      spec: { type: options.fallbackType } as ChartSpec,
    };
  }

  return null;
}
