/**
 * Type-safe preset registry for CDN playground.
 *
 * This registry uses TypeScript's mapped types to ensure presets exist for ALL wrappers.
 * Adding a new WrapperType will cause a compile error until presets are added.
 */

import type { CdnSource } from "./cdnSources";

export type WrapperType = "elements" | "solid" | "react";

export const WRAPPER_TYPES: WrapperType[] = ["elements", "solid", "react"];

export const WRAPPER_LABELS: Record<WrapperType, string> = {
  elements: "Elements",
  react: "React",
  solid: "Solid.js",
};

export type PresetDataType =
  | "sparkline"
  | "bars"
  | "donut"
  | "dashboard"
  | "auto"
  | "auto-csv"
  | "auto-override"
  | "none";

export type PresetDataConfig = {
  type: PresetDataType;
  length?: number;
  segmentCount?: number;
  supportsReactiveUpdates: boolean;
};

export type PresetTemplate = {
  id: string;
  name: string;
  description: string;
  codeFactory: (cdnUrl: string) => string;
  dataConfig: PresetDataConfig;
};

export type WrapperConfig = {
  presets: PresetTemplate[];
  defaultPresetId: string;
  getCdnUrl: (source: CdnSource) => string;
};

/**
 * Type-enforced registry - must have entry for EVERY WrapperType.
 * TypeScript will error if a wrapper is missing.
 */
export type PresetRegistry = {
  [K in WrapperType]: WrapperConfig;
};

// CDN URL getters
function getElementsCdnUrl(source: CdnSource): string {
  switch (source.type) {
    case "cdn-dev":
      return "https://cdn-dev.microviz.org/canary/next/latest/@microviz/elements/cdn/microviz.js";
    case "local":
      return "/cdn/microviz.js";
    case "jsdelivr":
      return "https://cdn.jsdelivr.net/npm/@microviz/elements/cdn/microviz.js";
    case "unpkg":
      return "https://unpkg.com/@microviz/elements/cdn/microviz.js";
    case "esm-sh":
      return "https://esm.sh/@microviz/elements";
    case "custom":
      return source.url;
  }
}

function getSolidCdnUrl(source: CdnSource): string {
  switch (source.type) {
    case "cdn-dev":
      return "https://cdn-dev.microviz.org/canary/next/latest/@microviz/solid/dist/solid.js";
    case "local":
      return "/cdn/solid.js";
    case "jsdelivr":
      return "https://cdn.jsdelivr.net/npm/@microviz/solid/dist/solid.js";
    case "unpkg":
      return "https://unpkg.com/@microviz/solid/dist/solid.js";
    case "esm-sh":
      return "https://esm.sh/@microviz/solid";
    case "custom":
      return source.url.replace(/microviz\.js$/, "solid.js");
  }
}

function getReactCdnUrl(source: CdnSource): string {
  switch (source.type) {
    case "cdn-dev":
      return "https://cdn-dev.microviz.org/canary/next/latest/@microviz/react/dist/react.js";
    case "local":
      return "/cdn/react.js";
    case "jsdelivr":
      return "https://cdn.jsdelivr.net/npm/@microviz/react/dist/react.js";
    case "unpkg":
      return "https://unpkg.com/@microviz/react/dist/react.js";
    case "esm-sh":
      return "https://esm.sh/@microviz/react";
    case "custom":
      return source.url.replace(/microviz\.js$/, "react.js");
  }
}

