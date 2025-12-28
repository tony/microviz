/**
 * Generates seeded random data for playground presets.
 * Uses the same seed utilities as the browse page for consistency.
 */

import { buildSegments, buildSeries, createSeededRng } from "../browse/seed";

type PresetDataConfig = {
  /** Chart type determines what kind of data to generate */
  type:
    | "sparkline"
    | "bars"
    | "donut"
    | "dashboard"
    | "auto"
    | "auto-csv"
    | "auto-override";
  /** Number of data points for series data */
  length?: number;
  /** Number of segments for donut charts */
  segmentCount?: number;
};

const PRESET_CONFIGS: Record<string, PresetDataConfig> = {
  "auto-csv": { segmentCount: 3, type: "auto-csv" },
  "auto-inference": { length: 5, segmentCount: 3, type: "auto" },
  "auto-override": { segmentCount: 3, type: "auto-override" },
  "bar-chart": { length: 7, type: "bars" },
  "csp-safe": { length: 10, type: "sparkline" },
  donut: { segmentCount: 3, type: "donut" },
  interactive: { length: 12, type: "sparkline" },
  "multiple-charts": { type: "dashboard" },
  sparkline: { length: 9, type: "sparkline" },
};

/**
 * Generates a comma-separated series string for sparkline data attributes.
 * Example: "10, 25, 15, 30, 20, 35, 25, 40, 30"
 */
function generateSparklineData(seed: string, length: number): string {
  const series = buildSeries(seed, length, "random-walk");
  return series.map((v) => Math.round(v)).join(", ");
}

/**
 * Generates a JSON array string for bar chart data attributes.
 * Example: "[65, 59, 80, 81, 56, 72, 68]"
 */
function generateBarsData(seed: string, length: number): string {
  const series = buildSeries(seed, length, "random-walk");
  return JSON.stringify(series.map((v) => Math.round(v)));
}

/**
 * Generates a JSON array string for donut chart segments.
 * Example: '[{"pct":62,"color":"#6366f1","name":"Desktop"},...]'
 */
function generateDonutData(seed: string, count: number): string {
  return JSON.stringify(buildNamedSegments(seed, count));
}

const AUTO_SEGMENT_COLORS = [
  "#6366f1",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
];
const AUTO_SEGMENT_NAMES = ["Desktop", "Mobile", "Tablet", "Other", "Unknown"];

function buildNamedSegments(seed: string, count: number) {
  const segments = buildSegments(seed, count);
  return segments.map((segment, i) => ({
    color: AUTO_SEGMENT_COLORS[i % AUTO_SEGMENT_COLORS.length],
    name: AUTO_SEGMENT_NAMES[i % AUTO_SEGMENT_NAMES.length],
    pct: segment.pct,
  }));
}

function generateAutoDeltaData(seed: string): string {
  const rng = createSeededRng(seed);
  const max = rng.int(12, 40);
  const currentMin = Math.max(1, Math.floor(max * 0.4));
  const current = rng.int(currentMin, max);
  const previous = rng.int(1, max);
  return JSON.stringify({ current, max, previous });
}

function generateAutoValueData(seed: string): string {
  const rng = createSeededRng(seed);
  const max = rng.int(10, 40);
  const value = rng.int(1, max);
  return JSON.stringify({ max, value });
}

function generateAutoCsvData(seed: string, count: number): string {
  const segments = buildNamedSegments(seed, count);
  return [
    "pct,color,name",
    ...segments.map((segment) => {
      return `${segment.pct},${segment.color},${segment.name}`;
    }),
  ].join("\n");
}

/**
 * Generates a JavaScript array literal for CSP-safe preset.
 * Example: "[1, 4, 2, 5, 3, 6, 4, 7, 5, 8]"
 */
function generateJsArrayData(seed: string, length: number): string {
  const series = buildSeries(seed, length, "random-walk");
  return `[${series.map((v) => Math.round(v)).join(", ")}]`;
}

type AttributeUpdate = {
  selector: string;
  attribute: string;
  value: string;
};

/**
 * Generates data updates for reactive attribute changes.
 * Returns an array of { selector, attribute, value } for each chart element.
 * Returns null for presets that cannot be updated reactively (e.g., csp-safe).
 */
