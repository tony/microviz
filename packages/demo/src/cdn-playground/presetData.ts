/**
 * Generates seeded random data for playground presets.
 * Uses the same seed utilities as the browse page for consistency.
 */

import { buildSegments, buildSeries, createSeededRng } from "../browse/seed";

type PresetDataConfig = {
  /** Chart type determines what kind of data to generate */
  type: "sparkline" | "bars" | "donut" | "dashboard";
  /** Number of data points for series data */
  length?: number;
  /** Number of segments for donut charts */
  segmentCount?: number;
};

const PRESET_CONFIGS: Record<string, PresetDataConfig> = {
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
  const segments = buildSegments(seed, count);
  // Use hex colors for better readability in the playground
  const hexColors = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];
  const names = ["Desktop", "Mobile", "Tablet", "Other", "Unknown"];
  return JSON.stringify(
    segments.map((s, i) => ({
      color: hexColors[i % hexColors.length],
      name: names[i % names.length],
      pct: s.pct,
    })),
  );
}

/**
 * Generates a JavaScript array literal for CSP-safe preset.
 * Example: "[1, 4, 2, 5, 3, 6, 4, 7, 5, 8]"
 */
function generateJsArrayData(seed: string, length: number): string {
  const series = buildSeries(seed, length, "random-walk");
  return `[${series.map((v) => Math.round(v)).join(", ")}]`;
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
