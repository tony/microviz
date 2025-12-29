/**
 * Stateless code generator for CDN playground.
 *
 * This module provides pure functions for generating preset code,
 * making it fully testable with Vitest (no DOM/Playwright required).
 */

import { buildSegments, buildSeries, createSeededRng } from "../browse/seed";
import type { CdnSource } from "./cdnSources";
import {
  type PresetDataConfig,
  PRESET_REGISTRY,
  type PresetTemplate,
  type WrapperType,
} from "./presetRegistry";

export type AttributeUpdate = {
  selector: string;
  attribute: string;
  value: string;
};

export type CodeGeneratorInput = {
  wrapper: WrapperType;
  presetId: string;
  seed: string;
  cdnSource: CdnSource;
};

export type CodeGeneratorOutput = {
  code: string;
  reactiveUpdates: AttributeUpdate[] | null;
  canRandomize: boolean;
};

// Segment colors and names for donut charts
const SEGMENT_COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];
const SEGMENT_NAMES = ["Desktop", "Mobile", "Tablet", "Other", "Unknown"];

/**
 * Generates comma-separated series for sparkline data attributes.
 */
function generateSparklineData(seed: string, length: number): string {
  const series = buildSeries(seed, length, "random-walk");
  return series.map((v) => Math.round(v)).join(", ");
}

/**
 * Generates JSON array for bar chart data attributes.
 */
function generateBarsData(seed: string, length: number): string {
  const series = buildSeries(seed, length, "random-walk");
  return JSON.stringify(series.map((v) => Math.round(v)));
}

/**
 * Generates JSON array for donut chart segments.
 */
function generateDonutData(seed: string, count: number): string {
  const segments = buildSegments(seed, count);
  const named = segments.map((segment, i) => ({
    color: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
    name: SEGMENT_NAMES[i % SEGMENT_NAMES.length],
    pct: segment.pct,
  }));
  return JSON.stringify(named);
}

/**
 * Generates delta object for auto-inference delta charts.
 */
function generateDeltaData(seed: string): string {
  const rng = createSeededRng(seed);
  const max = rng.int(12, 40);
  const currentMin = Math.max(1, Math.floor(max * 0.4));
  const current = rng.int(currentMin, max);
  const previous = rng.int(1, max);
  return JSON.stringify({ current, max, previous });
}

/**
 * Generates value object for auto-inference value charts.
 */
function generateValueData(seed: string): string {
  const rng = createSeededRng(seed);
  const max = rng.int(10, 40);
  const value = rng.int(1, max);
  return JSON.stringify({ max, value });
}

/**
 * Generates CSV data for auto-inference CSV charts.
 */
function generateCsvData(seed: string, count: number): string {
  const segments = buildSegments(seed, count);
  const named = segments.map((segment, i) => ({
    color: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
    name: SEGMENT_NAMES[i % SEGMENT_NAMES.length],
    pct: segment.pct,
  }));
  return [
    "pct,color,name",
    ...named.map((s) => `${s.pct},${s.color},${s.name}`),
  ].join("\n");
}

/**
 * Generates JavaScript array literal for CSP-safe preset.
 */
function generateJsArrayData(seed: string, length: number): string {
  const series = buildSeries(seed, length, "random-walk");
  return `[${series.map((v) => Math.round(v)).join(", ")}]`;
}

/**
 * Apply seeded data to preset code using regex replacements.
 */
