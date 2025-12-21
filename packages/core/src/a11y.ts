import type { A11ySummary, A11yTree, RenderModel } from "./model";

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
  if (
    !Number.isFinite(summary.min) ||
    !Number.isFinite(summary.max) ||
    !Number.isFinite(summary.last)
  ) {
    return baseLabel;
  }

  return `${baseLabel} (min ${formatA11yNumber(summary.min)}, max ${formatA11yNumber(summary.max)}, last ${formatA11yNumber(summary.last)})`;
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

function summarizeSeries(series: ReadonlyArray<number>): A11ySummary | null {
  if (series.length === 0) return { kind: "series", count: 0 };

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
    return { kind: "series", count: series.length };
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
    kind: "series",
    count: series.length,
    last,
    max,
    min,
    trend,
  };
}

function summarizeSegments(
  segments: ReadonlyArray<{ pct: number; name?: string }>,
): A11ySummary | null {
  if (segments.length === 0) return { kind: "segments", count: 0 };

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

  if (count === 0) return { kind: "segments", count: 0 };

  return {
    kind: "segments",
    count,
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
