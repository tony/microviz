/**
 * Inline React preview pane for the playground.
 * Renders actual @microviz/react components directly in the demo app.
 */

import type { ChartSpec, RenderModel, Size } from "@microviz/core";
import { computeModel, interpolateModel } from "@microviz/core";
// Import elements to register Web Components for interactive charts
import "@microviz/elements";
import { MicrovizSvg } from "@microviz/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { generateDataForShape } from "./generators/data-generator";
import type {
  ChartInstance,
  LayoutTemplate,
  UnifiedPreset,
} from "./unified-presets";

// Type for microviz-hit event detail
type MicrovizHitDetail = {
  hit: { markId: string; markType: string } | null;
  client: { x: number; y: number };
  point: { x: number; y: number };
};

// ─────────────────────────────────────────────────────────────────────────────
// Animation Easing
// ─────────────────────────────────────────────────────────────────────────────

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

// ─────────────────────────────────────────────────────────────────────────────
// Data Parsing
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse CSV string into segment objects for donut charts.
 * Expected format: "pct,color,name\n35,#6366f1,Desktop\n..."
 */
function parseCsvToSegments(
  csv: string,
): { pct: number; color: string; name: string }[] {
  const lines = csv.trim().split("\n");
  if (lines.length < 2) return [];

  // Skip header row, parse data rows
  return lines.slice(1).map((line) => {
    const [pct, color, name] = line.split(",");
    return {
      color: color?.trim() ?? "#888",
      name: name?.trim() ?? "",
      pct: Number(pct) || 0,
    };
  });
}