// Elements presets
const ELEMENTS_PRESETS: PresetTemplate[] = [
  {
    codeFactory: (cdnUrl) => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Microviz Auto Inference</title>
  <script type="module">
    import "${cdnUrl}";
  </script>
  <style>
    body { font-family: system-ui, sans-serif; padding: 2rem; }
    h1 { font-size: 1.25rem; margin-bottom: 1rem; }
    h2 { font-size: 0.875rem; margin: 0 0 0.5rem; color: #64748b; }
    .grid { display: grid; gap: 1.5rem; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
    .card {
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 1rem;
      background: #fff;
    }
    .note { font-size: 0.75rem; color: #94a3b8; margin-top: 0.5rem; }
  </style>
</head>
<body>
  <h1>Auto Inference (Basics)</h1>
  <div class="grid">
    <div class="card">
      <h2>Series → Sparkline</h2>
      <microviz-auto
        data-kind="series"
        data="10, 25, 15, 30, 20"
        width="200"
        height="32"
      ></microviz-auto>
    </div>
    <div class="card">
      <h2>Delta → Bullet</h2>
      <microviz-auto
        data-kind="delta"
        data='{"current":12,"previous":9,"max":20}'
        width="220"
        height="40"
      ></microviz-auto>
    </div>
    <div class="card">
      <h2>Segments → Donut</h2>
      <microviz-auto
        data-kind="segments"
        data='[{"pct":62,"color":"#6366f1","name":"Desktop"},{"pct":28,"color":"#22c55e","name":"Mobile"},{"pct":10,"color":"#f59e0b","name":"Tablet"}]'
        width="140"
        height="140"
      ></microviz-auto>
    </div>
    <div class="card">
      <h2>Value → Bar</h2>
      <microviz-auto
        data-kind="value"
        data='{"value":12,"max":20}'
        width="220"
        height="32"
      ></microviz-auto>
      <div class="note">Auto picks the bar renderer from a value object.</div>
    </div>
  </div>
</body>
</html>`,
    dataConfig: {
      length: 5,
      segmentCount: 3,
      supportsReactiveUpdates: true,
      type: "auto",
    },
    description: "Auto chart inference for common data shapes",
    id: "auto-inference",
    name: "Auto Inference (Basics)",
  },
  {
    codeFactory: (cdnUrl) => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Microviz Sparkline</title>
  <script type="module">
    import "${cdnUrl}";
  </script>
  <style>
    body { font-family: system-ui, sans-serif; padding: 2rem; }
    h1 { font-size: 1.25rem; margin-bottom: 1rem; }
  </style>
</head>
<body>
  <h1>Sparkline</h1>
  <microviz-sparkline
    data="10, 25, 15, 30, 20, 35, 25, 40, 30"
    width="200"
    height="32"
  ></microviz-sparkline>
</body>
</html>`,
    dataConfig: {
      length: 9,
      supportsReactiveUpdates: true,
      type: "sparkline",
    },
    description: "Simple sparkline chart",
    id: "sparkline",
    name: "Sparkline",
  },
  {
    codeFactory: (cdnUrl) => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Microviz Bar Chart</title>
  <script type="module">
    import "${cdnUrl}";
  </script>
  <style>
    body { font-family: system-ui, sans-serif; padding: 2rem; }
    h1 { font-size: 1.25rem; margin-bottom: 1rem; }
  </style>
</head>
<body>
  <h1>Bar Chart</h1>
  <microviz-chart
    spec='{"type":"sparkline-bars"}'
    data="[65, 59, 80, 81, 56, 72, 68]"
    width="280"
    height="120"
  ></microviz-chart>
</body>
</html>`,
    dataConfig: {
      length: 7,
      supportsReactiveUpdates: true,
      type: "bars",
    },
    description: "Vertical bar chart with labels",
    id: "bar-chart",
    name: "Bar Chart",
  },
  {
    codeFactory: (cdnUrl) => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Microviz Donut</title>
  <script type="module">
    import "${cdnUrl}";
  </script>
  <style>
    body { font-family: system-ui, sans-serif; padding: 2rem; }
    h1 { font-size: 1.25rem; margin-bottom: 1rem; }
  </style>
</head>
<body>
  <h1>Donut Chart</h1>
  <microviz-chart
    spec='{"type":"donut"}'
    data='[{"pct":62,"color":"#6366f1","name":"Desktop"},{"pct":28,"color":"#22c55e","name":"Mobile"},{"pct":10,"color":"#f59e0b","name":"Tablet"}]'
    width="160"
    height="160"
  ></microviz-chart>
</body>
</html>`,
    dataConfig: {
      segmentCount: 3,
      supportsReactiveUpdates: true,
      type: "donut",
    },
    description: "Donut/pie chart with segments",
    id: "donut",
    name: "Donut Chart",
  },
  {
    codeFactory: (cdnUrl) => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Interactive Microviz</title>
  <script type="module">
    import "${cdnUrl}";
  </script>
  <style>
    body { font-family: system-ui, sans-serif; padding: 2rem; }
    h1 { font-size: 1.25rem; margin-bottom: 1rem; }
    #output {
      margin-top: 1rem;
      padding: 0.5rem;
      background: #f1f5f9;
      border-radius: 0.25rem;
      font-size: 0.875rem;
      min-height: 1.5rem;
    }
  </style>
</head>
<body>
  <h1>Interactive Chart</h1>
  <microviz-chart
    interactive
    hit-slop="8"
    spec='{"type":"sparkline"}'
    data="[6, 10, 7, 12, 9, 14, 11, 8, 15, 10, 13, 9]"
    width="280"
    height="64"
    id="myChart"
  ></microviz-chart>
  <div id="output">Hover over the chart...</div>

  <script type="module">
    const chart = document.getElementById('myChart');
    const output = document.getElementById('output');

    chart.addEventListener('microviz-hit', (e) => {
      const { hit, client } = e.detail;
      if (hit) {
        output.textContent = \`Hovered: \${hit.markId} at (\${Math.round(client.x)}, \${Math.round(client.y)})\`;
      } else {
        output.textContent = 'Hover over the chart...';
      }
    });
  </script>
</body>
</html>`,
    dataConfig: {
      length: 12,
      supportsReactiveUpdates: true,
      type: "sparkline",
    },
    description: "Chart with hover events",
    id: "interactive",
    name: "Interactive Chart",
  },
  {
    codeFactory: (cdnUrl) => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Microviz Dashboard</title>
  <script type="module">
    import "${cdnUrl}";
  </script>
  <style>
    body { font-family: system-ui, sans-serif; padding: 2rem; background: #f8fafc; }
    h1 { font-size: 1.5rem; margin-bottom: 1.5rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
    .card {
      background: white;
      padding: 1rem;
      border-radius: 0.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .card h2 { font-size: 0.875rem; color: #64748b; margin-bottom: 0.5rem; }
  </style>
</head>
<body>
  <h1>Dashboard</h1>
  <div class="grid">
    <div class="card">
      <h2>Revenue Trend</h2>
      <microviz-sparkline
        data="45, 52, 48, 61, 55, 67, 72"
        width="180"
        height="40"
      ></microviz-sparkline>
    </div>
    <div class="card">
      <h2>Sales by Region</h2>
      <microviz-chart
        spec='{"type":"sparkline-bars"}'
        data="[65, 45, 78, 52]"
        width="180"
        height="80"
      ></microviz-chart>
    </div>
    <div class="card">
      <h2>Traffic Sources</h2>
      <microviz-chart
        spec='{"type":"donut"}'
        data='[{"pct":45,"color":"#6366f1"},{"pct":30,"color":"#22c55e"},{"pct":25,"color":"#f59e0b"}]'
        width="100"
        height="100"
      ></microviz-chart>
    </div>
  </div>
</body>
</html>`,
    dataConfig: {
      supportsReactiveUpdates: true,
      type: "dashboard",
    },
    description: "Dashboard with multiple chart types",
    id: "multiple-charts",
    name: "Multiple Charts",
  },
  {
    codeFactory: () => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>CSP-Safe Microviz</title>
  <script type="importmap">
    {
      "imports": {
        "@microviz/core": "https://esm.sh/@microviz/core",
        "@microviz/renderers": "https://esm.sh/@microviz/renderers"
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
      data: [1, 4, 2, 5, 3, 6, 4, 7, 5, 8],
      spec: { type: 'sparkline' },
      size: { width: 200, height: 32 }
    });

    document.getElementById('chart').innerHTML = renderSvgString(model);
    console.log('Chart rendered with', model.marks.length, 'marks');
  </script>
</body>
</html>`,
    dataConfig: {
      length: 10,
      supportsReactiveUpdates: false,
      type: "none",
    },
    description: "Direct SVG rendering for restricted sandboxes",
    id: "csp-safe",
    name: "CSP-Safe (No Web Components)",
  },
];

// Solid.js presets
const SOLID_PRESETS: PresetTemplate[] = [
  {
    codeFactory: (cdnUrl) => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Microviz + Solid.js</title>
  <script type="importmap">
  {
    "imports": {
      "solid-js": "https://esm.sh/solid-js@1.9",
      "solid-js/web": "https://esm.sh/solid-js@1.9/web",
      "@microviz/core": "https://esm.sh/@microviz/core",
      "@microviz/renderers": "https://esm.sh/@microviz/renderers",
      "@microviz/solid": "${cdnUrl}"
    }
  }
  </script>
  <style>
    body {
      font-family: system-ui, sans-serif;
      padding: 2rem;
    }
    h1 {
      font-size: 1.25rem;
      margin-bottom: 1rem;
    }
    .chart-container {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    button {
      padding: 0.5rem 1rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.375rem;
      background: white;
      cursor: pointer;
    }
    button:hover {
      background: #f8fafc;
    }
    .note {
      margin-top: 1rem;
      font-size: 0.75rem;
      color: #64748b;
    }
  </style>
</head>
<body>
  <h1>Solid.js + Microviz</h1>
  <div class="chart-container">
    <div id="chart"></div>
    <button
      id="reroll"
      type="button"
    >
      Reroll Data
    </button>
  </div>
  <p class="note">Uses @microviz/solid imperative render functions (no JSX compilation needed).</p>

  <script type="module">
    import { computeModel } from '@microviz/core';
    import { renderSolidSvg } from '@microviz/solid';

    let dispose = null;

    function randomData(length) {
      return Array.from({ length }, () => Math.floor(Math.random() * 40) + 5);
    }

    function render(data) {
      if (dispose) dispose();

      const model = computeModel({
        data,
        spec: { type: 'sparkline' },
        size: { width: 200, height: 32 }
      });

      dispose = renderSolidSvg(
        document.getElementById('chart'),
        { model }
      );
    }

    // Initial render
    render([10, 25, 15, 30, 20, 35, 25]);

    // Reroll button
    document.getElementById('reroll').addEventListener('click', () => {
      render(randomData(7));
    });
  </script>
</body>
</html>`,
    dataConfig: {
      length: 7,
      supportsReactiveUpdates: false,
      type: "none",
    },
    description: "Solid.js imperative rendering (no JSX needed)",
    id: "sparkline",
    name: "Sparkline",
  },
  {
    codeFactory: (cdnUrl) => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Microviz + Solid.js Donut</title>
  <script type="importmap">
  {
    "imports": {
      "solid-js": "https://esm.sh/solid-js@1.9",
      "solid-js/web": "https://esm.sh/solid-js@1.9/web",
      "@microviz/core": "https://esm.sh/@microviz/core",
      "@microviz/renderers": "https://esm.sh/@microviz/renderers",
      "@microviz/solid": "${cdnUrl}"
    }
  }
  </script>
  <style>
    body {
      font-family: system-ui, sans-serif;
      padding: 2rem;
    }
    h1 {
      font-size: 1.25rem;
      margin-bottom: 1rem;
    }
    .chart-container {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    button {
      padding: 0.5rem 1rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.375rem;
      background: white;
      cursor: pointer;
    }
    button:hover {
      background: #f8fafc;
    }
    .note {
      margin-top: 1rem;
      font-size: 0.75rem;
      color: #64748b;
    }
  </style>
</head>
<body>
  <h1>Solid.js + Microviz Donut</h1>
  <div class="chart-container">
    <div id="chart"></div>
    <button
      id="reroll"
      type="button"
    >
      Reroll Data
    </button>
  </div>
  <p class="note">Donut chart with Solid.js fine-grained reactivity.</p>

  <script type="module">
    import { computeModel } from '@microviz/core';
    import { renderSolidSvg } from '@microviz/solid';

    let dispose = null;

    function randomSegments() {
      const values = [
        Math.floor(Math.random() * 40) + 20,
        Math.floor(Math.random() * 30) + 15,
        Math.floor(Math.random() * 20) + 10,
      ];
      const total = values.reduce((a, b) => a + b, 0);
      return [
        { pct: Math.round(values[0] / total * 100), color: '#6366f1', name: 'Desktop' },
        { pct: Math.round(values[1] / total * 100), color: '#22c55e', name: 'Mobile' },
        { pct: Math.round(values[2] / total * 100), color: '#f59e0b', name: 'Tablet' },
      ];
    }

    function render(data) {
      if (dispose) dispose();

      const model = computeModel({
        data,
        spec: { type: 'donut' },
        size: { width: 160, height: 160 }
      });

      dispose = renderSolidSvg(
        document.getElementById('chart'),
        { model }
      );
    }

    // Initial render
    render([
      { pct: 62, color: '#6366f1', name: 'Desktop' },
      { pct: 28, color: '#22c55e', name: 'Mobile' },
      { pct: 10, color: '#f59e0b', name: 'Tablet' },
    ]);

    // Reroll button
    document.getElementById('reroll').addEventListener('click', () => {
      render(randomSegments());
    });
  </script>
</body>
</html>`,
    dataConfig: {
      segmentCount: 3,
      supportsReactiveUpdates: false,
      type: "none",
    },
    description: "Donut chart with Solid.js fine-grained reactivity",
    id: "donut",
    name: "Donut Chart",
  },
];

// React presets (placeholder - React package not implemented yet)
const REACT_PRESETS: PresetTemplate[] = [
  {
    codeFactory: (cdnUrl) => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Microviz + React</title>
  <script type="importmap">
  {
    "imports": {
      "react": "https://esm.sh/react@19",
      "react-dom": "https://esm.sh/react-dom@19",
      "react-dom/client": "https://esm.sh/react-dom@19/client",
      "@microviz/core": "https://esm.sh/@microviz/core",
      "@microviz/renderers": "https://esm.sh/@microviz/renderers",
      "@microviz/react": "${cdnUrl}"
    }
  }
  </script>
  <style>
    body {
      font-family: system-ui, sans-serif;
      padding: 2rem;
    }
    h1 {
      font-size: 1.25rem;
      margin-bottom: 1rem;
    }
    .note {
      margin-top: 1rem;
      font-size: 0.75rem;
      color: #64748b;
    }
  </style>
</head>
<body>
  <h1>React + Microviz</h1>
  <div id="root"></div>
  <p class="note">React 19 with @microviz/react hooks (coming soon).</p>

  <script type="module">
    import { computeModel } from '@microviz/core';
    import { renderSvgString } from '@microviz/renderers';

    // React package coming soon - for now, use direct rendering
    const model = computeModel({
      data: [10, 25, 15, 30, 20, 35, 25],
      spec: { type: 'sparkline' },
      size: { width: 200, height: 32 }
    });

    document.getElementById('root').innerHTML = renderSvgString(model);
  </script>
</body>
</html>`,
    dataConfig: {
      length: 7,
      supportsReactiveUpdates: false,
      type: "none",
    },
    description: "React with @microviz/react hooks (coming soon)",
    id: "sparkline",
    name: "Sparkline",
  },
];

/**
 * The preset registry - TypeScript ensures all wrappers are defined.
 */
export const PRESET_REGISTRY: PresetRegistry = {
  elements: {
    defaultPresetId: "auto-inference",
    getCdnUrl: getElementsCdnUrl,
    presets: ELEMENTS_PRESETS,
  },
  react: {
    defaultPresetId: "sparkline",
    getCdnUrl: getReactCdnUrl,
    presets: REACT_PRESETS,
  },
  solid: {
    defaultPresetId: "sparkline",
    getCdnUrl: getSolidCdnUrl,
    presets: SOLID_PRESETS,
  },
};

/**
 * Get a preset by wrapper and ID.
 */
export function getPreset(
  wrapper: WrapperType,
  presetId: string,
): PresetTemplate | undefined {
  return PRESET_REGISTRY[wrapper].presets.find((p) => p.id === presetId);
}

/**
 * Get the default preset for a wrapper.
 */
export function getDefaultPreset(wrapper: WrapperType): PresetTemplate {
  const config = PRESET_REGISTRY[wrapper];
  const preset = config.presets.find((p) => p.id === config.defaultPresetId);
  if (!preset) {
    throw new Error(
      `Default preset '${config.defaultPresetId}' not found for wrapper '${wrapper}'`,
    );
  }
  return preset;
}
