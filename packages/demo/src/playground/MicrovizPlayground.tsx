import {
  type ChartMeta,
  type ChartSpec,
  type ComputeModelInput,
  computeModel,
  getAllChartMeta,
  getPreferredAspectRatio,
  type RenderModel,
} from "@microviz/core";
import {
  MicrovizCanvas as MicrovizReactCanvas,
  MicrovizSvg as MicrovizReactSvg,
  MicrovizSvgString as MicrovizReactSvgString,
} from "@microviz/react";
import {
  getCanvasUnsupportedFilterPrimitiveTypes,
  type RenderCanvasOptions,
  renderCanvas,
  renderSvgString,
} from "@microviz/renderers";
import "@microviz/elements";
import {
  type FC,
  Fragment,
  type ReactNode,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { applyNoiseDisplacementOverlay } from "../modelOverlays";
import {
  chartCard,
  chartCardContent,
  inputField,
  sidebarItem,
  statusLed,
  tabButton,
} from "../ui/styles";
import { ToggleGroup } from "../ui/ToggleGroup";
import { renderSvgElement } from "../vanilla/svgDom";
import { JsonViewer } from "./JsonViewer";
import { ResizablePane } from "./ResizablePane";
import {
  buildOpacities,
  buildSegments,
  buildSeries,
  createSeededRng,
  type SeriesPreset,
} from "./seed";
import { MicrovizWorkerClient } from "./workerClient";

type Wrapper = "vanilla" | "react" | "elements";

type Renderer = "svg-string" | "svg-dom" | "canvas" | "offscreen-canvas";

type ComputeMode = "main" | "worker";

type ChartId = ChartSpec["type"];

const chartSubtypeOptions = [
  { id: "all", label: "All" },
  { id: "lines", label: "Lines" },
  { id: "bars", label: "Bars" },
  { id: "grids", label: "Grids" },
  { id: "dots", label: "Dots" },
] as const;

type ChartSubtype = (typeof chartSubtypeOptions)[number]["id"];
type ChartCatalogEntry = {
  chartId: ChartId;
  title: string;
  subtype: Exclude<ChartSubtype, "all">;
};

// Build catalog directly from registry metadata
const chartMetaMap = new Map<string, ChartMeta>(
  getAllChartMeta().map((meta) => [meta.type, meta]),
);

function buildChartCatalog(chartIds: readonly ChartId[]): ChartCatalogEntry[] {
  return chartIds.map((chartId) => {
    const meta = chartMetaMap.get(chartId);
    return {
      chartId,
      subtype: meta?.category ?? "bars",
      title: meta?.displayName ?? chartId,
    };
  });
}

type MicrovizModelElement = HTMLElement & { model: RenderModel | null };

type EnsureWorkerClient = () => MicrovizWorkerClient;

function createRecordFromKeys<const K extends string, V>(
  keys: readonly K[],
  value: V,
): Record<K, V> {
  return Object.fromEntries(keys.map((k) => [k, value])) as Record<K, V>;
}

const OffscreenCanvasPreview: FC<{
  input: ComputeModelInput;
  options: RenderCanvasOptions;
  ensureWorkerClient: EnsureWorkerClient;
  label: string;
  applyNoiseOverlay: boolean;
}> = ({ applyNoiseOverlay, input, options, ensureWorkerClient, label }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasId = `${label}:${useId()}`;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    if (typeof canvasEl.transferControlToOffscreen !== "function") return;

    let cancelled = false;
    let rafId: number | null = null;
    let didInit = false;

    // React StrictMode (dev) runs effects setup/cleanup/setup once. Since a
    // canvas can only be transferred once, delay transfer until after the first
    // cleanup pass and cancel it there.
    rafId = requestAnimationFrame(() => {
      if (cancelled) return;
      const offscreen = canvasEl.transferControlToOffscreen();
      ensureWorkerClient().initOffscreen(canvasId, offscreen);
      didInit = true;
      setReady(true);
    });

    return () => {
      cancelled = true;
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (didInit) ensureWorkerClient().disposeOffscreen(canvasId);
    };
  }, [canvasId, ensureWorkerClient]);

  useEffect(() => {
    if (!ready) return;
    ensureWorkerClient().renderOffscreen(
      canvasId,
      input,
      options,
      applyNoiseOverlay,
    );
  }, [applyNoiseOverlay, canvasId, ensureWorkerClient, input, options, ready]);

  return (
    <canvas
      className="rounded bg-[var(--mv-bg)]"
      height={input.size.height}
      ref={canvasRef}
      width={input.size.width}
    />
  );
};

