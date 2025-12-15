function fnv1a32(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export type SeededRng = {
  float: () => number;
  int: (min: number, max: number) => number;
  pick: <T>(items: readonly T[]) => T;
};

export function createSeededRng(seed: string): SeededRng {
  const rand = mulberry32(fnv1a32(seed));
  return {
    float: () => rand(),
    int: (min, max) => {
      const lo = Math.min(min, max);
      const hi = Math.max(min, max);
      const span = hi - lo + 1;
      return lo + Math.floor(rand() * span);
    },
    pick: <T>(items: readonly T[]) => {
      if (items.length === 0) {
        throw new Error("pick() requires a non-empty array");
      }
      const item = items[Math.floor(rand() * items.length)];
      if (item === undefined) {
        throw new Error("pick() failed to select an item");
      }
      return item;
    },
  };
}

function clamp(value: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, value));
}

export type SeriesPreset = "trend" | "seasonal" | "spiky" | "random-walk";

export function buildSeries(
  seed: string,
  length: number,
  preset: SeriesPreset,
): number[] {
  const rng = createSeededRng(seed);
  const n = Math.max(1, Math.floor(length));

  const out: number[] = [];
  let value = rng.int(30, 70);

  for (let i = 0; i < n; i++) {
    if (preset === "trend") {
      const drift = 0.9 + i / Math.max(1, n - 1);
      value += (rng.float() - 0.35) * drift * 6;
    } else if (preset === "seasonal") {
      const phase = (i / Math.max(1, n - 1)) * Math.PI * 2;
      const seasonal = Math.sin(phase + rng.float() * 0.6) * 18;
      value += seasonal * 0.08 + (rng.float() - 0.5) * 4;
    } else if (preset === "spiky") {
      const spike = rng.float() < 0.12 ? rng.int(18, 42) : 0;
      value += (rng.float() - 0.5) * 6 + spike;
    } else {
      value += (rng.float() - 0.5) * 10;
    }
    out.push(clamp(value, 0, 100));
  }

  return out.map((x) => Math.round(x * 100) / 100);
}

export function buildOpacities(
  series: readonly number[],
  lightThreshold = 35,
): number[] {
  return series.map((v) => (v < lightThreshold ? 0.35 : 1));
}

export type BitfieldSegment = { name: string; pct: number; color: string };

const DEFAULT_SEGMENT_COLORS: readonly string[] = [
  "oklch(0.65 0.15 250)", // Blue (primary)
  "oklch(0.70 0.15 150)", // Green (secondary)
  "oklch(0.72 0.15 80)", // Yellow-Orange
  "oklch(0.72 0.12 30)", // Coral
  "oklch(0.68 0.14 10)", // Red-Pink
  "oklch(0.67 0.16 295)", // Purple
  "oklch(0.71 0.14 200)", // Cyan
  "oklch(0.73 0.13 120)", // Lime
];

export function buildSegments(
  seed: string,
  count: number,
  options?: { palette?: readonly string[] },
): BitfieldSegment[] {
  const rng = createSeededRng(seed);
  const n = clamp(Math.floor(count), 1, 8);
  const palette = options?.palette ?? DEFAULT_SEGMENT_COLORS;

  const weights: number[] = [];
  let total = 0;
  for (let i = 0; i < n; i++) {
    const w = 0.4 + rng.float() * 1.6;
    total += w;
    weights.push(w);
  }

  const raw = weights.map((w) => (w / total) * 100);

  // Round with largest-remainder so total stays exactly 100.
  const ints = raw.map((x) => Math.floor(x));
  const remainder = 100 - ints.reduce((sum, x) => sum + x, 0);
  const order = raw
    .map((x, i) => ({ frac: x - ints[i], i }))
    .sort((a, b) => b.frac - a.frac);
  for (let k = 0; k < remainder; k++) ints[order[k]?.i ?? 0] += 1;

  return ints
    .map((pct, i) => ({
      color: palette[i % palette.length] ?? "currentColor",
      name: `Segment ${i + 1}`,
      pct,
    }))
    .filter((s) => s.pct > 0);
}
