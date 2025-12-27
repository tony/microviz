import {
  allocateUnitsByPct,
  clamp,
  compressRuns,
  expandColorsByCounts,
  interleaveCounts,
} from "./utils/math";

export interface MicrovizPoint {
  x: number;
  y: number;
}

export interface MicrovizSegment {
  name: string;
  pct: number;
  color: string;
}

export interface MicrovizPercentageSlice {
  name: string;
  percentage: number;
  color: string;
}

export interface MicrovizColorCell {
  key: string;
  color: string;
}

export { clamp };

export function rankByPctDesc(
  data: readonly MicrovizSegment[],
): MicrovizSegment[] {
  return [...data].sort(
    (a, b) => b.pct - a.pct || a.name.localeCompare(b.name),
  );
}

// Largest-remainder allocation: discrete units sum exactly to totalUnits.
export function allocateUnits(
  data: readonly MicrovizSegment[],
  totalUnits: number,
): number[] {
  return allocateUnitsByPct(data, totalUnits, { key: (seg) => seg.name });
}

export function expandColors(
  data: readonly MicrovizSegment[],
  counts: readonly number[],
): MicrovizColorCell[] {
  return expandColorsByCounts(data, counts, {
    key: (seg, _segIdx, index) => `${seg.name}-${index}`,
  });
}

// Var-safe fade using color-mix
export function fade(color: string, pct: number): string {
  return `color-mix(in oklch, ${color} ${pct}%, transparent)`;
}

export function pathFromSeries(
  series: readonly number[],
  w = 200,
  h = 32,
  pad = 3,
): { d: string; points: MicrovizPoint[] } {
  const n = series.length;
  if (n === 0) return { d: "", points: [] };
  const x0 = pad;
  const x1 = w - pad;
  const y0 = pad;
  const y1 = h - pad;
  const dx = n > 1 ? (x1 - x0) / (n - 1) : 0;
  const points: MicrovizPoint[] = series.map((v, i) => ({
    x: x0 + dx * i,
    y: y1 - (v / 100) * (y1 - y0),
  }));
  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 1; i < points.length; i++)
    d += ` L ${points[i].x.toFixed(2)} ${points[i].y.toFixed(2)}`;
  return { d, points };
}

export function areaPathFromSeries(
  series: readonly number[],
  w = 200,
  h = 32,
  pad = 3,
): { area: string; points: MicrovizPoint[] } {
  const { d, points } = pathFromSeries(series, w, h, pad);
  if (points.length === 0) return { area: "", points };
  const bottom = h - pad;
  const area = `${d} L ${points[points.length - 1].x.toFixed(2)} ${bottom.toFixed(2)} L ${points[0].x.toFixed(2)} ${bottom.toFixed(2)} Z`;
  return { area, points };
}

export function seriesMinMax(
  series: readonly number[],
  bandSeed: number,
): { min: number[]; max: number[] } {
  const min: number[] = [];
  const max: number[] = [];
  for (let i = 0; i < series.length; i++) {
    const wobble =
      6 + 4 * (0.5 + 0.5 * Math.sin((i + 1) * 0.65 + (bandSeed % 71) * 0.013));
    min.push(clamp((series[i] ?? 0) - wobble, 0, 100));
    max.push(clamp((series[i] ?? 0) + wobble, 0, 100));
  }
  return { max, min };
}

export function normalizeSlices(
  slices: readonly MicrovizPercentageSlice[],
): MicrovizPercentageSlice[] {
  const total = slices.reduce((sum, s) => sum + s.percentage, 0);
  if (total === 0) return [...slices];
  return slices.map((s) => ({
    ...s,
    percentage: (s.percentage / total) * 100,
  }));
}

// Largest Remainder Method - ensures slots sum exactly to target
export function largestRemainderAllocation(
  slices: readonly MicrovizPercentageSlice[],
  totalSlots: number,
): MicrovizColorCell[] {
  const parts = slices.map((s) => ({
    color: s.color,
    dec: ((s.percentage / 100) * totalSlots) % 1,
    int: Math.floor((s.percentage / 100) * totalSlots),
    name: s.name,
    raw: (s.percentage / 100) * totalSlots,
  }));

  const currentSum = parts.reduce((acc, curr) => acc + curr.int, 0);
  const deficit = totalSlots - currentSum;

  const sorted = [...parts].sort((a, b) => b.dec - a.dec);
  for (let i = 0; i < deficit && i < sorted.length; i++) sorted[i].int++;

  return parts.flatMap((p, partIdx) =>
    Array.from({ length: p.int }, (_, i) => ({
      color: p.color,
      key: `${p.name}-${partIdx}-${i}`,
    })),
  );
}

export { compressRuns, interleaveCounts };
export {
  createModelIdAllocator,
  type ModelIdAllocator,
  type ModelMergeMode,
  patchRenderModel,
  type RenderModelPatch,
  type RenderModelPatchOptions,
} from "./overlays";

export interface MicrovizPixelSegment extends MicrovizPercentageSlice {
  start: number;
  len: number;
}

export function buildPixelSegments(
  slices: readonly MicrovizPercentageSlice[],
  totalPx: number,
  gapPx = 0,
  minPx = 1,
): MicrovizPixelSegment[] {
  const normalized = normalizeSlices(slices);
  if (normalized.length === 0) return [];

  const gapsTotal = gapPx * (normalized.length - 1);
  const usable = Math.max(0, totalPx - gapsTotal);

  // Use largest remainder for pixel allocation
  const fracs = normalized.map((s) => s.percentage / 100);
  const raw = fracs.map((f) => f * usable);
  const widths = raw.map((v) => Math.max(Math.floor(v), minPx));

  // Distribute remainder
  const rem = raw.map((v, i) => v - widths[i]);
  const sum = widths.reduce((a, v) => a + v, 0);
  if (sum < usable) {
    const order = [...Array(widths.length).keys()].sort(
      (a, b) => rem[b] - rem[a],
    );
    for (let k = 0; k < usable - sum && k < order.length; k++) {
      widths[order[k]] += 1;
    }
  }

  let start = 0;
  return normalized.map((s, i) => {
    const len = widths[i] ?? minPx;
    const seg: MicrovizPixelSegment = { ...s, len, start };
    start += len + gapPx;
    return seg;
  });
}

export * from "./index.model";
export * from "./transition";
export {
  applyFillRules,
  type FillRule,
  fillUrl,
  type MarkMatcher,
} from "./utils/defs";
