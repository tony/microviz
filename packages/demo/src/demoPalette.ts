import { createSeededRng } from "./browse/seed";

export type PaletteMode = "value" | "random" | "chunks";

type Palette = readonly string[];
type PaletteSegment = { pct: number; color: string };

function clamp(value: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, value));
}

function resampleSeries(series: readonly number[], count: number): number[] {
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

function mapSeriesToPalette(
  series: readonly number[],
  palette: Palette,
  count: number,
): string[] {
  if (palette.length === 0) return [];
  const values = resampleSeries(series, count);
  if (values.length === 0) return [];

  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const value of values) {
    if (!Number.isFinite(value)) continue;
    min = Math.min(min, value);
    max = Math.max(max, value);
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [];

  const denom = max - min || 1;
  const last = palette.length - 1;
  return values.map((value) => {
    const t = clamp((value - min) / denom, 0, 1);
    const idx = Math.round(t * last);
    return palette[idx] ?? palette[last] ?? "currentColor";
  });
}

function allocateCountsByPct(
  segments: readonly PaletteSegment[],
  total: number,
): number[] {
  if (total <= 0) return [];
  const totalPct = segments.reduce((sum, seg) => sum + seg.pct, 0);
  if (totalPct <= 0) return Array.from({ length: segments.length }, () => 0);

  const raw = segments.map((seg) => (seg.pct / totalPct) * total);
  const ints = raw.map((value) => Math.floor(value));
  const remainder = total - ints.reduce((sum, value) => sum + value, 0);
  const order = raw
    .map((value, index) => ({ frac: value - ints[index], index }))
    .sort((a, b) => b.frac - a.frac);

  for (let i = 0; i < remainder; i++) {
    const idx = order[i]?.index ?? 0;
    ints[idx] = (ints[idx] ?? 0) + 1;
  }
  return ints;
}

function shuffleOrder(count: number, seed: string): number[] {
  const order = Array.from({ length: count }, (_, i) => i);
  const rng = createSeededRng(seed);
  for (let i = order.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    const tmp = order[i];
    order[i] = order[j] ?? order[i];
    order[j] = tmp;
  }
  return order;
}

function buildChunkedPalette(
  palette: Palette,
  segments: readonly PaletteSegment[] | undefined,
  count: number,
  seed: string,
): string[] {
  if (palette.length === 0 || count <= 0) return [];

  const sourceSegments =
    segments && segments.length > 0
      ? segments
      : palette.map((color) => ({ color, pct: 100 / palette.length }));

  const counts = allocateCountsByPct(sourceSegments, count);
  const order = shuffleOrder(sourceSegments.length, seed);

  const colors: string[] = [];
  for (const idx of order) {
    const seg = sourceSegments[idx];
    const n = counts[idx] ?? 0;
    if (!seg || n <= 0) continue;
    for (let i = 0; i < n; i++) colors.push(seg.color);
  }

  const fallback = palette[palette.length - 1] ?? "currentColor";
  while (colors.length < count) colors.push(fallback);
  return colors.slice(0, count);
}

function buildRandomPalette(
  palette: Palette,
  count: number,
  seed: string,
): string[] {
  if (palette.length === 0 || count <= 0) return [];
  const rng = createSeededRng(seed);
  return Array.from({ length: count }, () => {
    const idx = rng.int(0, palette.length - 1);
    return palette[idx] ?? palette[palette.length - 1] ?? "currentColor";
  });
}

export function buildPaletteColors({
  count,
  mode,
  palette,
  segments,
  seed,
  series,
}: {
  count: number;
  mode: PaletteMode;
  palette: Palette;
  segments?: readonly PaletteSegment[];
  seed: string;
  series: readonly number[];
}): string[] {
  if (mode === "random") {
    return buildRandomPalette(palette, count, seed);
  }
  if (mode === "chunks") {
    return buildChunkedPalette(palette, segments, count, seed);
  }
  return mapSeriesToPalette(series, palette, count);
}
