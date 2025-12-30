/**
 * JSX code generator for React playground.
 * Generates React/JSX code from unified presets.
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

type ReactComponentInfo = {
  name: string;
  importFrom: "@microviz/react";
  propsStyle: "data" | "input";
};

function getReactComponentInfo(chart: ChartInstance): ReactComponentInfo {
  const { chartType, element } = chart;

  // microviz-sparkline → Sparkline
  if (element === "microviz-sparkline") {
    return {
      importFrom: "@microviz/react",
      name: "Sparkline",
      propsStyle: "data",
    };
  }

  // microviz-auto doesn't have a direct React equivalent yet
  // For now, use MicrovizChart with appropriate spec
  if (element === "microviz-auto") {
    return {
      importFrom: "@microviz/react",
      name: "MicrovizChart",
      propsStyle: "input",
    };
  }

  // microviz-chart with various specs
  switch (chartType) {
    case "sparkline":
      return {
        importFrom: "@microviz/react",
        name: "Sparkline",
        propsStyle: "data",
      };
    case "sparkline-bars":
      return { importFrom: "@microviz/react", name: "Bar", propsStyle: "data" };
    case "donut":
      return {
        importFrom: "@microviz/react",
        name: "MicrovizChart",
        propsStyle: "input",
      };
    default:
      return {
        importFrom: "@microviz/react",
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

// ─────────────────────────────────────────────────────────────────────────────
// Data Formatting for JSX
// ─────────────────────────────────────────────────────────────────────────────

function formatDataForJsx(
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
// JSX Element Generation
// ─────────────────────────────────────────────────────────────────────────────

function generateJsxElement(chart: ChartInstance, seed: string): string {
  const info = getReactComponentInfo(chart);

  // For "data" style components (Sparkline, Bar, etc.)
  if (info.propsStyle === "data") {
    const dataResult = formatDataForJsx(chart, seed, "  ");
    const lines = [
      `<${info.name}`,
      `  data={${dataResult.value}}`,
      `  width={${chart.width}}`,
      `  height={${chart.height}}`,
    ];

    // Handle interactive preset
    if (chart.extraAttrs?.interactive !== undefined) {
      lines.push("  interactive");
    }
    if (chart.extraAttrs?.["hit-slop"]) {
      lines.push(`  hitSlop={${chart.extraAttrs["hit-slop"]}}`);
    }

    lines.push("/>");
    return lines.join("\n");
  }

  // For MicrovizChart with input prop
  // baseIndent = "    " (4 spaces) matches where `data:` prop sits inside input={{}}
  const dataResult = formatDataForJsx(chart, seed, "    ");
  const spec = chart.spec ? formatSpec(chart.spec) : '{ type: "sparkline" }';

  const lines = [
    `<${info.name}`,
    "  input={{",
    `    data: ${dataResult.value},`,
    `    spec: ${spec},`,
    `    size: { width: ${chart.width}, height: ${chart.height} },`,
    "  }}",
  ];

  // Handle interactive preset
  if (chart.extraAttrs?.interactive !== undefined) {
    lines.push("  interactive");
  }
  if (chart.extraAttrs?.["hit-slop"]) {
    lines.push(`  hitSlop={${chart.extraAttrs["hit-slop"]}}`);
  }

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
    `${indent}  gridTemplateColumns: "repeat(${columns}, 1fr)",`,
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
        return `${indent}<div className="card">\n${contentIndent}<h2>${label}</h2>\n${reindentedJsx}\n${indent}</div>`;
      }
      return `${indent}<div className="card">\n${reindentedJsx}\n${indent}</div>`;
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
    const info = getReactComponentInfo(chart);
    imports.add(info.name);
  }

  return `import { ${[...imports].sort().join(", ")} } from "@microviz/react";`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Interactive Code Generation
// ─────────────────────────────────────────────────────────────────────────────

function generateInteractiveCode(preset: UnifiedPreset): string {
  if (!preset.interactive) return "";

  return `
function handleHit(event) {
  const { hit, client } = event.detail;
  const output = document.getElementById("${preset.interactive.outputId}");
  if (hit) {
    output.textContent = \`Hovered: \${hit.markId} at (\${Math.round(client.x)}, \${Math.round(client.y)})\`;
  } else {
    output.textContent = "${preset.interactive.initialText}";
  }
}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Generator
// ─────────────────────────────────────────────────────────────────────────────

export function generateJsx(
  preset: UnifiedPreset,
  context: GeneratorContext,
): GeneratedCode {
  const { charts, layout } = preset;

  // Generate JSX for each chart
  const chartJsx = charts.map((chart, i) => {
    const chartSeed = `${context.seed}:${chart.id}:${i}`;
    return generateJsxElement(chart, chartSeed);
  });

  // Wrap in layout
  const body = wrapInLayout(chartJsx, layout, charts);

  // Display code (compact, no imports)
  const display = body;

  // Copyable code (full, with imports)
  const imports = generateImports(charts);
  const interactiveCode = generateInteractiveCode(preset);

  let copyable: string;
  if (preset.interactive) {
    copyable = `${imports}
${interactiveCode}

export function Chart() {
  return (
    <>
      ${body}
      <div id="${preset.interactive.outputId}">${preset.interactive.initialText}</div>
    </>
  );
}`;
  } else {
    copyable = `${imports}

export function Chart() {
  return (
    ${body}
  );
}`;
  }

  return {
    copyable,
    display,
    language: "tsx",
  };
}