function useModels(
  inputs: Record<ChartId, ComputeModelInput>,
  computeMode: ComputeMode,
  ensureWorkerClient: EnsureWorkerClient,
): {
  models: Record<ChartId, RenderModel | null>;
  timingsMs: Record<ChartId, number | null>;
} {
  const initialChartIds = Object.keys(inputs) as ChartId[];
  const [models, setModels] = useState<Record<ChartId, RenderModel | null>>(
    () =>
      createRecordFromKeys<ChartId, RenderModel | null>(initialChartIds, null),
  );
  const [timingsMs, setTimingsMs] = useState<Record<ChartId, number | null>>(
    () => createRecordFromKeys<ChartId, number | null>(initialChartIds, null),
  );

  useEffect(() => {
    const chartIds = Object.keys(inputs) as ChartId[];
    if (computeMode === "main") {
      const nextModels = createRecordFromKeys<ChartId, RenderModel | null>(
        chartIds,
        null,
      );
      const nextTimings = createRecordFromKeys<ChartId, number | null>(
        chartIds,
        null,
      );

      for (const chartId of chartIds) {
        const start = performance.now();
        const model = computeModel(inputs[chartId]);
        const end = performance.now();
        nextModels[chartId] = model;
        nextTimings[chartId] = Math.round((end - start) * 1000) / 1000;
      }

      setModels(nextModels);
      setTimingsMs(nextTimings);
      return;
    }

    const worker = ensureWorkerClient();

    let cancelled = false;
    const entries = chartIds;
    const startById = new Map<ChartId, number>(
      entries.map((id) => [id, performance.now()]),
    );

    void Promise.all(
      entries.map(async (chartId) => {
        const model = await worker.compute(inputs[chartId]);
        const end = performance.now();
        const start = startById.get(chartId) ?? end;
        return {
          chartId,
          model,
          timingMs: Math.round((end - start) * 1000) / 1000,
        };
      }),
    ).then((results) => {
      if (cancelled) return;

      const nextModels = createRecordFromKeys<ChartId, RenderModel | null>(
        entries,
        null,
      );
      const nextTimings = createRecordFromKeys<ChartId, number | null>(
        entries,
        null,
      );

      for (const row of results) {
        nextModels[row.chartId] = row.model;
        nextTimings[row.chartId] = row.timingMs;
      }

      setModels(nextModels);
      setTimingsMs(nextTimings);
    });

    return () => {
      cancelled = true;
    };
  }, [computeMode, ensureWorkerClient, inputs]);

  return { models, timingsMs };
}

type WarningLike = { code: string; message: string };

function hasDiagnosticsWarnings(model: RenderModel | null, renderer: Renderer) {
  if (!model) return false;
  if ((model.stats?.warnings?.length ?? 0) > 0) return true;
  if (renderer === "canvas" || renderer === "offscreen-canvas")
    return getCanvasUnsupportedFilterPrimitiveTypes(model).length > 0;
  return false;
}

function getDiagnosticsWarnings(
  model: RenderModel | null,
  renderer: Renderer,
): WarningLike[] {
  if (!model) return [];

  const warnings: WarningLike[] = [];
  for (const w of model.stats?.warnings ?? []) {
    warnings.push({ code: w.code, message: w.message });
  }

  if (renderer === "canvas" || renderer === "offscreen-canvas") {
    const unsupported = getCanvasUnsupportedFilterPrimitiveTypes(model);
    if (unsupported.length > 0) {
      warnings.push({
        code: "CANVAS_UNSUPPORTED_FILTER",
        message: `Canvas renderer ignores filter primitives: ${unsupported.join(", ")}.`,
      });
    }
  }

  return warnings;
}

function formatWarningsList(warnings: WarningLike[]): ReactNode {
  if (warnings.length === 0) return <span className="text-sm">None</span>;

  return (
    <ul className="space-y-1 text-sm">
      {warnings.map((w, i) => (
        <li key={`${w.code}-${i}`}>
          <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
            {w.code}
          </span>
          <span className="ml-2">{w.message}</span>
        </li>
      ))}
    </ul>
  );
}

function ChartCard({
  active,
  centered,
  chartId,
  compact,
  hasWarnings,
  model,
  onSelect,
  render,
  timingMs,
  title,
}: {
  active: boolean;
  centered?: boolean;
  chartId: ChartId;
  compact?: boolean;
  hasWarnings: boolean;
  model: RenderModel | null;
  onSelect: (chartId: ChartId) => void;
  render: ReactNode;
  timingMs: number | null;
  title: string;
}): ReactNode {
  const markCountLabel = model
    ? `${model.stats?.markCount ?? model.marks.length} marks`
    : null;

  const isWideCard = !compact && !centered;

  return (
    <button
      className={chartCard({ active, compact })}
      onClick={() => onSelect(chartId)}
      type="button"
    >
      <div
        className={statusLed({ status: hasWarnings ? "warning" : "success" })}
        title={hasWarnings ? "Warnings present" : "No warnings"}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div
            className={`text-sm font-semibold${centered ? " truncate" : ""}`}
            title={title}
          >
            {title}
          </div>
        </div>
      </div>
      <div
        className={`${chartCardContent({ centered })}${isWideCard ? " flex-1" : ""}`}
      >
        {render}
      </div>

      {markCountLabel && (
        <div className="absolute bottom-1 left-1">
          <div
            className="-mb-0.5 -ms-0.5 select-none rounded-bl-lg rounded-tr-lg bg-slate-100 px-1.5 py-0.5 text-[11px] leading-tight text-slate-700 sm:tracking-tight dark:bg-slate-700 dark:text-slate-100"
            title={markCountLabel}
          >
            {markCountLabel}
          </div>
        </div>
      )}

      {timingMs !== null && (
        <div className="absolute bottom-1 right-1">
          <div
            className="-mb-0.5 -me-0.5 select-none rounded-br-lg rounded-tl-lg bg-slate-100 px-1.5 py-0.5 text-[11px] leading-tight text-slate-700 sm:tracking-tight dark:bg-slate-700 dark:text-slate-100"
            title={`${timingMs}ms`}
          >
            {timingMs}ms
          </div>
        </div>
      )}
    </button>
  );
}