export function generateDataForPreset(
  presetId: string,
  seed: string,
): AttributeUpdate[] | null {
  const config = PRESET_CONFIGS[presetId];
  if (!config) return null;

  const rng = createSeededRng(seed);
  const updates: AttributeUpdate[] = [];

  switch (config.type) {
    case "sparkline": {
      // Sparkline uses comma-separated format
      const subSeed = `${seed}:sparkline:${rng.int(0, 9999)}`;
      updates.push({
        attribute: "data",
        selector: "microviz-sparkline",
        value: generateSparklineData(subSeed, config.length ?? 9),
      });
      // Also update microviz-chart if present (for interactive preset)
      const chartSeed = `${seed}:chart:${rng.int(0, 9999)}`;
      updates.push({
        attribute: "data",
        selector: "microviz-chart",
        value: generateBarsData(chartSeed, config.length ?? 12),
      });
      break;
    }

    case "bars": {
      const subSeed = `${seed}:bars:${rng.int(0, 9999)}`;
      updates.push({
        attribute: "data",
        selector: "microviz-chart",
        value: generateBarsData(subSeed, config.length ?? 7),
      });
      break;
    }

    case "donut": {
      const subSeed = `${seed}:donut:${rng.int(0, 9999)}`;
      updates.push({
        attribute: "data",
        selector: "microviz-chart",
        value: generateDonutData(subSeed, config.segmentCount ?? 3),
      });
      break;
    }

    case "dashboard": {
      // Dashboard has multiple chart types - update each
      // Sparklines
      const sparklineSeed = `${seed}:dash-sparkline:${rng.int(0, 9999)}`;
      updates.push({
        attribute: "data",
        selector: "microviz-sparkline",
        value: generateSparklineData(sparklineSeed, 7),
      });
      // Bar charts (only those with sparkline-bars spec)
      const barsSeed = `${seed}:dash-bars:${rng.int(0, 9999)}`;
      updates.push({
        attribute: "data",
        selector: "microviz-chart[spec*='sparkline-bars']",
        value: generateBarsData(barsSeed, 4),
      });
      // Donut charts (only those with donut spec)
      const donutSeed = `${seed}:dash-donut:${rng.int(0, 9999)}`;
      updates.push({
        attribute: "data",
        selector: "microviz-chart[spec*='donut']",
        value: generateDonutData(donutSeed, 3),
      });
      break;
    }

    case "auto": {
      const seriesSeed = `${seed}:auto-series:${rng.int(0, 9999)}`;
      updates.push({
        attribute: "data",
        selector: 'microviz-auto[data-kind="series"]',
        value: generateSparklineData(seriesSeed, config.length ?? 5),
      });
      const deltaSeed = `${seed}:auto-delta:${rng.int(0, 9999)}`;
      updates.push({
        attribute: "data",
        selector: 'microviz-auto[data-kind="delta"]',
        value: generateAutoDeltaData(deltaSeed),
      });
      const segmentSeed = `${seed}:auto-segments:${rng.int(0, 9999)}`;
      updates.push({
        attribute: "data",
        selector: 'microviz-auto[data-kind="segments"]',
        value: generateDonutData(segmentSeed, config.segmentCount ?? 3),
      });
      const valueSeed = `${seed}:auto-value:${rng.int(0, 9999)}`;
      updates.push({
        attribute: "data",
        selector: 'microviz-auto[data-kind="value"]',
        value: generateAutoValueData(valueSeed),
      });
      break;
    }

    case "auto-csv": {
      const csvSeed = `${seed}:auto-csv:${rng.int(0, 9999)}`;
      updates.push({
        attribute: "data",
        selector: 'microviz-auto[data-kind="csv"]',
        value: generateAutoCsvData(csvSeed, config.segmentCount ?? 3),
      });
      break;
    }

    case "auto-override": {
      const overrideSeed = `${seed}:auto-override:${rng.int(0, 9999)}`;
      updates.push({
        attribute: "data",
        selector: 'microviz-auto[data-kind="override"]',
        value: generateDonutData(overrideSeed, config.segmentCount ?? 3),
      });
      break;
    }
  }

  // csp-safe cannot be updated reactively (data is in JS code, not attribute)
  if (presetId === "csp-safe") {
    return null;
  }

  return updates.length > 0 ? updates : null;
}

/**
 * Applies seeded random data to a preset's code template.
 * Uses regex to find and replace data patterns in the HTML.
 */
