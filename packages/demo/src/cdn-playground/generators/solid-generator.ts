/**
 * Solid code generator for playground.
 * Generates Solid/JSX code from unified presets.
 */

import type {
  ChartInstance,
  LayoutTemplate,
  UnifiedPreset,
} from "../unified-presets";
import { generateDataForShape } from "./data-generator";
import type { GeneratedCode, GeneratorContext } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Component Name Mapping
// ─────────────────────────────────────────────────────────────────────────────

type SolidComponentInfo = {
  name: string;
  importFrom: "@microviz/solid";
  propsStyle: "data" | "input";
};

function getSolidComponentInfo(chart: ChartInstance): SolidComponentInfo {
  const { chartType, element } = chart;

  // microviz-sparkline → Sparkline
  if (element === "microviz-sparkline") {
    return {
      importFrom: "@microviz/solid",
      name: "Sparkline",
      propsStyle: "data",
    };
  }

  // microviz-auto doesn't have a direct Solid equivalent yet
  // For now, use MicrovizChart with appropriate spec
  if (element === "microviz-auto") {
    return {
      importFrom: "@microviz/solid",
      name: "MicrovizChart",
      propsStyle: "input",
    };
  }

  // microviz-chart with various specs
  switch (chartType) {
    case "sparkline":
      return {
        importFrom: "@microviz/solid",
        name: "Sparkline",
        propsStyle: "data",
      };
    case "sparkline-bars":
      return { importFrom: "@microviz/solid", name: "Bar", propsStyle: "data" };
    case "donut":
      return {
        importFrom: "@microviz/solid",
        name: "MicrovizChart",
        propsStyle: "input",
      };
    default:
      return {
        importFrom: "@microviz/solid",
        name: "MicrovizChart",
        propsStyle: "input",
      };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Formatting Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Format a segment object for JSX: { color: "...", name: "...", pct: N }
 */
function formatSegment(seg: {
  pct: number;
  color: string;
  name: string;
}): string {
  return `{ color: "${seg.color}", name: "${seg.name}", pct: ${seg.pct} }`;
}

/**
 * Format a spec object for JSX: { type: "donut" }
 */
function formatSpec(spec: Record<string, unknown>): string {
  const entries = Object.entries(spec)
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join(", ");
  return `{ ${entries} }`;
}

/**
 * Infer the spec string for a chart based on its configuration.
 * For auto charts (microviz-auto element), infers from dataKind.
 * Solid's MicrovizChart requires an explicit spec since there's no Auto component.
 */
function inferSpecFromDataKind(chart: ChartInstance): string {
  // If chart has an explicit spec, use it
  if (chart.spec) {
    return formatSpec(chart.spec);
  }

  // For auto charts, infer from dataKind
  if (chart.chartType === "auto" || chart.element === "microviz-auto") {
    switch (chart.dataKind) {
      case "csv":
      case "segments":
        return '{ type: "donut" }';
      case "delta":
        return '{ type: "bullet-delta" }';
      case "value":
        return '{ type: "bar" }';
      case "series":
        return '{ type: "sparkline" }';
      case "override":
        // Check for explicit type in extraAttrs
        if (chart.extraAttrs?.type) {
          return `{ type: "${chart.extraAttrs.type}" }`;
        }
        return '{ type: "bar" }';
    }
  }

  // For explicit chart types, use them directly
  if (chart.chartType && chart.chartType !== "auto") {
    return `{ type: "${chart.chartType}" }`;
  }

  // Default fallback
  return '{ type: "sparkline" }';
}

// ─────────────────────────────────────────────────────────────────────────────
// Data Formatting for Solid JSX
// ─────────────────────────────────────────────────────────────────────────────

function formatDataForSolid(
  chart: ChartInstance,
  seed: string,
  baseIndent: string,
): { value: string; isMultiline: boolean } {
  const data = generateDataForShape(chart.dataShape, seed);

  switch (data.type) {
    case "series":
      // Array literal: [10, 25, 15, 30]
      return { isMultiline: false, value: `[${data.values.join(", ")}]` };
    case "segments": {
      // Multi-line array of objects
      const lines = data.segments.map(
        (s) => `${baseIndent}  ${formatSegment(s)},`,
      );
      return {
        isMultiline: true,
        value: `[\n${lines.join("\n")}\n${baseIndent}]`,
      };
    }
    case "delta":
      // Format as { current: N, max: N, previous: N }
      return {
        isMultiline: false,
        value: `{ current: ${data.current}, max: ${data.max}, previous: ${data.previous} }`,
      };
    case "value":
      // Format as { max: N, value: N }
      return {
        isMultiline: false,
        value: `{ max: ${data.max}, value: ${data.value} }`,
      };
    case "csv":
      // Template literal for multiline
      return { isMultiline: true, value: `\`${data.content}\`` };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Solid Element Generation
// ─────────────────────────────────────────────────────────────────────────────

function generateSolidElement(chart: ChartInstance, seed: string): string {
  const info = getSolidComponentInfo(chart);

  // For "data" style components (Sparkline, Bar, etc.)
  if (info.propsStyle === "data") {
    const dataResult = formatDataForSolid(chart, seed, "  ");
    const lines = [
      `<${info.name}`,
      `  data={${dataResult.value}}`,
      `  width={${chart.width}}`,
      `  height={${chart.height}}`,
    ];

    lines.push("/>");
    return lines.join("\n");
  }

  // For MicrovizChart with input prop
  // baseIndent = "    " (4 spaces) matches where `data:` prop sits inside input={{}}
  const dataResult = formatDataForSolid(chart, seed, "    ");
  const spec = inferSpecFromDataKind(chart);

  const lines = [
    `<${info.name}`,
    "  input={{",
    `    data: ${dataResult.value},`,
    `    spec: ${spec},`,
    `    size: { width: ${chart.width}, height: ${chart.height} },`,
    "  }}",
  ];

  lines.push("/>");
  return lines.join("\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// Layout Wrapper Generation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Format a multi-line style prop for a grid container.
 */
function formatGridStyle(columns: number, gap: string, indent: string): string {
  return [
    "style={{",
    `${indent}  display: "grid",`,
    `${indent}  "grid-template-columns": "repeat(${columns}, 1fr)",`,
    `${indent}  gap: "${gap}",`,
    `${indent}}}`,
  ].join("\n");
}

/**
 * Re-indent a JSX block to a new base indentation level.
 */
function reindentJsx(jsx: string, newIndent: string): string {
  const lines = jsx.split("\n");
  // Find the minimum indentation of non-empty lines
  const minIndent = lines
    .filter((line) => line.trim().length > 0)
    .reduce((min, line) => {
      const match = line.match(/^(\s*)/);
      const lineIndent = match ? match[1].length : 0;
      return Math.min(min, lineIndent);
    }, Number.POSITIVE_INFINITY);

  // Re-indent all lines
  return lines
    .map((line) => {
      if (line.trim().length === 0) return "";
      return newIndent + line.slice(minIndent);
    })
    .join("\n");
}

function wrapInLayout(
  chartJsx: string[],
  layout: LayoutTemplate,
  charts: ChartInstance[],
  indent = "  ",
): string {
  if (layout.type === "single") {
    return chartJsx[0] ?? "";
  }

  if (layout.type === "grid") {
    const gap = layout.gap ?? "1rem";
    const styleLines = formatGridStyle(layout.columns, gap, indent);
    const reindentedCharts = chartJsx.map((jsx) => reindentJsx(jsx, indent));
    return `<div\n${indent}${styleLines}\n>\n${reindentedCharts.join("\n")}\n</div>`;
  }

  if (layout.type === "cards") {
    // Wrap each chart in a card with optional label
    const cards = chartJsx.map((jsx, i) => {
      const chart = charts[i];
      const label = chart?.label;
      const contentIndent = `${indent}  `; // 4 spaces for content inside card
      const reindentedJsx = reindentJsx(jsx, contentIndent);
      if (label) {
        return `${indent}<div class="card">\n${contentIndent}<h2>${label}</h2>\n${reindentedJsx}\n${indent}</div>`;
      }
      return `${indent}<div class="card">\n${reindentedJsx}\n${indent}</div>`;
    });

    const cols = layout.columns ?? charts.length;
    const gap = layout.gap ?? "1rem";
    const styleLines = formatGridStyle(cols, gap, indent);
    return `<div\n${indent}${styleLines}\n>\n${cards.join("\n")}\n</div>`;
  }

  return chartJsx.join("\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// Import Generation
// ─────────────────────────────────────────────────────────────────────────────

function generateImports(charts: ChartInstance[]): string {
  const imports = new Set<string>();

  for (const chart of charts) {
    const info = getSolidComponentInfo(chart);
    imports.add(info.name);
  }

  return `import { ${[...imports].sort().join(", ")} } from "@microviz/solid";`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Interactive Solid Generation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate Solid code for interactive presets.
 * Solid components don't support built-in interactivity yet.
 * This shows how to use createSignal and onMount for event handling.
 */
function generateInteractiveSolid(
  preset: UnifiedPreset,
  context: GeneratorContext,
): GeneratedCode {
  const chart = preset.charts[0];
  if (!chart || !preset.interactive) {
    throw new Error(
      "Interactive preset must have a chart and interactive config",
    );
  }

  const chartSeed = `${context.seed}:${chart.id}:0`;
  const data = generateDataForShape(chart.dataShape, chartSeed);

  // Format data for display
  let dataValue: string;
  switch (data.type) {
    case "series":
      dataValue = `[${data.values.join(", ")}]`;
      break;
    case "segments":
      dataValue = JSON.stringify(data.segments, null, 2);
      break;
    case "delta":
      dataValue = JSON.stringify({
        current: data.current,
        max: data.max,
        previous: data.previous,
      });
      break;
    case "value":
      dataValue = JSON.stringify({ max: data.max, value: data.value });
      break;
    case "csv":
      dataValue = `\`${data.content}\``;
      break;
  }

  const spec = inferSpecFromDataKind(chart);
  const { initialText } = preset.interactive;

  // For interactive charts in Solid, show manual hit testing pattern
  const code = `import { createSignal, onMount } from "solid-js";
import { MicrovizChart } from "@microviz/solid";

export function InteractiveChart() {
  const [hitInfo, setHitInfo] = createSignal("${initialText}");
  let chartRef: HTMLDivElement | undefined;

  // Data for the chart
  const data = () => ${dataValue};

  // Note: Solid components render pure SVG without built-in hit testing.
  // For interactivity, use Web Components or implement custom hit detection.

  return (
    <>
      <div ref={chartRef}>
        <MicrovizChart
          input={{
            data: data(),
            spec: ${spec},
            size: { width: ${chart.width}, height: ${chart.height} },
          }}
        />
      </div>
      <div id="output">{hitInfo()}</div>
    </>
  );
}`;

  return {
    copyable: code,
    display: code,
    language: "tsx",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Generator
// ─────────────────────────────────────────────────────────────────────────────

export function generateSolid(
  preset: UnifiedPreset,
  context: GeneratorContext,
): GeneratedCode {
  // Use special interactive generator for interactive presets
  if (preset.interactive) {
    return generateInteractiveSolid(preset, context);
  }

  const { charts, layout } = preset;

  // Generate JSX for each chart
  const chartJsx = charts.map((chart, i) => {
    const chartSeed = `${context.seed}:${chart.id}:${i}`;
    return generateSolidElement(chart, chartSeed);
  });

  // Wrap in layout
  const body = wrapInLayout(chartJsx, layout, charts);

  // Display code (compact, no imports)
  const display = body;

  // Copyable code (full, with imports)
  const imports = generateImports(charts);
  const copyable = `${imports}

export function Chart() {
  return (
    ${body}
  );
}`;

  return {
    copyable,
    display,
    language: "tsx",
  };
}