function parseChartData(chart: ChartInstance, seed: string): unknown {
  const data = generateDataForShape(chart.dataShape, seed);

  switch (data.type) {
    case "series":
      // Ensure we return an actual array
      if (!Array.isArray(data.values)) {
        console.error("Series values is not an array:", data);
        return [];
      }
      return data.values;
    case "segments":
      return data.segments;
    case "delta":
      return { current: data.current, max: data.max, previous: data.previous };
    case "value":
      return { max: data.max, value: data.value };
    case "csv":
      // Parse CSV into segments for React preview (computeModel expects arrays, not CSV strings)
      return parseCsvToSegments(data.content);
    default: {
      // Exhaustive check - this should never happen
      const _exhaustiveCheck: never = data;
      console.error("Unknown data type:", _exhaustiveCheck);
      return [];
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Model Computation
// ─────────────────────────────────────────────────────────────────────────────

function inferSpecFromData(chart: ChartInstance, data: unknown): ChartSpec {
  // If chart has an explicit spec, use it
  if (chart.spec) {
    return chart.spec as ChartSpec;
  }

  // If chart has an explicit type override (extraAttrs.type), use it
  if (chart.extraAttrs?.type) {
    return { type: chart.extraAttrs.type } as ChartSpec;
  }

  // For non-auto chart types, use the chart type directly
  if (chart.chartType !== "auto") {
    switch (chart.chartType) {
      case "sparkline":
        return { type: "sparkline" };
      case "sparkline-bars":
        return { type: "sparkline-bars" };
      case "donut":
        return { type: "donut" };
      case "bar":
        return { type: "bar" };
      case "bullet-gauge":
        return { type: "bullet-gauge" };
    }
  }

  // For auto charts, infer from dataKind or data shape
  switch (chart.dataKind) {
    case "series":
      return { type: "sparkline" };
    case "delta":
      return { type: "bullet-delta" };
    case "segments":
      return { type: "donut" };
    case "value":
      return { type: "bar" };
    case "csv":
      return { type: "donut" };
    case "override":
      // Should have extraAttrs.type, but default to bar if not
      return { type: "bar" };
  }

  // Fallback: infer from data structure
  if (Array.isArray(data)) {
    // Array of numbers → sparkline, array of objects with pct → donut
    if (data.length > 0 && typeof data[0] === "object" && "pct" in data[0]) {
      return { type: "donut" };
    }
    return { type: "sparkline" };
  }

  if (typeof data === "object" && data !== null) {
    if ("current" in data && "previous" in data) {
      return { type: "bullet-delta" };
    }
    if ("value" in data && "max" in data) {
      return { type: "bar" };
    }
  }

  // Default fallback
  return { type: "sparkline" };
}

function computeModelForChart(
  chart: ChartInstance,
  data: unknown,
): RenderModel {
  const size: Size = { height: chart.height, width: chart.width };
  const spec = inferSpecFromData(chart, data);

  return computeModel({
    data: data as never,
    size,
    spec,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Single Chart Renderer
// ─────────────────────────────────────────────────────────────────────────────

type AnimatedChartRendererProps = {
  chart: ChartInstance;
  seed: string;
  animationDuration?: number;
};

/**
 * Renders a chart with smooth animation on data changes.
 * Uses MicrovizSvg for pure SVG rendering without interactivity.
 */
function AnimatedChartRenderer({
  chart,
  seed,
  animationDuration = 300,
}: AnimatedChartRendererProps) {
  const chartSeed = `${seed}:${chart.id}`;

  // Compute data and model
  const targetModel = useMemo(() => {
    const data = parseChartData(chart, chartSeed);
    return computeModelForChart(chart, data);
  }, [chart, chartSeed]);

  // Animation state
  const [currentModel, setCurrentModel] = useState<RenderModel>(targetModel);
  const prevModelRef = useRef<RenderModel>(targetModel);
  const animationRef = useRef<number | null>(null);

  // Animate on target change
  useEffect(() => {
    // Cancel any existing animation
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
    }

    const startModel = prevModelRef.current;
    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / animationDuration, 1);
      const t = easeOutCubic(progress);

      const interpolated = interpolateModel(startModel, targetModel, t);
      setCurrentModel(interpolated);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        prevModelRef.current = targetModel;
        animationRef.current = null;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetModel, animationDuration]);

  return (
    <MicrovizSvg
      model={currentModel}
      style={{
        display: "block",
        height: chart.height,
        width: chart.width,
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Chart Renderer Wrapper
// ─────────────────────────────────────────────────────────────────────────────

type ChartRendererProps = {
  chart: ChartInstance;
  seed: string;
  onHit?: (detail: MicrovizHitDetail) => void;
};

/**
 * Wrapper component that delegates to either InteractiveChartRenderer or
 * AnimatedChartRenderer based on whether the chart is interactive.
 */
function ChartRenderer({ chart, seed, onHit }: ChartRendererProps) {
  // If chart is interactive and we have a hit handler, use Web Component renderer
  if (chart.extraAttrs?.interactive !== undefined && onHit) {
    return <InteractiveChartRenderer chart={chart} onHit={onHit} seed={seed} />;
  }

  // Otherwise use animated SVG renderer
  return <AnimatedChartRenderer chart={chart} seed={seed} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Interactive Chart Renderer (Web Component)
// ─────────────────────────────────────────────────────────────────────────────

type InteractiveChartRendererProps = {
  chart: ChartInstance;
  seed: string;
  onHit: (detail: MicrovizHitDetail) => void;
};

/**
 * Renders an interactive chart using Web Components.
 * Web Components have built-in hit testing and emit microviz-hit events.
 */
function InteractiveChartRenderer({
  chart,
  seed,
  onHit,
}: InteractiveChartRendererProps) {
  const ref = useRef<HTMLElement>(null);
  const chartSeed = `${seed}:${chart.id}`;

  // Parse data for the chart
  const data = useMemo(
    () => parseChartData(chart, chartSeed),
    [chart, chartSeed],
  );

  // Serialize data for HTML attribute
  const dataStr = useMemo(() => {
    if (typeof data === "string") return data; // CSV string
    return JSON.stringify(data);
  }, [data]);

  const specStr = useMemo(
    () => (chart.spec ? JSON.stringify(chart.spec) : '{"type":"sparkline"}'),
    [chart.spec],
  );

  const hitSlop = chart.extraAttrs?.["hit-slop"] ?? "8";

  // Set attributes manually to ensure they're set as HTML attributes
  // React 19 might set some props as properties which Web Components don't read
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.setAttribute("data", dataStr);
    el.setAttribute("width", String(chart.width));
    el.setAttribute("height", String(chart.height));
    el.setAttribute("interactive", "");
    el.setAttribute("hit-slop", hitSlop);
    if (chart.element === "microviz-chart") {
      el.setAttribute("spec", specStr);
    }
    // Set additional attributes from extraAttrs (like id)
    if (chart.extraAttrs) {
      for (const [key, value] of Object.entries(chart.extraAttrs)) {
        // Skip attributes we've already set
        if (key !== "interactive" && key !== "hit-slop") {
          el.setAttribute(key, value);
        }
      }
    }
  }, [
    dataStr,
    chart.width,
    chart.height,
    chart.element,
    specStr,
    hitSlop,
    chart.extraAttrs,
  ]);

  // Attach event listener
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<MicrovizHitDetail>;
      onHit(customEvent.detail);
    };

    el.addEventListener("microviz-hit", handler);
    return () => el.removeEventListener("microviz-hit", handler);
  }, [onHit]);

  // Render the appropriate Web Component
  // Note: We set attributes via useEffect above, but set explicit dimensions
  // in style to prevent the element from expanding beyond the chart size
  const chartStyle = {
    display: "block",
    height: chart.height,
    width: chart.width,
  };

  if (chart.element === "microviz-sparkline") {
    return <microviz-sparkline ref={ref} style={chartStyle} />;
  }

  return <microviz-chart ref={ref} style={chartStyle} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Layout Renderer
// ─────────────────────────────────────────────────────────────────────────────

type LayoutRendererProps = {
  charts: ChartInstance[];
  layout: LayoutTemplate;
  seed: string;
  onHit?: (detail: MicrovizHitDetail) => void;
};

function LayoutRenderer({ charts, layout, seed, onHit }: LayoutRendererProps) {
  if (layout.type === "single") {
    const chart = charts[0];
    if (!chart) return null;
    return <ChartRenderer chart={chart} onHit={onHit} seed={seed} />;
  }

  if (layout.type === "grid") {
    const columns = layout.columns;
    const gap = layout.gap ?? "1.5rem";

    return (
      <div
        style={{
          display: "grid",
          gap,
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
        }}
      >
        {charts.map((chart) => (
          <ChartRenderer
            chart={chart}
            key={chart.id}
            onHit={onHit}
            seed={seed}
          />
        ))}
      </div>
    );
  }

  if (layout.type === "cards") {
    return (
      <div
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        }}
      >
        {charts.map((chart) => (
          <div
            key={chart.id}
            style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "0.75rem",
              padding: "1rem",
            }}
          >
            {chart.label && (
              <h2
                style={{
                  color: "#64748b",
                  fontSize: "0.875rem",
                  margin: "0 0 0.5rem",
                }}
              >
                {chart.label}
              </h2>
            )}
            <ChartRenderer chart={chart} onHit={onHit} seed={seed} />
          </div>
        ))}
      </div>
    );
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export type ReactPreviewPaneProps = {
  preset: UnifiedPreset;
  seed: string;
  className?: string;
};

/**
 * Inline React preview pane.
 * Renders actual @microviz/react components with smooth animations on data changes.
 * For interactive charts, uses Web Components with hit event handling.
 */
export function ReactPreviewPane({
  preset,
  seed,
  className = "",
}: ReactPreviewPaneProps) {
  const { charts, layout, interactive } = preset;

  // State for interactive chart hit info
  const [hitInfo, setHitInfo] = useState<string>(
    interactive?.initialText ?? "",
  );

  // Callback for hit events from interactive charts
  const handleHit = useCallback(
    (detail: MicrovizHitDetail) => {
      if (detail.hit) {
        setHitInfo(
          `Hovered: ${detail.hit.markId} at (${Math.round(detail.client.x)}, ${Math.round(detail.client.y)})`,
        );
      } else {
        setHitInfo(interactive?.initialText ?? "");
      }
    },
    [interactive?.initialText],
  );

  return (
    <div
      className={`react-preview ${className}`}
      style={{
        background: "#fff",
        color: "#1e293b",
        fontFamily: "system-ui, sans-serif",
        minHeight: "100%",
        padding: "2rem",
      }}
    >
      <h1
        style={{
          color: "#0f172a",
          fontSize: "1.25rem",
          marginBottom: "1rem",
        }}
      >
        {preset.name}
      </h1>

      <LayoutRenderer
        charts={charts}
        layout={layout}
        onHit={interactive ? handleHit : undefined}
        seed={seed}
      />

      {interactive && (
        <div
          id={interactive.outputId}
          style={{
            background: "#f1f5f9",
            borderRadius: "0.25rem",
            color: "#475569",
            fontSize: "0.875rem",
            marginTop: "1rem",
            minHeight: "1.5rem",
            padding: "0.5rem",
          }}
        >
          {hitInfo}
        </div>
      )}
    </div>
  );
}
