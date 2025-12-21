import type { DiagnosticWarning } from "../model";
import {
  allocateUnitsByPct as allocateUnitsByPctFromPct,
  clamp,
  expandColorsByCounts,
} from "../utils/math";
import type { BitfieldData, BitfieldSegment } from "./types";

export const MAX_DIAGNOSTIC_WARNINGS = 25;

export { clamp };

export function isFiniteNumber(x: number): boolean {
  return Number.isFinite(x);
}

export function pushWarning(
  warnings: DiagnosticWarning[],
  warning: DiagnosticWarning,
): void {
  if (warnings.length >= MAX_DIAGNOSTIC_WARNINGS) return;
  warnings.push(warning);
}

export function coerceFinite(
  value: number,
  fallback: number,
  warnings: DiagnosticWarning[] | undefined,
  message: string,
): number {
  if (isFiniteNumber(value)) return value;
  if (warnings) pushWarning(warnings, { code: "NAN_COORDINATE", message });
  return fallback;
}

export function coerceFiniteNonNegative(
  value: number,
  fallback: number,
  warnings: DiagnosticWarning[] | undefined,
  message: string,
): number {
  return Math.max(0, coerceFinite(value, fallback, warnings, message));
}

export function coerceFiniteInt(
  value: number,
  fallback: number,
  min: number,
  warnings: DiagnosticWarning[] | undefined,
  message: string,
): number {
  const coerced = coerceFinite(value, fallback, warnings, message);
  return Math.max(min, Math.floor(coerced));
}

export function isIntegerish(value: number): boolean {
  return Math.abs(value - Math.round(value)) < 1e-6;
}

export type NormalizedSegment = BitfieldSegment;

export function normalizeSegments(data: BitfieldData): NormalizedSegment[] {
  const segments = data
    .filter((s) => isFiniteNumber(s.pct) && s.pct > 0 && s.color.length > 0)
    .map((s) => ({ color: s.color, name: s.name, pct: Math.max(0, s.pct) }));
  const total = segments.reduce((sum, s) => sum + s.pct, 0);
  if (total <= 0) return [];
  return segments.map((s) => ({ ...s, pct: (s.pct / total) * 100 }));
}

export function sparklineSeries(
  series: readonly number[],
  w: number,
  h: number,
  pad: number,
): { d: string; last: { x: number; y: number } | null } {
  if (series.length === 0) return { d: "", last: null };
  const x0 = pad;
  const x1 = w - pad;
  const y0 = pad;
  const y1 = h - pad;

  const min = Math.min(...series);
  const max = Math.max(...series);
  const denom = max - min || 1;

  const dx = series.length > 1 ? (x1 - x0) / (series.length - 1) : 0;
  const points = series.map((v, i) => ({
    x: x0 + dx * i,
    y: y1 - ((v - min) / denom) * (y1 - y0),
  }));

  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 1; i < points.length; i++)
    d += ` L ${points[i].x.toFixed(2)} ${points[i].y.toFixed(2)}`;
  return { d, last: points[points.length - 1] ?? null };
}

export function normalizedPct(x: number): number {
  return clamp(x, 0, 100);
}

function seriesHashHex(series: readonly number[]): string {
  let hash = 0x811c9dc5;
  for (const value of series) {
    const scaled = Math.round(value * 1000);
    const bytes = [
      scaled & 0xff,
      (scaled >>> 8) & 0xff,
      (scaled >>> 16) & 0xff,
      (scaled >>> 24) & 0xff,
    ];
    for (const byte of bytes) {
      hash ^= byte;
      hash = Math.imul(hash, 0x01000193);
    }
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function sparkAreaGradientId(series: readonly number[]): string {
  return `mv-spark-area-grad-${seriesHashHex(series)}`;
}

export function resampleSeries(
  series: readonly number[],
  count: number,
): number[] {
  if (count <= 0) return [];
  if (series.length === 0) return [];
  if (series.length === 1) {
    return Array.from({ length: count }, () => series[0] ?? 0);
  }
  if (count === 1) return [series[0] ?? 0];

  const last = series.length - 1;
  return Array.from({ length: count }, (_, i) => {
    const t = count === 1 ? 0 : i / (count - 1);
    const idx = t * last;
    const lo = Math.floor(idx);
    const hi = Math.min(last, Math.ceil(idx));
    const frac = idx - lo;
    const a = series[lo] ?? 0;
    const b = series[hi] ?? a;
    return a + (b - a) * frac;
  });
}

export function allocateUnitsByPct(
  segments: readonly NormalizedSegment[],
  totalUnits: number,
): number[] {
  return allocateUnitsByPctFromPct(segments, totalUnits, {
    key: (seg, segIdx) => seg.name ?? seg.color ?? String(segIdx),
  });
}

type ColorCell = { color: string; key: string };

export function expandSegmentColors(
  segments: readonly NormalizedSegment[],
  counts: readonly number[],
): ColorCell[] {
  return expandColorsByCounts(segments, counts, {
    key: (seg, segIdx, index) => `${seg.name ?? seg.color ?? segIdx}-${index}`,
  });
}

type SegmentRun = { color: string; name?: string; w: number; x: number };

export function layoutSegmentsByPct(
  segments: readonly NormalizedSegment[],
  usableW: number,
  gap: number,
): SegmentRun[] {
  if (segments.length === 0) return [];
  const safeGap = Math.max(0, gap);
  const totalGap = safeGap * Math.max(0, segments.length - 1);
  const availableW = Math.max(0, usableW - totalGap);

  const widths = segments.map((seg) => (seg.pct / 100) * availableW);

  const out: SegmentRun[] = [];
  let acc = 0;
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (!seg) continue;
    const x = acc + safeGap * i;
    const w =
      i === segments.length - 1
        ? Math.max(0, availableW - acc)
        : Math.max(0, widths[i] ?? 0);
    out.push({ color: seg.color, name: seg.name, w, x });
    acc += widths[i] ?? 0;
  }

  return out;
}

export function distributeTrackWidths(
  totalPx: number,
  count: number,
): number[] {
  if (count <= 0) return [];
  const total = Math.max(0, Math.floor(totalPx));
  const bins = Math.floor(count);
  if (bins <= 0) return [];

  const boundaries = Array.from({ length: bins + 1 }, (_, i) =>
    Math.round((i * total) / bins),
  );
  return Array.from(
    { length: bins },
    (_, i) => (boundaries[i + 1] ?? total) - (boundaries[i] ?? 0),
  );
}