export const MicrovizPlayground: FC = () => {
  const [wrapper, setWrapper] = useState<Wrapper>("vanilla");
  const [renderer, setRenderer] = useState<Renderer>("svg-string");
  const [applyNoiseOverlay, setApplyNoiseOverlay] = useState(false);
  const [showHoverTooltip, setShowHoverTooltip] = useState(false);
  const [
    fallbackSvgWhenCanvasUnsupported,
    setFallbackSvgWhenCanvasUnsupported,
  ] = useState(false);
  const [computeMode, setComputeMode] = useState<ComputeMode>("main");
  const [seriesPreset, setSeriesPreset] = useState<SeriesPreset>("trend");
  const [seed, setSeed] = useState("mv-1");
  const [seriesLength, setSeriesLength] = useState(16);
  const [segmentCount, setSegmentCount] = useState(5);
  const [selectedChart, setSelectedChart] = useState<ChartId>("sparkline");
  const [chartSubtype, setChartSubtype] = useState<ChartSubtype>("all");
  const [width, setWidth] = useState(200);
  const [height, setHeight] = useState(32);
  const [sidebarTab, setSidebarTab] = useState<"browse" | "settings" | "debug">(
    "settings",
  );
  const [chartFilter, setChartFilter] = useState("");

  const workerClientRef = useRef<MicrovizWorkerClient | null>(null);
  const ensureWorkerClient = useMemo<EnsureWorkerClient>(
    () => () => {
      if (!workerClientRef.current) {
        workerClientRef.current = new MicrovizWorkerClient();
      }
      return workerClientRef.current;
    },
    [],
  );

  useEffect(() => {
    return () => {
      workerClientRef.current?.terminate();
      workerClientRef.current = null;
    };
  }, []);

  const size = useMemo(() => ({ height, width }), [height, width]);

  // Helper to compute size based on chart's preferred aspect ratio
  const sizeFor = useMemo(
    () =>
      (chartType: ChartId): { width: number; height: number } => {
        const aspectRatio = getPreferredAspectRatio(chartType);
        if (aspectRatio === "square") {
          // Use height with minimum of 64 for square charts
          const squareSize = Math.max(height, 64);
          return { height: squareSize, width: squareSize };
        }
        if (aspectRatio === "tall") {
          // Narrow and tall - fixed width, use height slider value
          return { height: Math.max(height, 48), width: 16 };
        }
        return size;
      },
    [height, size],
  );

  const series = useMemo(
    () => buildSeries(`${seed}:series`, seriesLength, seriesPreset),
    [seed, seriesLength, seriesPreset],
  );
  const opacities = useMemo(() => buildOpacities(series), [series]);
  const segments = useMemo(
    () => buildSegments(`${seed}:segments`, segmentCount),
    [seed, segmentCount],
  );
  const bandSeed = useMemo(
    () => createSeededRng(`${seed}:band`).int(0, 10_000),
    [seed],
  );

  const inputs: Record<ChartId, ComputeModelInput> = useMemo(
    () => ({
      bar: {
        data: { max: 100, value: series[series.length - 1] ?? 0 },
        size,
        spec: { pad: 2, type: "bar" },
      },
      barcode: {
        data: segments,
        size,
        spec: { bins: 48, pad: 0, type: "barcode" },
      },
      bitfield: {
        data: segments,
        size,
        spec: { cellSize: 4, dotRadius: 1.6, type: "bitfield" },
      },
      "bullet-delta": {
        data: {
          current: series[series.length - 1] ?? 0,
          max: 100,
          previous: series[series.length - 2] ?? series[series.length - 1] ?? 0,
        },
        size,
        spec: { type: "bullet-delta" },
      },
      "bullet-gauge": {
        data: segments,
        size,
        spec: { gap: 0, pad: 0, type: "bullet-gauge" },
      },
      "cascade-steps": {
        data: segments,
        size,
        spec: {
          gap: 1,
          minHeightPct: 10,
          stepDecrement: 15,
          type: "cascade-steps",
        },
      },
      chevron: {
        data: segments,
        size,
        spec: { overlap: 6, pad: 0, type: "chevron" },
      },
      "code-minimap": {
        data: segments,
        size: sizeFor("code-minimap"),
        spec: { pad: 0, type: "code-minimap" },
      },
      "concentric-arcs": {
        data: segments,
        size: sizeFor("concentric-arcs"),
        spec: {
          pad: 2,
          ringGap: 2,
          strokeWidth: 4,
          type: "concentric-arcs",
        },
      },
      "concentric-arcs-horiz": {
        data: segments,
        size,
        spec: {
          maxArcs: 4,
          pad: 0,
          step: 10,
          strokeWidth: 3,
          type: "concentric-arcs-horiz",
        },
      },
      "dna-helix": {
        data: segments,
        size,
        spec: {
          gap: 2,
          pad: 0,
          strandGap: 4,
          strandHeight: 6,
          type: "dna-helix",
        },
      },
      donut: {
        data: segments,
        size: sizeFor("donut"),
        spec: {
          innerRadius: 0.5,
          pad: 2,
          type: "donut",
        },
      },
      "dot-cascade": {
        data: segments,
        size,
        spec: { dotRadius: 4, dots: 16, pad: 0, type: "dot-cascade" },
      },
      "dot-matrix": {
        data: { opacities, series },
        size,
        spec: { cols: 32, maxDots: 4, type: "dot-matrix" },
      },
      "dot-row": {
        data: segments,
        size,
        spec: { dotRadius: 6, dots: 12, gap: 4, pad: 0, type: "dot-row" },
      },
      dumbbell: {
        data: {
          current: series[series.length - 1] ?? 0,
          max: 100,
          target: series[series.length - 2] ?? series[series.length - 1] ?? 0,
        },
        size,
        spec: { type: "dumbbell" },
      },
      equalizer: {
        data: segments,
        size,
        spec: { barWidth: 6, bins: 24, gap: 1, pad: 0, type: "equalizer" },
      },
      "faded-pyramid": {
        data: segments,
        size,
        spec: {
          gap: 2,
          heightDecrement: 15,
          minHeightPct: 30,
          type: "faded-pyramid",
        },
      },
      "gradient-fade": {
        data: segments,
        size,
        spec: { pad: 0, type: "gradient-fade" },
      },
      "hand-of-cards": {
        data: segments,
        size: { height: Math.max(height, 60), width },
        spec: {
          cardHeightPct: 70,
          cardWidthPct: 35,
          fanAngle: 40,
          pad: 0,
          type: "hand-of-cards",
        },
      },
      heatgrid: {
        data: { opacities, series },
        size,
        spec: { cols: 12, rows: 4, type: "heatgrid" },
      },
      histogram: {
        data: { opacities, series },
        size,
        spec: { bins: 18, pad: 3, type: "histogram" },
      },
      interlocking: {
        data: segments,
        size,
        spec: { pad: 0, type: "interlocking" },
      },
      "layered-waves": {
        data: segments,
        size,
        spec: {
          baseOpacity: 0.6,
          cornerRadius: 8,
          pad: 0,
          type: "layered-waves",
          waveOffset: 12,
        },
      },
      lollipop: {
        data: segments,
        size,
        spec: {
          dotRadius: 5,
          maxItems: 5,
          minStemHeight: 6,
          stemWidth: 4,
          type: "lollipop",
        },
      },
      "masked-wave": {
        data: segments,
        size,
        spec: { pad: 0, type: "masked-wave" },
      },
      matryoshka: {
        data: segments,
        size: { height: Math.max(height, 50), width },
        spec: { cornerRadius: 4, pad: 0, type: "matryoshka" },
      },
      "micro-heatline": {
        data: segments,
        size,
        spec: {
          gap: 2,
          lineHeight: 2,
          maxLines: 6,
          pad: 0,
          type: "micro-heatline",
        },
      },
      mosaic: {
        data: segments,
        size,
        spec: { gap: 1, pad: 0, type: "mosaic" },
      },
      "nano-ring": {
        data: segments,
        size: sizeFor("nano-ring"),
        spec: {
          gapSize: 2,
          pad: 1,
          strokeWidth: 2,
          type: "nano-ring",
        },
      },
      "orbital-dots": {
        data: segments,
        size: sizeFor("orbital-dots"),
        spec: {
          maxDotRadius: 6,
          minDotRadius: 2,
          pad: 0,
          ringStrokeWidth: 1,
          type: "orbital-dots",
        },
      },
      pareto: {
        data: segments,
        size,
        spec: { gap: 0, type: "pareto" },
      },
      "pattern-tiles": {
        data: segments,
        size,
        spec: { pad: 0, type: "pattern-tiles" },
      },
      perforated: {
        data: segments,
        size,
        spec: { pad: 0, type: "perforated" },
      },
      pipeline: {
        data: segments,
        size,
        spec: { overlap: 8, pad: 0, type: "pipeline" },
      },
      "pixel-column": {
        data: segments,
        size: sizeFor("pixel-column"),
        spec: { gap: 1, minPx: 1, pad: 0, type: "pixel-column" },
      },
      "pixel-grid": {
        data: segments,
        size,
        spec: { cols: 16, gap: 2, pad: 0, rows: 2, type: "pixel-grid" },
      },
      "pixel-pill": {
        data: segments,
        size,
        spec: { gap: 1, minPx: 1, pad: 0, type: "pixel-pill" },
      },
      "pixel-treemap": {
        data: segments,
        size: sizeFor("pixel-treemap"),
        spec: { cornerRadius: 6, pad: 0, type: "pixel-treemap" },
      },
      "progress-pills": {
        data: segments,
        size,
        spec: { gap: 4, pad: 0, pillHeight: 10, type: "progress-pills" },
      },
      "radial-bars": {
        data: segments,
        size: sizeFor("radial-bars"),
        spec: { minLength: 3, pad: 0, strokeWidth: 3, type: "radial-bars" },
      },
      "radial-burst": {
        data: segments,
        size,
        spec: { pad: 0, type: "radial-burst" },
      },
      "range-band": {
        data: series,
        size,
        spec: { bandSeed, type: "range-band" },
      },
      "ranked-lanes": {
        data: segments,
        size,
        spec: { laneHeight: 4, maxLanes: 6, pad: 2, type: "ranked-lanes" },
      },
      "segmented-bar": {
        data: segments,
        size,
        spec: { gap: 2, type: "segmented-bar" },
      },
      "segmented-ring": {
        data: segments,
        size: sizeFor("segmented-ring"),
        spec: {
          gapSize: 4,
          pad: 2,
          strokeWidth: 3,
          type: "segmented-ring",
        },
      },
      "shadow-depth": {
        data: segments,
        size,
        spec: {
          cornerRadius: 4,
          gap: 4,
          maxItems: 4,
          pad: 0,
          type: "shadow-depth",
        },
      },
      "shape-row": {
        data: segments,
        size,
        spec: { maxShapes: 4, pad: 0, type: "shape-row" },
      },
      skyline: {
        data: segments,
        size,
        spec: { gap: 2, minHeightPct: 20, type: "skyline" },
      },
      "spark-area": {
        data: series,
        size,
        spec: { pad: 3, type: "spark-area" },
      },
      sparkline: {
        data: series,
        size,
        spec: { pad: 3, showDot: true, type: "sparkline" },
      },
      "sparkline-bars": {
        data: series,
        size,
        spec: { barRadius: 1, gap: 1, pad: 2, type: "sparkline-bars" },
      },
      "split-pareto": {
        data: segments,
        size,
        spec: { gap: 0, type: "split-pareto" },
      },
      "split-ribbon": {
        data: segments,
        size,
        spec: { gap: 2, pad: 0, ribbonGap: 4, type: "split-ribbon" },
      },
      "stacked-bar": {
        data: segments,
        size,
        spec: { type: "stacked-bar" },
      },
      "stacked-chips": {
        data: segments,
        size: { height: 12, width: 48 },
        spec: {
          className:
            "transition-all duration-500 text-white dark:text-slate-800",
          maxChips: 4,
          maxChipWidth: 24,
          minChipWidth: 12,
          overlap: 4,
          pad: 0,
          strokeWidth: 2,
          type: "stacked-chips",
        },
      },
      "step-line": {
        data: series,
        size,
        spec: { pad: 3, showDot: true, type: "step-line" },
      },
      "stepped-area": {
        data: segments,
        size,
        spec: { gap: 0, stepOffset: 5, type: "stepped-area" },
      },
      "stripe-density": {
        data: segments,
        size,
        spec: { pad: 0, type: "stripe-density" },
      },
      tapered: {
        data: segments,
        size,
        spec: { pad: 0, type: "tapered" },
      },
      "two-tier": {
        data: segments,
        size,
        spec: { gap: 1, pad: 0, type: "two-tier" },
      },
      "variable-ribbon": {
        data: segments,
        size,
        spec: {
          gap: 1,
          minHeightPct: 30,
          stepDecrement: 18,
          type: "variable-ribbon",
        },
      },
      "vertical-stack": {
        data: segments,
        size: sizeFor("vertical-stack"),
        spec: { pad: 0, type: "vertical-stack" },
      },
      waveform: {
        data: segments,
        size,
        spec: { barWidth: 6, bins: 24, gap: 1, pad: 0, type: "waveform" },
      },
    }),
    [bandSeed, opacities, segments, series, size, sizeFor, height, width],
  );

  const chartIds = useMemo(() => Object.keys(inputs) as ChartId[], [inputs]);
  const chartCatalog = useMemo(() => buildChartCatalog(chartIds), [chartIds]);

  const visibleCharts = useMemo(() => {
    if (chartSubtype === "all") return chartCatalog;
    return chartCatalog.filter((chart) => chart.subtype === chartSubtype);
  }, [chartCatalog, chartSubtype]);

  const filteredCharts = useMemo(() => {
    const q = chartFilter.toLowerCase().trim();
    if (!q) return visibleCharts;
    return visibleCharts.filter((c) => c.title.toLowerCase().includes(q));
  }, [visibleCharts, chartFilter]);

  // Group charts by aspect ratio for sectioned display
  const chartsByAspectRatio = useMemo(() => {
    const square: ChartCatalogEntry[] = [];
    const tall: ChartCatalogEntry[] = [];
    const wide: ChartCatalogEntry[] = [];

    for (const chart of visibleCharts) {
      const aspectRatio = getPreferredAspectRatio(chart.chartId);
      if (aspectRatio === "square") {
        square.push(chart);
      } else if (aspectRatio === "tall") {
        tall.push(chart);
      } else {
        wide.push(chart);
      }
    }

    return { square, tall, wide };
  }, [visibleCharts]);

  useEffect(() => {
    const first = visibleCharts[0]?.chartId;
    if (!first) return;
    if (visibleCharts.some((chart) => chart.chartId === selectedChart)) return;
    setSelectedChart(first);
  }, [selectedChart, visibleCharts]);

  useEffect(() => {
    if (wrapper !== "elements") return;
    if (renderer === "svg-string") return;
    setRenderer("svg-string");
  }, [renderer, wrapper]);

  useEffect(() => {
    if (wrapper === "elements") return;
    if (!showHoverTooltip) return;
    setShowHoverTooltip(false);
  }, [showHoverTooltip, wrapper]);

  const computeModeEffective: ComputeMode =
    renderer === "offscreen-canvas" ? "worker" : computeMode;

  const { models, timingsMs } = useModels(
    inputs,
    computeModeEffective,
    ensureWorkerClient,
  );

  const effectiveModels = useMemo(() => {
    if (!applyNoiseOverlay) return models;
    const nextModels = createRecordFromKeys<ChartId, RenderModel | null>(
      chartIds,
      null,
    );

    for (const chartId of chartIds) {
      const model = models[chartId];
      nextModels[chartId] = model ? applyNoiseDisplacementOverlay(model) : null;
    }

    return nextModels;
  }, [applyNoiseOverlay, chartIds, models]);

  const fillStyle = "#2563eb";
  const strokeStyle = "#2563eb";
  const strokeWidth = 2.2;
  const canvasOptions: RenderCanvasOptions = useMemo(
    () => ({ fillStyle, strokeStyle, strokeWidth }),
    [],
  );

  const inspectorTabOptions = ["diagnostics", "model", "data"] as const;
  type InspectorTab = (typeof inspectorTabOptions)[number];
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("diagnostics");

  function renderSurface(chartId: ChartId): ReactNode {
    const model = effectiveModels[chartId];
    const input = inputs[chartId];
    if (!model)
      return (
        <div className="h-8 w-[200px] animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      );

    if (wrapper === "elements") {
      return (
        <ElementPreview model={model} showHoverTooltip={showHoverTooltip} />
      );
    }

    const canvasUnsupportedFilters =
      renderer === "canvas" || renderer === "offscreen-canvas"
        ? getCanvasUnsupportedFilterPrimitiveTypes(model)
        : [];
    const shouldFallbackToSvg =
      fallbackSvgWhenCanvasUnsupported &&
      canvasUnsupportedFilters.length > 0 &&
      (renderer === "canvas" || renderer === "offscreen-canvas");

    if (renderer === "svg-string") {
      if (wrapper === "react")
        return (
          <MicrovizReactSvgString className="inline-block" model={model} />
        );
      const svg = renderSvgString(model);
      return <SvgStringPreview svg={svg} />;
    }

    if (shouldFallbackToSvg) {
      if (wrapper === "react")
        return (
          <MicrovizReactSvgString className="inline-block" model={model} />
        );
      const svg = renderSvgString(model);
      return <SvgStringPreview svg={svg} />;
    }

    if (renderer === "svg-dom") {
      if (wrapper === "react")
        return <MicrovizReactSvg className="block" model={model} />;
      return <SvgDomPreview model={model} />;
    }

    if (renderer === "canvas") {
      if (wrapper === "react")
        return (
          <MicrovizReactCanvas
            className="rounded bg-[var(--mv-bg)]"
            model={model}
            options={canvasOptions}
          />
        );
      return <CanvasPreview model={model} options={canvasOptions} />;
    }

    if (renderer === "offscreen-canvas") {
      return (
        <OffscreenCanvasPreview
          applyNoiseOverlay={applyNoiseOverlay}
          ensureWorkerClient={ensureWorkerClient}
          input={input}
          label={chartId}
          options={canvasOptions}
        />
      );
    }

    return null;
  }

  const selectedModel = effectiveModels[selectedChart] ?? null;
  const selectedInput = inputs[selectedChart];

  const allWarnings = useMemo(() => {
    const rows: Array<{ chartId: ChartId; warnings: WarningLike[] }> = [];
    for (const chartId of Object.keys(effectiveModels) as ChartId[]) {
      const model = effectiveModels[chartId];
      const warnings = getDiagnosticsWarnings(model, renderer);
      if (warnings.length > 0) rows.push({ chartId, warnings });
    }
    return rows;
  }, [effectiveModels, renderer]);

  return (
    <div className="flex h-full min-h-0 w-full">
      <ResizablePane
        className="h-full border-r border-slate-200 bg-white/70 dark:border-slate-800 dark:bg-slate-950/40"
        defaultSize={280}
        name="sidebar"
        side="left"
      >
        <div className="p-3">
          {/* Tab switcher */}
          <div className="mb-3 flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800/50">
            <button
              className={tabButton({
                active: sidebarTab === "browse",
                className: "flex-1",
                size: "xs",
              })}
              onClick={() => setSidebarTab("browse")}
              type="button"
            >
              Browse
            </button>
            <button
              className={tabButton({
                active: sidebarTab === "settings",
                className: "flex-1",
                size: "xs",
              })}
              onClick={() => setSidebarTab("settings")}
              type="button"
            >
              Settings
            </button>
            <button
              className={tabButton({
                active: sidebarTab === "debug",
                className: "flex-1",
                size: "xs",
              })}
              onClick={() => setSidebarTab("debug")}
              type="button"
            >
              Debug
            </button>
          </div>

          {/* Browse tab */}
          {sidebarTab === "browse" && (
            <div className="space-y-2">
              <input
                className={inputField({
                  className:
                    "placeholder:text-slate-400 dark:placeholder:text-slate-500",
                  size: "md",
                })}
                onChange={(e) => setChartFilter(e.target.value)}
                placeholder="Filter charts..."
                type="text"
                value={chartFilter}
              />
              <div
                className="overflow-auto pr-1"
                style={{ maxHeight: "calc(100vh - 160px)" }}
              >
                <div className="grid grid-cols-2 gap-1">
                  {filteredCharts.map((chart) => (
                    <SidebarItem
                      active={selectedChart === chart.chartId}
                      key={chart.chartId}
                      label={chart.title}
                      onClick={() => setSelectedChart(chart.chartId)}
                    />
                  ))}
                </div>
                {filteredCharts.length === 0 && (
                  <div className="py-4 text-center text-xs text-slate-400">
                    No matching charts
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Settings tab */}
          {sidebarTab === "settings" && (
            <div className="space-y-2">
              <label className="block text-sm">
                <div className="mb-1 text-xs text-slate-500 dark:text-slate-400">
                  Series preset
                </div>
                <select
                  className={inputField()}
                  onChange={(e) =>
                    setSeriesPreset(e.target.value as SeriesPreset)
                  }
                  value={seriesPreset}
                >
                  <option value="trend">Trend</option>
                  <option value="seasonal">Seasonal</option>
                  <option value="spiky">Spiky</option>
                  <option value="random-walk">Random walk</option>
                </select>
              </label>

              <label className="block text-sm">
                <div className="mb-1 text-xs text-slate-500 dark:text-slate-400">
                  Seed
                </div>
                <div className="flex gap-2">
                  <input
                    className={inputField({ font: "mono" })}
                    onChange={(e) => setSeed(e.target.value)}
                    value={seed}
                  />
                  <button
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:shadow active:scale-[0.98] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    onClick={() =>
                      setSeed(`mv-${Math.floor(Math.random() * 10_000)}`)
                    }
                    type="button"
                  >
                    Random
                  </button>
                </div>
              </label>

              <FieldRange
                label="Series length"
                max={80}
                min={3}
                onChange={setSeriesLength}
                value={seriesLength}
              />

              <FieldRange
                label="Segment count"
                max={8}
                min={1}
                onChange={setSegmentCount}
                value={segmentCount}
              />

              <ToggleGroup<Wrapper>
                columns={3}
                label="Wrapper"
                onChange={setWrapper}
                options={[
                  { id: "vanilla", label: "Vanilla (TS)" },
                  { id: "react", label: "React" },
                  { id: "elements", label: "Web components" },
                ]}
                value={wrapper}
              />

              <ToggleGroup<Renderer>
                columns={2}
                disabled={wrapper === "elements"}
                label="Renderer"
                onChange={setRenderer}
                options={[
                  { id: "svg-string", label: "SVG (string)" },
                  { id: "svg-dom", label: "SVG (DOM)" },
                  { id: "canvas", label: "Canvas" },
                  { id: "offscreen-canvas", label: "OffscreenCanvas (worker)" },
                ]}
                value={renderer}
              />

              <ToggleGroup<ComputeMode>
                columns={2}
                disabled={renderer === "offscreen-canvas"}
                label="Compute"
                onChange={setComputeMode}
                options={[
                  { id: "main", label: "Main thread" },
                  { id: "worker", label: "Worker" },
                ]}
                value={computeModeEffective}
              />

              <div className="grid grid-cols-2 gap-2">
                <FieldNumberWithRange
                  label="Width"
                  max={520}
                  min={80}
                  onChange={setWidth}
                  value={width}
                />
                <FieldNumberWithRange
                  label="Height"
                  max={140}
                  min={16}
                  onChange={setHeight}
                  value={height}
                />
              </div>
            </div>
          )}

          {/* Debug tab */}
          {sidebarTab === "debug" && (
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Render
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                <input
                  checked={applyNoiseOverlay}
                  className="accent-blue-500"
                  onChange={(e) => setApplyNoiseOverlay(e.target.checked)}
                  type="checkbox"
                />
                <span className="text-sm">
                  Overlay noise displacement filter (SVG-only)
                </span>
              </label>

              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                <input
                  checked={fallbackSvgWhenCanvasUnsupported}
                  className="accent-blue-500"
                  disabled={
                    wrapper === "elements" ||
                    (renderer !== "canvas" && renderer !== "offscreen-canvas")
                  }
                  onChange={(e) =>
                    setFallbackSvgWhenCanvasUnsupported(e.target.checked)
                  }
                  type="checkbox"
                />
                <span className="text-sm">
                  Fallback to SVG when Canvas ignores filters
                </span>
              </label>

              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                <input
                  checked={showHoverTooltip}
                  className="accent-blue-500"
                  disabled={wrapper !== "elements"}
                  onChange={(e) => setShowHoverTooltip(e.target.checked)}
                  type="checkbox"
                />
                <span className="text-sm">Hover tooltip (elements)</span>
              </label>

              {wrapper !== "elements" && (
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Only available for web components (uses `microviz-hit`
                  events).
                </div>
              )}

              {wrapper === "elements" && (
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Canvas fallback is disabled for web components (SVG-only).
                </div>
              )}

              {wrapper !== "elements" &&
                renderer !== "canvas" &&
                renderer !== "offscreen-canvas" && (
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Only applies when using Canvas renderers.
                  </div>
                )}
            </div>
          )}
        </div>
      </ResizablePane>

      <div className="min-w-0 flex-1 overflow-auto p-4">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Playground</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Compare wrappers, renderers, and compute modes.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <div
                aria-label="Chart subtype filter"
                className="inline-flex rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900"
                role="tablist"
              >
                {chartSubtypeOptions.map((option) => {
                  const selected = chartSubtype === option.id;
                  return (
                    <button
                      aria-selected={selected}
                      className={tabButton({
                        active: selected,
                        size: "xs",
                        variant: "muted",
                      })}
                      key={option.id}
                      onClick={() => setChartSubtype(option.id)}
                      role="tab"
                      type="button"
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
              <div
                className="text-xs text-slate-500 dark:text-slate-400"
                title={`${visibleCharts.length} of ${chartCatalog.length} charts`}
              >
                {visibleCharts.length} charts
              </div>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {wrapper} · {renderer} · {computeModeEffective}
            </div>
          </div>
        </div>

        {/* Wide charts (default) - standard 2-column grid */}
        {chartsByAspectRatio.wide.length > 0 && (
          <div className="mb-6">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Wide
            </div>
            <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
              {chartsByAspectRatio.wide.map((chart) => {
                const model = effectiveModels[chart.chartId] ?? null;
                return (
                  <ChartCard
                    active={selectedChart === chart.chartId}
                    chartId={chart.chartId}
                    hasWarnings={hasDiagnosticsWarnings(model, renderer)}
                    key={chart.chartId}
                    model={model}
                    onSelect={setSelectedChart}
                    render={renderSurface(chart.chartId)}
                    timingMs={timingsMs[chart.chartId]}
                    title={chart.title}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Square charts - tighter grid for compact items */}
        {chartsByAspectRatio.square.length > 0 && (
          <div className="mb-6">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Square
            </div>
            <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(120px,1fr))]">
              {chartsByAspectRatio.square.map((chart) => {
                const model = effectiveModels[chart.chartId] ?? null;
                return (
                  <ChartCard
                    active={selectedChart === chart.chartId}
                    centered
                    chartId={chart.chartId}
                    hasWarnings={hasDiagnosticsWarnings(model, renderer)}
                    key={chart.chartId}
                    model={model}
                    onSelect={setSelectedChart}
                    render={renderSurface(chart.chartId)}
                    timingMs={timingsMs[chart.chartId]}
                    title={chart.title}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Tall charts - horizontal flow for vertical items */}
        {chartsByAspectRatio.tall.length > 0 && (
          <div className="mb-6">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Tall
            </div>
            <div className="flex flex-wrap gap-3">
              {chartsByAspectRatio.tall.map((chart) => {
                const model = effectiveModels[chart.chartId] ?? null;
                return (
                  <ChartCard
                    active={selectedChart === chart.chartId}
                    chartId={chart.chartId}
                    compact
                    hasWarnings={hasDiagnosticsWarnings(model, renderer)}
                    key={chart.chartId}
                    model={model}
                    onSelect={setSelectedChart}
                    render={renderSurface(chart.chartId)}
                    timingMs={timingsMs[chart.chartId]}
                    title={chart.title}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      <ResizablePane
        className="h-full border-l border-slate-200 bg-white/70 dark:border-slate-800 dark:bg-slate-950/40"
        collapsible
        defaultSize={380}
        name="inspector"
        side="right"
      >
        <div className="p-4">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">Inspector</div>
              <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {selectedChart}
              </div>
            </div>
          </div>

          <div className="mb-3 flex flex-wrap gap-2">
            {inspectorTabOptions.map((tab) => (
              <button
                className={tabButton({
                  active: inspectorTab === tab,
                  variant: "filled",
                })}
                key={tab}
                onClick={() => setInspectorTab(tab)}
                type="button"
              >
                {tab}
              </button>
            ))}
          </div>

          {inspectorTab === "diagnostics" && (
            <div className="space-y-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Selected warnings
                </div>
                <div className="mt-2">
                  {formatWarningsList(
                    getDiagnosticsWarnings(selectedModel ?? null, renderer),
                  )}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  All warnings
                </div>
                <div className="mt-2">
                  {allWarnings.length === 0 ? (
                    <div className="text-sm">None</div>
                  ) : (
                    <div className="space-y-2">
                      {allWarnings.map((row) => (
                        <Fragment key={row.chartId}>
                          <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                            {row.chartId}
                          </div>
                          <ul className="space-y-1 text-sm">
                            {row.warnings.map((w, i) => (
                              <li key={`${row.chartId}-${w.code}-${i}`}>
                                <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                                  {w.code}
                                </span>
                                <span className="ml-2">{w.message}</span>
                              </li>
                            ))}
                          </ul>
                        </Fragment>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {inspectorTab === "model" && (
            <div className="overflow-auto rounded bg-slate-950/5 p-2 dark:bg-slate-900/30">
              <JsonViewer data={selectedModel} />
            </div>
          )}

          {inspectorTab === "data" && (
            <div className="overflow-auto rounded bg-slate-950/5 p-2 dark:bg-slate-900/30">
              <JsonViewer
                data={{
                  input: selectedInput,
                  seed,
                  segments,
                  series,
                }}
              />
            </div>
          )}
        </div>
      </ResizablePane>
    </div>
  );
};

const SidebarItem: FC<{
  active: boolean;
  label: string;
  onClick: () => void;
}> = ({ active, label, onClick }) => (
  <button
    className={sidebarItem({ active })}
    onClick={onClick}
    title={label}
    type="button"
  >
    {label}
  </button>
);

const FieldRange: FC<{
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  value: number;
}> = ({ label, max, min, onChange, value }) => (
  <label className="block text-sm">
    <div className="mb-1 flex items-baseline justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
      <span>{label}</span>
      <span className="font-mono">{value}</span>
    </div>
    <input
      className="w-full accent-blue-500"
      max={max}
      min={min}
      onChange={(e) => onChange(Number(e.target.value))}
      type="range"
      value={value}
    />
  </label>
);

const FieldNumber: FC<{
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  value: number;
}> = ({ label, max, min, onChange, value }) => (
  <label className="block text-sm">
    <div className="mb-1 text-xs text-slate-500 dark:text-slate-400">
      {label}
    </div>
    <input
      className={inputField({ font: "mono" })}
      max={max}
      min={min}
      onChange={(e) => onChange(Number(e.target.value))}
      type="number"
      value={value}
    />
  </label>
);

const FieldNumberWithRange: FC<{
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  value: number;
}> = ({ label, max, min, onChange, value }) => (
  <div className="space-y-2">
    <FieldNumber
      label={label}
      max={max}
      min={min}
      onChange={onChange}
      value={value}
    />
    <input
      aria-label={`${label} range`}
      className="w-full accent-blue-500"
      max={max}
      min={min}
      onChange={(e) => onChange(Number(e.target.value))}
      type="range"
      value={value}
    />
  </div>
);

const SvgStringPreview: FC<{ svg: string }> = ({ svg }) => {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    if (!svg) {
      host.replaceChildren();
      return;
    }

    const wrapper = document.createElement("div");
    wrapper.innerHTML = svg;
    const el = wrapper.firstElementChild;
    if (el) host.replaceChildren(el);
  }, [svg]);

  return <div className="inline-block" ref={hostRef} />;
};

const SvgDomPreview: FC<{ model: RenderModel }> = ({ model }) => {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hostRef.current) return;
    hostRef.current.replaceChildren(renderSvgElement(model));
  }, [model]);

  return <div className="inline-block" ref={hostRef} />;
};

const CanvasPreview: FC<{
  model: RenderModel;
  options: RenderCanvasOptions;
}> = ({ model, options }) => {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    renderCanvas(ctx, model, options);
  }, [model, options]);

  return (
    <canvas
      className="rounded bg-[var(--mv-bg)]"
      height={model.height}
      ref={ref}
      width={model.width}
    />
  );
};

const ElementPreview: FC<{ model: RenderModel; showHoverTooltip: boolean }> = ({
  model,
  showHoverTooltip,
}) => {
  const ref = useRef<MicrovizModelElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hovered, setHovered] = useState<{
    hit: { markId: string; markType: string };
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.model = model;
  }, [model]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!showHoverTooltip) return;

    const onHit = (event: Event) => {
      const detail = (event as CustomEvent).detail as
        | {
            client?: { x: number; y: number };
            hit: { markId: string; markType: string } | null;
          }
        | undefined;

      if (!detail?.hit || !detail.client) {
        setHovered(null);
        return;
      }

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      setHovered({
        hit: detail.hit,
        x: detail.client.x - rect.left,
        y: detail.client.y - rect.top,
      });
    };

    el.addEventListener("microviz-hit", onHit);
    return () => el.removeEventListener("microviz-hit", onHit);
  }, [showHoverTooltip]);

  useEffect(() => {
    if (!showHoverTooltip) setHovered(null);
  }, [showHoverTooltip]);

  const setRef = (node: MicrovizModelElement | null) => {
    ref.current = node;
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      <microviz-model interactive={showHoverTooltip} ref={setRef} />
      {showHoverTooltip && hovered && (
        <div
          className="pointer-events-none absolute z-10 rounded-md bg-slate-900/90 px-2 py-1 text-xs text-slate-50 shadow-sm"
          style={{ left: hovered.x + 8, top: hovered.y + 8 }}
        >
          <div className="max-w-[180px] truncate">
            {hovered.hit.markType} · {hovered.hit.markId}
          </div>
        </div>
      )}
    </div>
  );
};
