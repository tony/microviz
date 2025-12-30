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
// Data Formatting for JSX
// ─────────────────────────────────────────────────────────────────────────────

function formatDataForJsx(chart: ChartInstance, seed: string): string {
  const data = generateDataForShape(chart.dataShape, seed);

  switch (data.type) {
    case "series":
      // Array literal: [10, 25, 15, 30]
      return `[${data.values.join(", ")}]`;
    case "segments":
      // Array of objects with proper formatting
      return JSON.stringify(data.segments);
    case "delta":
    case "value":
      return data.formatted;
    case "csv":
      // Template literal for multiline
      return `\`${data.content}\``;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// JSX Element Generation
// ─────────────────────────────────────────────────────────────────────────────

function generateJsxElement(
  chart: ChartInstance,
  seed: string,
  indent = "  ",
): string {
  const info = getReactComponentInfo(chart);
  const dataValue = formatDataForJsx(chart, seed);

  const props: string[] = [];

  // Data prop
  if (info.propsStyle === "data") {
    props.push(`data={${dataValue}}`);
  } else {
    // MicrovizChart uses input prop
    const spec = chart.spec
      ? JSON.stringify(chart.spec)
      : '{ type: "sparkline" }';
    props.push("input={{");
    props.push(`    data: ${dataValue},`);
    props.push(`    spec: ${spec},`);
    props.push(`    size: { width: ${chart.width}, height: ${chart.height} },`);
    props.push("  }}");
  }

  // Dimensions (for data-style components)
  if (info.propsStyle === "data") {
    props.push(`width={${chart.width}}`);
    props.push(`height={${chart.height}}`);
  }

  // Handle interactive preset
  if (chart.extraAttrs?.interactive !== undefined) {
    props.push("interactive");
  }
  if (chart.extraAttrs?.["hit-slop"]) {
    props.push(`hitSlop={${chart.extraAttrs["hit-slop"]}}`);
  }

  // Format props
  if (info.propsStyle === "input") {
    // Multi-line for input prop
    return `<${info.name}\n${indent}  ${props.join(`\n${indent}  `)}\n${indent}/>`;
  }

  // Single line for simple props
  return `<${info.name} ${props.join(" ")} />`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Layout Wrapper Generation
// ─────────────────────────────────────────────────────────────────────────────

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
    const style = `{{ display: "grid", gridTemplateColumns: "repeat(${layout.columns}, 1fr)", gap: "${layout.gap ?? "1rem"}" }}`;
    return `<div style={${style}}>\n${indent}${chartJsx.join(`\n${indent}`)}\n</div>`;
  }

  if (layout.type === "cards") {
    // Wrap each chart in a card with optional label
    const cards = chartJsx.map((jsx, i) => {
      const chart = charts[i];
      const label = chart?.label;
      if (label) {
        return `<div className="card">\n${indent}  <h2>${label}</h2>\n${indent}  ${jsx}\n${indent}</div>`;
      }
      return `<div className="card">\n${indent}  ${jsx}\n${indent}</div>`;
    });

    const cols = layout.columns ?? charts.length;
    const style = `{{ display: "grid", gridTemplateColumns: "repeat(${cols}, 1fr)", gap: "1rem" }}`;
    return `<div style={${style}}>\n${indent}${cards.join(`\n${indent}`)}\n</div>`;
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
