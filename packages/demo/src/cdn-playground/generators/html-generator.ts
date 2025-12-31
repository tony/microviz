/**
 * HTML code generator for CDN playground.
 * Generates HTML code from unified presets.
 *
 * NOTE: This generates CODE STRINGS for display in a code editor.
 * The output is not executed directly - it's shown to users as example code.
 */

import type {
  ChartInstance,
  InteractiveConfig,
  LayoutTemplate,
  UnifiedPreset,
} from "../unified-presets";
import { generateFormattedData } from "./data-generator";
import type { GeneratedCode, GeneratorContext } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// HTML Element Generation
// ─────────────────────────────────────────────────────────────────────────────

function generateHtmlElement(chart: ChartInstance, seed: string): string {
  const { element, width, height, spec, dataKind, extraAttrs } = chart;
  const data = generateFormattedData(chart.dataShape, seed);

  const attrs: string[] = [];

  // Data attribute - use single quotes for JSON, double for simple values
  if (chart.dataShape.type === "series") {
    attrs.push(`data="${data}"`);
  } else {
    attrs.push(`data='${data}'`);
  }

  // Data kind for microviz-auto
  if (dataKind) {
    attrs.push(`data-kind="${dataKind}"`);
  }

  // Spec for microviz-chart
  if (spec && element === "microviz-chart") {
    attrs.push(`spec='${JSON.stringify(spec)}'`);
  }

  // Dimensions
  attrs.push(`width="${width}"`);
  attrs.push(`height="${height}"`);

  // Extra attributes
  if (extraAttrs) {
    for (const [key, value] of Object.entries(extraAttrs)) {
      if (value === "") {
        attrs.push(key); // Boolean attribute
      } else {
        attrs.push(`${key}="${value}"`);
      }
    }
  }

  return `<${element}\n        ${attrs.join("\n        ")}\n      ></${element}>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Layout Wrapper Generation
// ─────────────────────────────────────────────────────────────────────────────

function wrapInLayout(
  chartHtml: string[],
  layout: LayoutTemplate,
  charts: ChartInstance[],
): string {
  if (layout.type === "single") {
    return chartHtml[0] ?? "";
  }

  if (layout.type === "grid") {
    const gap = layout.gap ?? "1.5rem";
    return `<div class="grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: ${gap};">
      ${chartHtml.join("\n      ")}
    </div>`;
  }

  if (layout.type === "cards") {
    const cards = chartHtml.map((html, i) => {
      const chart = charts[i];
      const label = chart?.label;
      if (label) {
        return `<div class="card">
      <h2>${label}</h2>
      ${html}
    </div>`;
      }
      return `<div class="card">
      ${html}
    </div>`;
    });

    return `<div class="grid">
      ${cards.join("\n      ")}
    </div>`;
  }

  return chartHtml.join("\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// Style Generation
// ─────────────────────────────────────────────────────────────────────────────

function generateStyles(
  layout: LayoutTemplate,
  hasInteractive: boolean,
): string {
  const baseStyles = `body { font-family: system-ui, sans-serif; padding: 2rem; }
    h1 { font-size: 1.25rem; margin-bottom: 1rem; }`;

  let layoutStyles = "";
  if (layout.type === "grid" || layout.type === "cards") {
    layoutStyles = `
    .grid { display: grid; gap: 1.5rem; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
    .card {
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 1rem;
      background: #fff;
    }
    h2 { font-size: 0.875rem; margin: 0 0 0.5rem; color: #64748b; }`;
  }

  let interactiveStyles = "";
  if (hasInteractive) {
    interactiveStyles = `
    #output {
      margin-top: 1rem;
      padding: 0.5rem;
      background: #f1f5f9;
      border-radius: 0.25rem;
      font-size: 0.875rem;
      min-height: 1.5rem;
    }`;
  }

  return baseStyles + layoutStyles + interactiveStyles;
}

// ─────────────────────────────────────────────────────────────────────────────
// Interactive Script Generation
// ─────────────────────────────────────────────────────────────────────────────

function generateInteractiveScript(
  interactive: InteractiveConfig,
  chartId: string,
): string {
  return `
  <script type="module">
    const chart = document.getElementById('${chartId}');
    const output = document.getElementById('${interactive.outputId}');

    chart.addEventListener('${interactive.eventType}', (e) => {
      const { hit, client } = e.detail;
      if (hit) {
        output.textContent = \`Hovered: \${hit.markId} at (\${Math.round(client.x)}, \${Math.round(client.y)})\`;
      } else {
        output.textContent = '${interactive.initialText}';
      }
    });
  </script>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// CSP-Safe Generator (Special Case)
// NOTE: This generates example CODE for users to copy - uses renderSvgString
// which returns a string that the user's code will insert into their DOM.
// ─────────────────────────────────────────────────────────────────────────────

function generateCspSafeHtml(
  preset: UnifiedPreset,
  context: GeneratorContext,
): string {
  const chart = preset.charts[0];
  if (!chart) return "";

  const data = generateFormattedData(chart.dataShape, `${context.seed}:csp`);
  const arrayData = `[${data.split(", ").join(", ")}]`;

  // Use GitHub URLs if source is esm-sh-gh, otherwise npm (future)
  const useGitHub = context.cdnSource.type === "esm-sh-gh";
  const base = `gh/tony/microviz@${__GIT_BRANCH__}/packages`;
  const coreUrl = useGitHub
    ? `https://esm.sh/${base}/core/src/index.ts`
    : "https://esm.sh/@microviz/core";
  // Renderers imports from core internally, so need ?alias for esm.sh to resolve it
  const renderersUrl = useGitHub
    ? `https://esm.sh/${base}/renderers/src/index.ts?alias=@microviz/core:${base}/core/src/index.ts`
    : "https://esm.sh/@microviz/renderers";

  // This is GENERATED CODE shown in the editor - the renderSvgString API
  // is the documented way to use microviz in CSP-restricted environments.
  // The SVG string output is safe (generated by the library, not user input).
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>CSP-Safe Microviz</title>
  <script type="importmap">
    {
      "imports": {
        "@microviz/core": "${coreUrl}",
        "@microviz/renderers": "${renderersUrl}"
      }
    }
  </script>
  <style>
    body { font-family: system-ui, sans-serif; padding: 2rem; }
    h1 { font-size: 1.25rem; margin-bottom: 1rem; }
    p { color: #64748b; font-size: 0.875rem; margin-bottom: 1rem; }
  </style>
</head>
<body>
  <h1>CSP-Safe Rendering</h1>
  <p>Uses @microviz/core + @microviz/renderers directly (no Web Components)</p>
  <div id="chart"></div>

  <script type="module">
    import { computeModel } from '@microviz/core';
    import { renderSvgString } from '@microviz/renderers';

    const model = computeModel({
      data: ${arrayData},
      spec: { type: 'sparkline' },
      size: { width: ${chart.width}, height: ${chart.height} }
    });

    // renderSvgString returns safe SVG markup generated by microviz
    const svgMarkup = renderSvgString(model);
    document.getElementById('chart').insertAdjacentHTML('beforeend', svgMarkup);
    console.log('Chart rendered with', model.marks.length, 'marks');
  </script>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// CDN Dev Preview Generator (Special Case)
// ─────────────────────────────────────────────────────────────────────────────

function generateCdnDevPreviewHtml(
  preset: UnifiedPreset,
  context: GeneratorContext,
): string {
  const chart = preset.charts[0];
  if (!chart) return "";

  const data = generateFormattedData(
    chart.dataShape,
    `${context.seed}:preview`,
  );
  const cdnPattern =
    preset.customCdnPattern ??
    "https://cdn-dev.microviz.org/preview/pr/1/sha/REPLACE_SHA";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Microviz CDN Dev Preview</title>
  <script type="module">
    // Replace with your PR/sha build output:
    const base = "${cdnPattern}";
    await import(\`\${base}/@microviz/elements/cdn/microviz.js\`);
  </script>
  <style>
    body { font-family: system-ui, sans-serif; padding: 2rem; }
    h1 { font-size: 1.25rem; margin-bottom: 1rem; }
  </style>
</head>
<body>
  <h1>CDN Dev Preview</h1>
  <microviz-sparkline
    data="${data}"
    width="${chart.width}"
    height="${chart.height}"
  ></microviz-sparkline>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Generator
// ─────────────────────────────────────────────────────────────────────────────

export function generateHtml(
  preset: UnifiedPreset,
  context: GeneratorContext,
): GeneratedCode {
  // Handle special cases
  if (preset.cspSafe) {
    const html = generateCspSafeHtml(preset, context);
    return { copyable: html, display: html, language: "html" };
  }

  if (preset.customCdnPattern) {
    const html = generateCdnDevPreviewHtml(preset, context);
    return { copyable: html, display: html, language: "html" };
  }

  const { charts, layout, interactive, name } = preset;

  // Generate HTML for each chart
  const chartHtml = charts.map((chart, i) => {
    const chartSeed = `${context.seed}:${chart.id}:${i}`;
    return generateHtmlElement(chart, chartSeed);
  });

  // Wrap in layout
  const body = wrapInLayout(chartHtml, layout, charts);

  // Generate styles
  const styles = generateStyles(layout, !!interactive);

  // Generate interactive script
  let script = "";
  if (interactive) {
    const interactiveChart = charts.find((c) => c.extraAttrs?.id);
    const chartId = interactiveChart?.extraAttrs?.id ?? "myChart";
    script = generateInteractiveScript(interactive, chartId);
  }

  // Output element for interactive
  const outputElement = interactive
    ? `\n  <div id="${interactive.outputId}">${interactive.initialText}</div>`
    : "";

  // Full HTML document
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Microviz ${name}</title>
  <script type="module">
    import "{{CDN_URL}}";
  </script>
  <style>
    ${styles}
  </style>
</head>
<body>
  <h1>${name}</h1>
  ${body}${outputElement}${script}
</body>
</html>`;

  return {
    copyable: html,
    display: html,
    language: "html",
  };
}
