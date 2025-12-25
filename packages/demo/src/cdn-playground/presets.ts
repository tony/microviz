/**
 * Preset code examples for the CDN playground.
 * Use {{CDN_URL}} as placeholder - it will be replaced with the selected CDN URL.
 */

export type Preset = {
  id: string;
  name: string;
  description: string;
  code: string;
};

export const PRESETS: Preset[] = [
  {
    code: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Microviz Sparkline</title>
  <script type="module">
    import "{{CDN_URL}}";
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
    height="32">
  </microviz-sparkline>
</body>
</html>`,
    description: "Simple sparkline chart",
    id: "sparkline",
    name: "Sparkline",
  },
  {
    code: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Microviz Bar Chart</title>
  <script type="module">
    import "{{CDN_URL}}";
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
    height="120">
  </microviz-chart>
</body>
</html>`,
    description: "Vertical bar chart with labels",
    id: "bar-chart",
    name: "Bar Chart",
  },
  {
    code: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Interactive Microviz</title>
  <script type="module">
    import "{{CDN_URL}}";
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
    id="myChart">
  </microviz-chart>
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
    description: "Chart with hover events",
    id: "interactive",
    name: "Interactive Chart",
  },
  {
    code: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Microviz Donut</title>
  <script type="module">
    import "{{CDN_URL}}";
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
    height="160">
  </microviz-chart>
</body>
</html>`,
    description: "Donut/pie chart with segments",
    id: "donut",
    name: "Donut Chart",
  },
  {
    code: `<!DOCTYPE html>
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
    description: "Direct SVG rendering for restricted sandboxes",
    id: "csp-safe",
    name: "CSP-Safe (No Web Components)",
  },
  {
    code: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Microviz Dashboard</title>
  <script type="module">
    import "{{CDN_URL}}";
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
      <microviz-sparkline data="45, 52, 48, 61, 55, 67, 72" width="180" height="40"></microviz-sparkline>
    </div>
    <div class="card">
      <h2>Sales by Region</h2>
      <microviz-chart spec='{"type":"sparkline-bars"}' data="[65, 45, 78, 52]" width="180" height="80"></microviz-chart>
    </div>
    <div class="card">
      <h2>Traffic Sources</h2>
      <microviz-chart spec='{"type":"donut"}' data='[{"pct":45,"color":"#6366f1"},{"pct":30,"color":"#22c55e"},{"pct":25,"color":"#f59e0b"}]' width="100" height="100"></microviz-chart>
    </div>
  </div>
</body>
</html>`,
    description: "Dashboard with multiple chart types",
    id: "multiple-charts",
    name: "Multiple Charts",
  },
];

export const DEFAULT_PRESET = PRESETS[0];