function applyDataToCode(
  code: string,
  config: PresetDataConfig,
  presetId: string,
  seed: string,
): string {
  if (config.type === "none") return code;

  let result = code;
  const rng = createSeededRng(seed);

  switch (config.type) {
    case "sparkline": {
      const sparklineDataRegex =
        /(<microviz-sparkline[^>]*\sdata=")([^"]+)("[^>]*>)/g;
      result = result.replace(sparklineDataRegex, (_, before, _data, after) => {
        const subSeed = `${seed}:sparkline:${rng.int(0, 9999)}`;
        return `${before}${generateSparklineData(subSeed, config.length ?? 9)}${after}`;
      });

      const chartDataRegex =
        /(<microviz-chart[^>]*\sdata=")(\[[^\]]+\])("[^>]*>)/g;
      result = result.replace(chartDataRegex, (_, before, _data, after) => {
        const subSeed = `${seed}:chart:${rng.int(0, 9999)}`;
        return `${before}${generateBarsData(subSeed, config.length ?? 12)}${after}`;
      });
      break;
    }

    case "bars": {
      const barsDataRegex =
        /(<microviz-chart[^>]*\sdata=")(\[[^\]]+\])("[^>]*>)/g;
      result = result.replace(barsDataRegex, (_, before, _data, after) => {
        const subSeed = `${seed}:bars:${rng.int(0, 9999)}`;
        return `${before}${generateBarsData(subSeed, config.length ?? 7)}${after}`;
      });
      break;
    }

    case "donut": {
      const donutDataRegex =
        /(<microviz-chart[^>]*\sdata=')(\[\{[^\]]+\])('[^>]*>)/g;
      result = result.replace(donutDataRegex, (_, before, _data, after) => {
        const subSeed = `${seed}:donut:${rng.int(0, 9999)}`;
        return `${before}${generateDonutData(subSeed, config.segmentCount ?? 3)}${after}`;
      });
      break;
    }

    case "dashboard": {
      const sparklineDataRegex =
        /(<microviz-sparkline[^>]*\sdata=")([^"]+)("[^>]*>)/g;
      result = result.replace(sparklineDataRegex, (_, before, _data, after) => {
        const subSeed = `${seed}:dash-sparkline:${rng.int(0, 9999)}`;
        return `${before}${generateSparklineData(subSeed, 7)}${after}`;
      });

      const barsDataRegex =
        /(<microviz-chart[^>]*spec='[^']*sparkline-bars[^']*'[^>]*\sdata=")(\[[^\]]+\])("[^>]*>)/g;
      result = result.replace(barsDataRegex, (_, before, _data, after) => {
        const subSeed = `${seed}:dash-bars:${rng.int(0, 9999)}`;
        return `${before}${generateBarsData(subSeed, 4)}${after}`;
      });

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
        return `${before}${generateDeltaData(subSeed)}${after}`;
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
        return `${before}${generateValueData(subSeed)}${after}`;
      });
      break;
    }

    case "auto-csv": {
      const csvSeed = `${seed}:auto-csv:${rng.int(0, 9999)}`;
      const csvData = generateCsvData(csvSeed, config.segmentCount ?? 3);

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

/**
 * Generate reactive attribute updates for a preset.
 * Returns null if the preset doesn't support reactive updates.
 */
function generateReactiveUpdates(
  config: PresetDataConfig,
  seed: string,
): AttributeUpdate[] | null {
  if (!config.supportsReactiveUpdates) return null;

  const rng = createSeededRng(seed);
  const updates: AttributeUpdate[] = [];

  switch (config.type) {
    case "sparkline": {
      const subSeed = `${seed}:sparkline:${rng.int(0, 9999)}`;
      updates.push({
        attribute: "data",
        selector: "microviz-sparkline",
        value: generateSparklineData(subSeed, config.length ?? 9),
      });
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
      const sparklineSeed = `${seed}:dash-sparkline:${rng.int(0, 9999)}`;
      updates.push({
        attribute: "data",
        selector: "microviz-sparkline",
        value: generateSparklineData(sparklineSeed, 7),
      });
      const barsSeed = `${seed}:dash-bars:${rng.int(0, 9999)}`;
      updates.push({
        attribute: "data",
        selector: "microviz-chart[spec*='sparkline-bars']",
        value: generateBarsData(barsSeed, 4),
      });
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
        value: generateDeltaData(deltaSeed),
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
        value: generateValueData(valueSeed),
      });
      break;
    }

    case "auto-csv": {
      const csvSeed = `${seed}:auto-csv:${rng.int(0, 9999)}`;
      updates.push({
        attribute: "data",
        selector: 'microviz-auto[data-kind="csv"]',
        value: generateCsvData(csvSeed, config.segmentCount ?? 3),
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

    default:
      return null;
  }

  return updates.length > 0 ? updates : null;
}

/**
 * Pure function to generate preset code.
 *
 * @param input - The code generation input
 * @returns The generated code and metadata
 */
export function generatePresetCode(
  input: CodeGeneratorInput,
): CodeGeneratorOutput {
  const { wrapper, presetId, seed, cdnSource } = input;
  const config = PRESET_REGISTRY[wrapper];

  // Find the preset
  const preset: PresetTemplate | undefined = config.presets.find(
    (p) => p.id === presetId,
  );

  if (!preset) {
    // Fallback to default preset for this wrapper
    const defaultPreset = config.presets.find(
      (p) => p.id === config.defaultPresetId,
    );
    if (!defaultPreset) {
      throw new Error(`No default preset found for wrapper '${wrapper}'`);
    }
    return generatePresetCode({ ...input, presetId: defaultPreset.id });
  }

  // Generate CDN URL
  const cdnUrl = config.getCdnUrl(cdnSource);

  // Generate base code from factory
  let code = preset.codeFactory(cdnUrl);

  // Apply seeded data
  code = applyDataToCode(code, preset.dataConfig, presetId, seed);

  // Generate reactive updates
  const reactiveUpdates = generateReactiveUpdates(preset.dataConfig, seed);

  return {
    canRandomize: preset.dataConfig.supportsReactiveUpdates,
    code,
    reactiveUpdates,
  };
}

/**
 * Get the CDN URL for a wrapper and source.
 */
export function getCdnUrlForWrapper(
  wrapper: WrapperType,
  cdnSource: CdnSource,
): string {
  return PRESET_REGISTRY[wrapper].getCdnUrl(cdnSource);
}

/**
 * Check if a preset supports randomization.
 */
export function canRandomizePreset(
  wrapper: WrapperType,
  presetId: string,
): boolean {
  const preset = PRESET_REGISTRY[wrapper].presets.find(
    (p) => p.id === presetId,
  );
  return preset?.dataConfig.supportsReactiveUpdates ?? false;
}

// Re-export types for convenience
export type { CdnSource } from "./cdnSources";
export type { WrapperType, PresetTemplate, PresetDataConfig } from "./presetRegistry";
