import type {
  A11yItem,
  A11ySegmentsSummary,
  A11ySeriesSummary,
  A11ySummary,
  A11yTree,
  RenderModel,
} from "./model";

const MAX_A11Y_ITEMS = 24;

export type A11ySeriesItemOptions = {
  idPrefix?: string;
  labelPrefix?: string;
  maxItems?: number;
  valueText?: (value: number, index: number) => string | undefined;
};

export type A11ySegmentItemOptions = {
  idPrefix?: string;
  labelFallback?: string;
  maxItems?: number;
  valueText?: (pct: number, index: number) => string | undefined;
};

function formatA11yNumber(value: number): string {
  if (!Number.isFinite(value)) return "0";
  const roundedInt = Math.round(value);
  if (Math.abs(value - roundedInt) < 1e-6) return String(roundedInt);
  return String(Math.round(value * 100) / 100);
}

export function a11yLabelWithSeriesSummary(
  baseLabel: string,
  series: ReadonlyArray<number>,
): string {
  const summary = summarizeSeries(series);
  if (!summary || summary.count === 0) return `${baseLabel} (empty)`;
  const { min, max, last } = summary;
  if (min === undefined || max === undefined || last === undefined) {
    return baseLabel;
  }
  if (
    !Number.isFinite(min) ||
    !Number.isFinite(max) ||
    !Number.isFinite(last)
  ) {
    return baseLabel;
  }

  return `${baseLabel} (min ${formatA11yNumber(min)}, max ${formatA11yNumber(max)}, last ${formatA11yNumber(last)})`;
}

export function a11yLabelWithSegmentsSummary(
  baseLabel: string,
  segments: ReadonlyArray<{ pct: number; name?: string }>,
): string {
  const summary = summarizeSegments(segments);
  if (!summary || summary.count === 0) return `${baseLabel} (empty)`;

  const largestPct = Math.round(summary.largestPct ?? 0);
  const largestName = summary.largestName?.trim();
  const largestLabel = largestName
    ? `${largestName} ${largestPct}%`
    : `${largestPct}%`;

  return `${baseLabel} (${summary.count} segments, largest ${largestLabel})`;
}

export function computeA11ySummary(
  model: RenderModel,
  label = "Chart",
): A11yTree {
  const textCount = model.marks.filter((m) => m.type === "text").length;
  const markCount = model.marks.length;
  return {
    label: `${label} (${markCount} marks, ${textCount} text)`,
    role: "img",
  };
}

function summarizeSeries(
  series: ReadonlyArray<number>,
): A11ySeriesSummary | null {
  if (series.length === 0) return { count: 0, kind: "series" };

  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  let first = Number.NaN;
  let last = Number.NaN;

  for (const v of series) {
    if (!Number.isFinite(v)) continue;
    if (!Number.isFinite(first)) first = v;
    last = v;
    min = Math.min(min, v);
    max = Math.max(max, v);
  }

  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return { count: series.length, kind: "series" };
  }

  const trend =
    Number.isFinite(first) && Number.isFinite(last)
      ? last > first
        ? "up"
        : last < first
          ? "down"
          : "flat"
      : undefined;

  return {
    count: series.length,
    kind: "series",
    last,
    max,
    min,
    trend,
  };
}

function summarizeSegments(
  segments: ReadonlyArray<{ pct: number; name?: string }>,
): A11ySegmentsSummary | null {
  if (segments.length === 0) return { count: 0, kind: "segments" };

  let largestPct = Number.NEGATIVE_INFINITY;
  let largestName: string | undefined;
  let count = 0;
  for (const seg of segments) {
    if (!Number.isFinite(seg.pct)) continue;
    count += 1;
    if (seg.pct > largestPct) {
      largestPct = seg.pct;
      largestName = seg.name;
    }
  }

  if (count === 0) return { count: 0, kind: "segments" };

  return {
    count,
    kind: "segments",
    largestName,
    largestPct,
  };
}

export function inferA11ySummary(normalized: unknown): A11ySummary | undefined {
  if (!normalized || typeof normalized !== "object") return undefined;
  const record = normalized as Record<string, unknown>;

  const series = record.series;
  if (Array.isArray(series)) {
    const summary = summarizeSeries(series as number[]);
    if (summary) return summary;
  }

  const segments = record.segments;
  if (Array.isArray(segments)) {
    const summary = summarizeSegments(
      segments as ReadonlyArray<{ pct: number; name?: string }>,
    );
    if (summary) return summary;
  }

  return undefined;
}

function sanitizeItemLabel(label: string, fallback: string): string {
  const trimmed = label.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function seriesItems(
  series: ReadonlyArray<number>,
  options: A11ySeriesItemOptions = {},
): A11yItem[] {
  const items: A11yItem[] = [];
  const maxItems = options.maxItems ?? MAX_A11Y_ITEMS;
  const idPrefix = options.idPrefix ?? "series";
  const labelPrefix = options.labelPrefix ?? "Value";
  for (let i = 0; i < series.length && items.length < maxItems; i += 1) {
    const value = series[i];
    if (!Number.isFinite(value)) continue;
    items.push({
      id: `${idPrefix}-${i}`,
      label: `${labelPrefix} ${i + 1}`,
      rank: i + 1,
      value,
      valueText: options.valueText?.(value, i),
    });
  }
  return items;
}

function segmentItems(
  segments: ReadonlyArray<{ pct?: number; name?: string }>,
  options: A11ySegmentItemOptions = {},
): A11yItem[] {
  const items: A11yItem[] = [];
  const maxItems = options.maxItems ?? MAX_A11Y_ITEMS;
  const idPrefix = options.idPrefix ?? "segment";
  const labelFallback = options.labelFallback ?? "Segment";
  for (let i = 0; i < segments.length && items.length < maxItems; i += 1) {
    const seg = segments[i];
    if (!seg || !Number.isFinite(seg.pct)) continue;
    const pct = seg.pct ?? 0;
    items.push({
      id: `${idPrefix}-${i}`,
      label: sanitizeItemLabel(seg.name ?? "", `${labelFallback} ${i + 1}`),
      rank: i + 1,
      value: pct,
      valueText: options.valueText?.(pct, i) ?? `${Math.round(pct)}%`,
    });
  }
  return items;
}

export function inferA11yItems(normalized: unknown): A11yItem[] | undefined {
  if (!normalized || typeof normalized !== "object") return undefined;
  const record = normalized as Record<string, unknown>;

  const series = record.series;
  if (Array.isArray(series)) {
    const items = seriesItems(series as number[]);
    return items.length > 0 ? items : undefined;
  }

  const segments = record.segments;
  if (Array.isArray(segments)) {
    const items = segmentItems(
      segments as ReadonlyArray<{ pct?: number; name?: string }>,
    );
    return items.length > 0 ? items : undefined;
  }

  return undefined;
}

export function a11yItemsForSeries(
  series: ReadonlyArray<number>,
  options?: A11ySeriesItemOptions,
): A11yItem[] {
  return seriesItems(series, options);
}

export function a11yItemsForSegments(
  segments: ReadonlyArray<{ pct?: number; name?: string }>,
  options?: A11ySegmentItemOptions,
): A11yItem[] {
  return segmentItems(segments, options);
}
