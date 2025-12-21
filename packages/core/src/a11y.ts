import type { A11yTree, RenderModel } from "./model";

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
  if (series.length === 0) return `${baseLabel} (empty)`;

  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const v of series) {
    if (!Number.isFinite(v)) continue;
    min = Math.min(min, v);
    max = Math.max(max, v);
  }

  const last = series[series.length - 1] ?? 0;
  if (!Number.isFinite(min) || !Number.isFinite(max)) return baseLabel;

  return `${baseLabel} (min ${formatA11yNumber(min)}, max ${formatA11yNumber(max)}, last ${formatA11yNumber(last)})`;
}

export function a11yLabelWithSegmentsSummary(
  baseLabel: string,
  segments: ReadonlyArray<{ pct: number; name?: string }>,
): string {
  if (segments.length === 0) return `${baseLabel} (empty)`;

  let largest = segments[0];
  for (const seg of segments) {
    if (!largest || seg.pct > largest.pct) largest = seg;
  }

  const largestPct = largest ? Math.round(largest.pct) : 0;
  const largestName = largest?.name?.trim();
  const largestLabel = largestName
    ? `${largestName} ${largestPct}%`
    : `${largestPct}%`;

  return `${baseLabel} (${segments.length} segments, largest ${largestLabel})`;
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
