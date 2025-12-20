export function clamp(value: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, value));
}

export function allocateUnitsByPct<T extends { pct: number }>(
  segments: readonly T[],
  totalUnits: number,
  options?: { key?: (segment: T, index: number) => string },
): number[] {
  if (segments.length === 0) return [];
  const first = segments[0];
  if (!first) return [];
  const total = Math.max(0, Math.floor(totalUnits));
  if (total <= 0) return segments.map(() => 0);

  const raw = segments.map((seg) => (seg.pct / 100) * total);
  const base = raw.map((x) => Math.floor(x));
  const remaining = total - base.reduce((s, x) => s + x, 0);

  const keyFn = options?.key ?? ((_, index) => String(index));
  const order = raw
    .map((x, i) => ({
      frac: x - (base[i] ?? 0),
      i,
      key: keyFn(segments[i] ?? first, i),
    }))
    .sort((a, b) => b.frac - a.frac || a.key.localeCompare(b.key) || a.i - b.i);

  for (let k = 0; k < remaining && k < order.length; k++) {
    base[order[k].i] += 1;
  }

  return base;
}

export function expandColorsByCounts<T extends { color: string }>(
  segments: readonly T[],
  counts: readonly number[],
  options?: {
    key?: (segment: T, segmentIndex: number, index: number) => string;
  },
): Array<{ color: string; key: string }> {
  const keyFn = options?.key ?? ((_, segIdx, index) => `${segIdx}-${index}`);
  return segments.flatMap((seg, segIdx) =>
    Array.from({ length: counts[segIdx] ?? 0 }, (_, index) => ({
      color: seg.color,
      key: keyFn(seg, segIdx, index),
    })),
  );
}

export function interleaveCounts(counts: readonly number[]): number[] {
  const items: Array<{ i: number; key: number }> = [];
  counts.forEach((count, i) => {
    for (let j = 0; j < count; j++) items.push({ i, key: (j + 0.5) / count });
  });
  items.sort((a, b) => a.key - b.key || a.i - b.i);
  return items.map((x) => x.i);
}

export function compressRuns(
  indices: readonly number[],
): Array<{ i: number; x: number; w: number }> {
  const out: Array<{ i: number; x: number; w: number }> = [];
  let x = 0;
  for (let k = 0; k < indices.length; ) {
    const i = indices[k];
    if (i === undefined) break;
    let w = 1;
    while (k + w < indices.length && indices[k + w] === i) w++;
    out.push({ i, w, x });
    x += w;
    k += w;
  }
  return out;
}
