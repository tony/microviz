/**
 * Framework wrapper definitions for the CDN playground.
 * Each wrapper transforms preset HTML into framework-specific code.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type Wrapper = {
  id: string;
  name: string;
  description: string;
  /** Transform preset HTML to this wrapper's syntax */
  transform: (presetHtml: string, cdnUrl: string) => string;
};

type ChartInfo = {
  tag: string;
  data: string;
  spec: string | null;
  dataKind: string | null;
  width: string;
  height: string;
  interactive: boolean;
  hitSlop: string | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// Chart extraction from preset HTML
// ─────────────────────────────────────────────────────────────────────────────

const CHART_REGEX =
  /<(microviz-(?:sparkline|chart|auto))\s+([^>]*)><\/\1>|<(microviz-(?:sparkline|chart|auto))\s+([^>]*)>/gi;

function extractAttr(attrs: string, name: string): string | null {
  // Handle both single and double quotes, and boolean attrs
  const match = attrs.match(
    new RegExp(`\\b${name}(?:=(?:"([^"]*)"|'([^']*)'|([^\\s>]+)))?`, "i"),
  );
  if (!match) return null;
  // Boolean attribute (no value)
  if (!match[1] && !match[2] && !match[3]) return "";
  return match[1] ?? match[2] ?? match[3] ?? null;
}

function extractCharts(html: string): ChartInfo[] {
  const charts: ChartInfo[] = [];
  const matches = html.matchAll(CHART_REGEX);

  for (const match of matches) {
    const tag = (match[1] ?? match[3]).toLowerCase();
    const attrs = match[2] ?? match[4];

    charts.push({
      data: extractAttr(attrs, "data") ?? "[]",
      dataKind: extractAttr(attrs, "data-kind"),
      height: extractAttr(attrs, "height") ?? "32",
      hitSlop: extractAttr(attrs, "hit-slop"),
      interactive: extractAttr(attrs, "interactive") !== null,
      spec: extractAttr(attrs, "spec"),
      tag,
      width: extractAttr(attrs, "width") ?? "200",
    });
  }

  return charts;
}

function extractTitle(html: string): string {
  const match = html.match(/<title>([^<]*)<\/title>/i);
  return match?.[1] ?? "Microviz Demo";
}

function extractStyles(html: string): string {
  const match = html.match(/<style>([\s\S]*?)<\/style>/i);
  return match?.[1]?.trim() ?? "";
}

// ─────────────────────────────────────────────────────────────────────────────
// Web Components (default - no transform needed)
// ─────────────────────────────────────────────────────────────────────────────

function transformWebComponents(html: string, cdnUrl: string): string {
  return html.replace(/\{\{CDN_URL\}\}/g, cdnUrl);
}

// ─────────────────────────────────────────────────────────────────────────────
// Preact + HTM
// ─────────────────────────────────────────────────────────────────────────────

function transformPreactHtm(html: string, cdnUrl: string): string {
  const charts = extractCharts(html);
  const title = extractTitle(html);
  const styles = extractStyles(html);

  if (charts.length === 0) {
    return transformWebComponents(html, cdnUrl);
  }

  const chartComponents = charts
    .map((chart, i) => {
      const specAttr = chart.spec ? ` spec='${chart.spec}'` : "";
      const dataKindAttr = chart.dataKind
        ? ` data-kind="${chart.dataKind}"`
        : "";
      const interactiveAttr = chart.interactive ? " interactive" : "";
      const hitSlopAttr = chart.hitSlop ? ` hit-slop="${chart.hitSlop}"` : "";

      return `        <${chart.tag}${dataKindAttr}${specAttr} .data=\${data${i}}${interactiveAttr}${hitSlopAttr} width="${chart.width}" height="${chart.height}"></${chart.tag}>`;
    })
    .join("\n");

  const dataStates = charts
    .map((chart, i) => `      const [data${i}] = useState(${chart.data});`)
    .join("\n");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <script type="module">
    import { h, render } from 'https://esm.sh/preact';
    import { useState } from 'https://esm.sh/preact/hooks';
    import htm from 'https://esm.sh/htm';
    import "${cdnUrl}";

    const html = htm.bind(h);

    function App() {
${dataStates}

      return html\`
        <div>
${chartComponents}
        </div>
      \`;
    }

    render(html\`<\${App} />\`, document.getElementById('app'));
  </script>
  <style>
    body { font-family: system-ui, sans-serif; padding: 2rem; }
    ${styles}
  </style>
</head>
<body>
  <div id="app"></div>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Lit
// ─────────────────────────────────────────────────────────────────────────────

function transformLit(html: string, cdnUrl: string): string {
  const charts = extractCharts(html);
  const title = extractTitle(html);
  const styles = extractStyles(html);

  if (charts.length === 0) {
    return transformWebComponents(html, cdnUrl);
  }

  const chartTemplates = charts
    .map((chart, i) => {
      const specAttr = chart.spec ? ` spec='${chart.spec}'` : "";
      const dataKindAttr = chart.dataKind
        ? ` data-kind="${chart.dataKind}"`
        : "";
      const interactiveAttr = chart.interactive ? " interactive" : "";
      const hitSlopAttr = chart.hitSlop ? ` hit-slop="${chart.hitSlop}"` : "";

      return `          <${chart.tag}${dataKindAttr}${specAttr} .data=\${this.data${i}}${interactiveAttr}${hitSlopAttr} width="${chart.width}" height="${chart.height}"></${chart.tag}>`;
    })
    .join("\n");

  const properties = charts
    .map((_chart, i) => `        data${i}: { state: true },`)
    .join("\n");

  const initializers = charts
    .map((chart, i) => `      this.data${i} = ${chart.data};`)
    .join("\n");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <script type="module">
    import { LitElement, html } from 'https://esm.sh/lit';
    import "${cdnUrl}";

    class DemoApp extends LitElement {
      static properties = {
${properties}
      };

      constructor() {
        super();
${initializers}
      }

      render() {
        return html\`
          <div>
${chartTemplates}
          </div>
        \`;
      }
    }

    customElements.define('demo-app', DemoApp);
  </script>
  <style>
    body { font-family: system-ui, sans-serif; padding: 2rem; }
    ${styles}
  </style>
</head>
<body>
  <demo-app></demo-app>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Solid
// ─────────────────────────────────────────────────────────────────────────────

function transformSolid(html: string, cdnUrl: string): string {
  const charts = extractCharts(html);
  const title = extractTitle(html);
  const styles = extractStyles(html);

  if (charts.length === 0) {
    return transformWebComponents(html, cdnUrl);
  }

  const signals = charts
    .map((chart, i) => `    const [data${i}] = createSignal(${chart.data});`)
    .join("\n");

  const chartJsx = charts
    .map((chart, i) => {
      const specAttr = chart.spec ? ` spec='${chart.spec}'` : "";
      const dataKindAttr = chart.dataKind
        ? ` data-kind="${chart.dataKind}"`
        : "";
      const interactiveAttr = chart.interactive ? " interactive" : "";
      const hitSlopAttr = chart.hitSlop ? ` hit-slop="${chart.hitSlop}"` : "";

      return `        <${chart.tag}${dataKindAttr}${specAttr} data={JSON.stringify(data${i}())}${interactiveAttr}${hitSlopAttr} width="${chart.width}" height="${chart.height}"></${chart.tag}>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <script type="module">
    import { createSignal } from 'https://esm.sh/solid-js';
    import { render } from 'https://esm.sh/solid-js/web';
    import html from 'https://esm.sh/solid-js/html';
    await import("${cdnUrl}");

    function App() {
${signals}

      return html\`
        <div>
${chartJsx}
        </div>
      \`;
    }

    render(App, document.getElementById('app'));
  </script>
  <style>
    body { font-family: system-ui, sans-serif; padding: 2rem; }
    ${styles}
  </style>
</head>
<body>
  <div id="app"></div>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Petite Vue
// ─────────────────────────────────────────────────────────────────────────────

function transformPetiteVue(html: string, cdnUrl: string): string {
  const charts = extractCharts(html);
  const title = extractTitle(html);
  const styles = extractStyles(html);

  if (charts.length === 0) {
    return transformWebComponents(html, cdnUrl);
  }

  const chartTemplates = charts
    .map((chart, i) => {
      const specAttr = chart.spec ? ` spec='${chart.spec}'` : "";
      const dataKindAttr = chart.dataKind
        ? ` data-kind="${chart.dataKind}"`
        : "";
      const interactiveAttr = chart.interactive ? " interactive" : "";
      const hitSlopAttr = chart.hitSlop ? ` hit-slop="${chart.hitSlop}"` : "";

      return `    <${chart.tag}${dataKindAttr}${specAttr} :data="JSON.stringify(data${i})"${interactiveAttr}${hitSlopAttr} width="${chart.width}" height="${chart.height}"></${chart.tag}>`;
    })
    .join("\n");

  const dataProperties = charts
    .map((chart, i) => `        data${i}: ${chart.data},`)
    .join("\n");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <script type="module">
    import { createApp } from 'https://esm.sh/petite-vue';
    await import("${cdnUrl}");

    createApp({
${dataProperties}
    }).mount('#app');
  </script>
  <style>
    body { font-family: system-ui, sans-serif; padding: 2rem; }
    ${styles}
  </style>
</head>
<body>
  <div id="app" v-scope>
${chartTemplates}
  </div>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Wrapper Definitions
// ─────────────────────────────────────────────────────────────────────────────

export const WRAPPERS: Wrapper[] = [
  {
    description: "Native custom elements (default)",
    id: "elements",
    name: "Web Components",
    transform: transformWebComponents,
  },
  {
    description: "Lightweight React alternative with tagged templates",
    id: "preact-htm",
    name: "Preact + HTM",
    transform: transformPreactHtm,
  },
  {
    description: "Fast, simple web components library",
    id: "lit",
    name: "Lit",
    transform: transformLit,
  },
  {
    description: "Reactive UI library with fine-grained updates",
    id: "solid",
    name: "Solid",
    transform: transformSolid,
  },
  {
    description: "Lightweight Vue for progressive enhancement",
    id: "petite-vue",
    name: "Petite Vue",
    transform: transformPetiteVue,
  },
];

export const DEFAULT_WRAPPER = WRAPPERS[0];

export function findWrapper(id: string): Wrapper | undefined {
  return WRAPPERS.find((w) => w.id === id);
}
