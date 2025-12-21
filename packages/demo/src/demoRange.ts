type DemoRange = { max: number; min: number };

type DemoRangeOptions = {
  ceil?: number;
  floor?: number;
  minSpan?: number;
};

function clamp(value: number, floor: number, ceil: number): number {
  return Math.min(ceil, Math.max(floor, value));
}

export function getDemoRange(
  values: readonly number[],
  options: DemoRangeOptions = {},
): DemoRange {
  const floor = options.floor ?? 0;
  const ceil = options.ceil ?? 100;
  const minSpan = Math.max(0, options.minSpan ?? 40);

  if (values.length === 0 || ceil <= floor) {
    return { max: floor, min: floor };
  }

  let min = Math.min(...values);
  let max = Math.max(...values);

  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return { max: floor, min: floor };
  }

  if (min > max) {
    [min, max] = [max, min];
  }

  const totalSpan = ceil - floor;
  if (minSpan >= totalSpan) {
    return { max: ceil, min: floor };
  }

  const span = max - min;
  if (span < minSpan) {
    const mid = (min + max) / 2;
    let nextMin = mid - minSpan / 2;
    let nextMax = mid + minSpan / 2;

    if (nextMin < floor) {
      nextMax += floor - nextMin;
      nextMin = floor;
    }

    if (nextMax > ceil) {
      nextMin -= nextMax - ceil;
      nextMax = ceil;
    }

    min = clamp(nextMin, floor, ceil);
    max = clamp(nextMax, floor, ceil);
  }

  return { max, min };
}