export function applySeededData(
  presetId: string,
  code: string,
  seed: string,
): string {
  const config = PRESET_CONFIGS[presetId];
  if (!config) return code;

  let result = code;
  const rng = createSeededRng(seed);

  switch (config.type) {
    case "sparkline": {
      // Match data="..." for microviz-sparkline (comma-separated)
      const sparklineDataRegex =
        /(<microviz-sparkline[^>]*\sdata=")([^"]+)("[^>]*>)/g;
      result = result.replace(sparklineDataRegex, (_, before, _data, after) => {
        const subSeed = `${seed}:sparkline:${rng.int(0, 9999)}`;
        return `${before}${generateSparklineData(subSeed, config.length ?? 9)}${after}`;
      });

      // Match data="[...]" for microviz-chart with JSON array
      const chartDataRegex =
        /(<microviz-chart[^>]*\sdata=")(\[[^\]]+\])("[^>]*>)/g;
      result = result.replace(chartDataRegex, (_, before, _data, after) => {
        const subSeed = `${seed}:chart:${rng.int(0, 9999)}`;
        return `${before}${generateBarsData(subSeed, config.length ?? 12)}${after}`;
      });
      break;
    }

    case "bars": {
      // Match data="[...]" for bar charts
      const barsDataRegex =
        /(<microviz-chart[^>]*\sdata=")(\[[^\]]+\])("[^>]*>)/g;
      result = result.replace(barsDataRegex, (_, before, _data, after) => {
        const subSeed = `${seed}:bars:${rng.int(0, 9999)}`;
        return `${before}${generateBarsData(subSeed, config.length ?? 7)}${after}`;
      });
      break;
    }

    case "donut": {
      // Match data='[{...}]' for donut charts (single-quoted JSON)
      const donutDataRegex =
        /(<microviz-chart[^>]*\sdata=')(\[\{[^\]]+\])('[^>]*>)/g;
      result = result.replace(donutDataRegex, (_, before, _data, after) => {
        const subSeed = `${seed}:donut:${rng.int(0, 9999)}`;
        return `${before}${generateDonutData(subSeed, config.segmentCount ?? 3)}${after}`;
      });
      break;
    }

    case "dashboard": {
      // Dashboard has multiple charts - handle each type
      // Sparklines (comma-separated)
      const sparklineDataRegex =
        /(<microviz-sparkline[^>]*\sdata=")([^"]+)("[^>]*>)/g;
      result = result.replace(sparklineDataRegex, (_, before, _data, after) => {
        const subSeed = `${seed}:dash-sparkline:${rng.int(0, 9999)}`;
        return `${before}${generateSparklineData(subSeed, 7)}${after}`;
      });

      // Bar charts (JSON array with double quotes)
      const barsDataRegex =
        /(<microviz-chart[^>]*spec='[^']*sparkline-bars[^']*'[^>]*\sdata=")(\[[^\]]+\])("[^>]*>)/g;
      result = result.replace(barsDataRegex, (_, before, _data, after) => {
        const subSeed = `${seed}:dash-bars:${rng.int(0, 9999)}`;
        return `${before}${generateBarsData(subSeed, 4)}${after}`;
      });

      // Donut charts (JSON array with single quotes)
      const donutDataRegex =
        /(<microviz-chart[^>]*spec='[^']*donut[^']*'[^>]*\sdata=')(\[\{[^\]]+\])('[^>]*>)/g;
      result = result.replace(donutDataRegex, (_, before, _data, after) => {
        const subSeed = `${seed}:dash-donut:${rng.int(0, 9999)}`;
        return `${before}${generateDonutData(subSeed, 3)}${after}`;
      });
      break;
    }

    case "auto": {
      const seriesRegex =
        /(<microviz-auto[^>]*data-kind="series"[^>]*\sdata=")([^"]+)(")/g;
      result = result.replace(seriesRegex, (_, before, _data, after) => {
        const subSeed = `${seed}:auto-series:${rng.int(0, 9999)}`;
        return `${before}${generateSparklineData(subSeed, config.length ?? 5)}${after}`;
      });

      const deltaRegex =
        /(<microviz-auto[^>]*data-kind="delta"[^>]*\sdata=')([^']+)(')/g;
      result = result.replace(deltaRegex, (_, before, _data, after) => {
        const subSeed = `${seed}:auto-delta:${rng.int(0, 9999)}`;
        return `${before}${generateAutoDeltaData(subSeed)}${after}`;
      });

      const segmentsRegex =
        /(<microviz-auto[^>]*data-kind="segments"[^>]*\sdata=')([^']+)(')/g;
      result = result.replace(segmentsRegex, (_, before, _data, after) => {
        const subSeed = `${seed}:auto-segments:${rng.int(0, 9999)}`;
        return `${before}${generateDonutData(subSeed, config.segmentCount ?? 3)}${after}`;
      });

      const valueRegex =
        /(<microviz-auto[^>]*data-kind="value"[^>]*\sdata=')([^']+)(')/g;
      result = result.replace(valueRegex, (_, before, _data, after) => {
        const subSeed = `${seed}:auto-value:${rng.int(0, 9999)}`;
        return `${before}${generateAutoValueData(subSeed)}${after}`;
      });
      break;
    }

    case "auto-csv": {
      const subSeed = `${seed}:auto-csv:${rng.int(0, 9999)}`;
      const csvData = generateAutoCsvData(subSeed, config.segmentCount ?? 3);
      const csvRegex =
        /(<microviz-auto[^>]*data-kind="csv"[^>]*\sdata=")([^"]+)(")/g;
      result = result.replace(csvRegex, (_, before, _data, after) => {
        return `${before}${csvData}${after}`;
      });

      const preRegex = /(<pre>)([\s\S]*?)(<\/pre>)/g;
      result = result.replace(preRegex, (_, before, _data, after) => {
        return `${before}${csvData}${after}`;
      });
      break;
    }

    case "auto-override": {
      const overrideRegex =
        /(<microviz-auto[^>]*data-kind="override"[^>]*\sdata=')([^']+)(')/g;
      result = result.replace(overrideRegex, (_, before, _data, after) => {
        const subSeed = `${seed}:auto-override:${rng.int(0, 9999)}`;
        return `${before}${generateDonutData(subSeed, config.segmentCount ?? 3)}${after}`;
      });
      break;
    }
  }

  // Handle CSP-safe preset's JavaScript array
  if (presetId === "csp-safe") {
    const jsArrayRegex = /(data:\s*)\[[\d,\s]+\]/;
    result = result.replace(jsArrayRegex, (_, before) => {
      const subSeed = `${seed}:csp`;
      return `${before}${generateJsArrayData(subSeed, 10)}`;
    });
  }

  return result;
}
