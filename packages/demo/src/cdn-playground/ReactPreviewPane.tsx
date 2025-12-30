/**
 * Inline React preview pane for the playground.
 * Renders actual @microviz/react components directly in the demo app.
 */

import type { ChartSpec, RenderModel, Size } from "@microviz/core";
import { computeModel, interpolateModel } from "@microviz/core";
import { MicrovizSvg } from "@microviz/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { generateDataForShape } from "./generators/data-generator";
import type {
  ChartInstance,
  LayoutTemplate,
  UnifiedPreset,
} from "./unified-presets";

// ─────────────────────────────────────────────────────────────────────────────
// Animation Easing
// ─────────────────────────────────────────────────────────────────────────────

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

// ─────────────────────────────────────────────────────────────────────────────
// Data Parsing
// ─────────────────────────────────────────────────────────────────────────────

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
      return data.content;
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

type ChartRendererProps = {
  chart: ChartInstance;
  seed: string;
  animationDuration?: number;
};

function ChartRenderer({
  chart,
  seed,
  animationDuration = 300,
}: ChartRendererProps) {
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
// Layout Renderer
// ─────────────────────────────────────────────────────────────────────────────

type LayoutRendererProps = {
  charts: ChartInstance[];
  layout: LayoutTemplate;
  seed: string;
};

function LayoutRenderer({ charts, layout, seed }: LayoutRendererProps) {
  if (layout.type === "single") {
    const chart = charts[0];
    if (!chart) return null;
    return <ChartRenderer chart={chart} seed={seed} />;
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
          <ChartRenderer chart={chart} key={chart.id} seed={seed} />
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
            <ChartRenderer chart={chart} seed={seed} />
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
 */
export function ReactPreviewPane({
  preset,
  seed,
  className = "",
}: ReactPreviewPaneProps) {
  const { charts, layout, interactive } = preset;

  return (
    <div
      className={`react-preview ${className}`}
      style={{
        background: "#fff",
        fontFamily: "system-ui, sans-serif",
        minHeight: "100%",
        padding: "2rem",
      }}
    >
      <h1
        style={{
          fontSize: "1.25rem",
          marginBottom: "1rem",
        }}
      >
        {preset.name}
      </h1>

      <LayoutRenderer charts={charts} layout={layout} seed={seed} />

      {interactive && (
        <div
          id={interactive.outputId}
          style={{
            background: "#f1f5f9",
            borderRadius: "0.25rem",
            fontSize: "0.875rem",
            marginTop: "1rem",
            minHeight: "1.5rem",
            padding: "0.5rem",
          }}
        >
          {interactive.initialText}
        </div>
      )}
    </div>
  );
}
