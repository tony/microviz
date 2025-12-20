import {
  type ChartSpec,
  type ComputeModelInput,
  computeModel,
  type RenderModel,
} from "@microviz/core";
import {
  getCanvasUnsupportedFilterPrimitiveTypes,
  renderCanvas,
  renderSvgString,
} from "@microviz/renderers";
import "@microviz/elements";
import {
  createElement,
  type FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { applyNoiseDisplacementOverlay } from "../modelOverlays";
import { renderSvgElement } from "./svgDom";

type Surface =
  | "svg-string"
  | "svg-dom"
  | "canvas"
  | "offscreen-canvas"
  | "elements";

type ComputeMode = "main" | "worker";

type MicrovizModelElement = HTMLElement & { model: RenderModel | null };

type WorkerModelResponse = { type: "model"; id: number; model: RenderModel };
type WorkerErrorResponse = { type: "error"; id?: number; message: string };
type WorkerResponse = WorkerModelResponse | WorkerErrorResponse;

class ModelWorkerClient {
  #worker: Worker;
  #nextId = 1;
  #pending = new Map<
    number,
    { reject: (err: Error) => void; resolve: (model: RenderModel) => void }
  >();

  constructor() {
    this.#worker = new Worker(new URL("./worker.ts", import.meta.url), {
      type: "module",
    });

    this.#worker.addEventListener(
      "message",
      (event: MessageEvent<WorkerResponse>) => {
        const msg = event.data;
        if (msg.type === "model") {
          const pending = this.#pending.get(msg.id);
          if (!pending) return;
          this.#pending.delete(msg.id);
          pending.resolve(msg.model);
          return;
        }

        if (msg.id === undefined) return;
        const pending = this.#pending.get(msg.id);
        if (!pending) return;
        this.#pending.delete(msg.id);
        pending.reject(new Error(msg.message));
      },
    );
  }

  compute(input: ComputeModelInput): Promise<RenderModel> {
    const id = this.#nextId++;
    this.#worker.postMessage({ id, input, type: "compute" });
    return new Promise((resolve, reject) => {
      this.#pending.set(id, { reject, resolve });
    });
  }

  terminate(): void {
    this.#worker.terminate();
  }
}

type ChartId = ChartSpec["type"];

function elementForChart(
  chart: ChartId,
  setElementRef: (node: MicrovizModelElement | null) => void,
) {
  const tag = `microviz-${chart}`;
  const safeTag =
    typeof customElements !== "undefined" && customElements.get(tag)
      ? tag
      : "microviz-model";

  return createElement(safeTag, {
    ref: setElementRef as (node: HTMLElement | null) => void,
  });
}

const CHART_SIZE = { height: 32, width: 200 } as const;

const DEMO_SERIES: number[] = [
  22, 28, 40, 36, 52, 48, 60, 55, 68, 62, 74, 70, 82, 77, 90, 86,
];

const DEMO_OPACITIES: number[] = DEMO_SERIES.map((v) => (v < 35 ? 0.35 : 1));

const DEMO_SEGMENTS: Array<{ name?: string; pct: number; color: string }> = [
  { color: "oklch(0.65 0.15 250)", name: "TypeScript", pct: 38 },
  { color: "oklch(0.7 0.15 150)", name: "React", pct: 22 },
  { color: "oklch(0.72 0.15 80)", name: "CSS", pct: 14 },
  { color: "oklch(0.72 0.12 30)", name: "HTML", pct: 10 },
  { color: "oklch(0.68 0.14 10)", name: "Other", pct: 16 },
];

const DEMO_BAND_SEED = 137;

type DemoInputBuilder = (args: {
  targetValue: number;
  value: number;
}) => ComputeModelInput;

const demoInputBuilders = {
  bar: ({ value }) => ({
    data: { max: 100, value },
    size: CHART_SIZE,
    spec: { pad: 2, type: "bar" },
  }),
  barcode: () => ({
    data: DEMO_SEGMENTS,
    size: CHART_SIZE,
    spec: { bins: 48, pad: 0, type: "barcode" },
  }),
  bitfield: () => ({
    data: DEMO_SEGMENTS,
    size: CHART_SIZE,
    spec: { cellSize: 4, dotRadius: 1.6, type: "bitfield" },
  }),
  "bullet-delta": ({ targetValue, value }) => ({
    data: { current: value, max: 100, previous: targetValue },
    size: CHART_SIZE,
    spec: { type: "bullet-delta" },
  }),
  "bullet-gauge": () => ({
    data: DEMO_SEGMENTS,
    size: CHART_SIZE,
    spec: { gap: 0, pad: 0, type: "bullet-gauge" },
  }),
  "cascade-steps": () => ({
    data: DEMO_SEGMENTS,
    size: CHART_SIZE,
    spec: {
      gap: 2,
      minHeightPct: 30,
      pad: 0,
      stepDecrement: 15,
      type: "cascade-steps",
    },
  }),
  chevron: () => ({
    data: DEMO_SEGMENTS,
    size: CHART_SIZE,
    spec: { overlap: 6, pad: 0, type: "chevron" },
  }),
  "code-minimap": () => ({
    data: DEMO_SEGMENTS,
    size: { height: 32, width: 32 },
    spec: { pad: 0, type: "code-minimap" },
  }),
  "concentric-arcs": () => ({
    data: DEMO_SEGMENTS,
    size: { height: 60, width: 60 },
    spec: {
      pad: 2,
      ringGap: 2,
      strokeWidth: 4,
      type: "concentric-arcs",
    },
  }),
  "concentric-arcs-horiz": () => ({
    data: DEMO_SEGMENTS,
    size: CHART_SIZE,
    spec: {
      maxArcs: 4,
      pad: 0,
      step: 10,
      strokeWidth: 3,
      type: "concentric-arcs-horiz",
    },
  }),
  "dna-helix": () => ({
    data: DEMO_SEGMENTS,
    size: CHART_SIZE,
    spec: {
      gap: 2,
      pad: 0,
      strandGap: 4,
      strandHeight: 6,
      type: "dna-helix",
    },
  }),
  donut: () => ({
    data: DEMO_SEGMENTS,
    size: { height: 60, width: 60 },
    spec: {
      innerRadius: 0.5,
      pad: 2,
      type: "donut",
    },
  }),
  "dot-cascade": () => ({
    data: DEMO_SEGMENTS,
    size: CHART_SIZE,
    spec: { dotRadius: 4, dots: 16, pad: 0, type: "dot-cascade" },
  }),
  "dot-matrix": () => ({
    data: { opacities: DEMO_OPACITIES, series: DEMO_SERIES },
    size: CHART_SIZE,
    spec: { cols: 32, maxDots: 4, type: "dot-matrix" },
  }),
  "dot-row": () => ({
    data: DEMO_SEGMENTS,
    size: CHART_SIZE,
    spec: { dotRadius: 6, dots: 12, gap: 4, pad: 0, type: "dot-row" },
  }),
  dumbbell: ({ targetValue, value }) => ({
    data: { current: value, max: 100, target: targetValue },
    size: CHART_SIZE,
    spec: { pad: 6, type: "dumbbell" },
  }),
  equalizer: () => ({
    data: DEMO_SERIES,
    size: CHART_SIZE,
    spec: {
      barWidth: 6,
      bins: 24,
      colors: DEMO_SEGMENTS.map((segment) => segment.color),
      gap: 1,
      pad: 0,
      type: "equalizer",
    },
  }),
  "faded-pyramid": () => ({
    data: DEMO_SEGMENTS,
    size: CHART_SIZE,
    spec: {
      gap: 2,
      heightDecrement: 15,
      minHeightPct: 30,
      pad: 0,
      type: "faded-pyramid",
    },
  }),
  "gradient-fade": () => ({
    data: DEMO_SEGMENTS,
    size: CHART_SIZE,
    spec: { pad: 0, type: "gradient-fade" },
  }),
  "hand-of-cards": () => ({
    data: DEMO_SEGMENTS,
    size: { height: 60, width: 100 },
    spec: {
      cardHeightPct: 70,
      cardWidthPct: 35,
      fanAngle: 40,
      pad: 0,
      type: "hand-of-cards",
    },
  }),
  heatgrid: () => ({
    data: { opacities: DEMO_OPACITIES, series: DEMO_SERIES },
    size: CHART_SIZE,
    spec: { cols: 12, rows: 4, type: "heatgrid" },
  }),
  histogram: () => ({
    data: { opacities: DEMO_OPACITIES, series: DEMO_SERIES },
    size: CHART_SIZE,
    spec: { bins: 18, pad: 3, type: "histogram" },
  }),
  interlocking: () => ({
    data: DEMO_SEGMENTS,
    size: CHART_SIZE,
    spec: { pad: 0, type: "interlocking" },
  }),
  "layered-waves": () => ({
    data: DEMO_SEGMENTS,
    size: CHART_SIZE,
    spec: {
      baseOpacity: 0.6,
      cornerRadius: 8,
      pad: 0,
      type: "layered-waves",
      waveOffset: 12,
    },
  }),
  lollipop: () => ({
    data: DEMO_SEGMENTS,
    size: CHART_SIZE,
    spec: {
      dotRadius: 4,
      maxItems: 5,
      minStemHeight: 6,
      pad: 0,
      stemWidth: 3,
      type: "lollipop",
    },
  }),
  "masked-wave": () => ({
    data: DEMO_SEGMENTS,
    size: CHART_SIZE,
    spec: { pad: 0, type: "masked-wave" },
  }),
  matryoshka: () => ({
    data: DEMO_SEGMENTS,
    size: { height: 50, width: 200 },
    spec: { cornerRadius: 4, pad: 0, type: "matryoshka" },
  }),
  "micro-heatline": () => ({
    data: DEMO_SEGMENTS,
    size: CHART_SIZE,
    spec: {
      gap: 2,
      lineHeight: 2,
      maxLines: 6,
      pad: 0,
      type: "micro-heatline",
    },
  }),
  mosaic: () => ({
    data: DEMO_SEGMENTS,
    size: CHART_SIZE,
    spec: { gap: 1, pad: 0, type: "mosaic" },
  }),
  "nano-ring": () => ({
    data: DEMO_SEGMENTS,
    size: { height: 24, width: 24 },
    spec: {
      gapSize: 2,
      pad: 1,
      strokeWidth: 2,
      type: "nano-ring",
    },
  }),
  "orbital-dots": () => ({
    data: DEMO_SEGMENTS,
    size: { height: 60, width: 60 },
    spec: {
      maxDotRadius: 6,
      minDotRadius: 2,
      pad: 0,
      ringStrokeWidth: 1,
      type: "orbital-dots",
    },
  }),
  pareto: () => ({
    data: DEMO_SEGMENTS,
    size: CHART_SIZE,
    spec: { gap: 0, pad: 0, type: "pareto" },
  }),
  "pattern-tiles": () => ({
    data: DEMO_SEGMENTS,
    size: CHART_SIZE,
    spec: { pad: 0, type: "pattern-tiles" },
  }),
  perforated: () => ({
    data: DEMO_SEGMENTS,
    size: CHART_SIZE,
    spec: { pad: 0, type: "perforated" },
  }),
  pipeline: () => ({
    data: DEMO_SEGMENTS,
    size: CHART_SIZE,
    spec: { overlap: 8, pad: 0, type: "pipeline" },
  }),
  "pixel-column": () => ({
    data: DEMO_SEGMENTS,
    size: { height: 48, width: 16 },
    spec: { gap: 1, minPx: 1, pad: 0, type: "pixel-column" },
  }),
  "pixel-grid": () => ({
    data: DEMO_SEGMENTS,
    size: CHART_SIZE,
    spec: { cols: 16, gap: 2, pad: 0, rows: 2, type: "pixel-grid" },
  }),
  "pixel-pill": () => ({
    data: DEMO_SEGMENTS,
    size: CHART_SIZE,
    spec: { gap: 1, minPx: 1, pad: 0, type: "pixel-pill" },
  }),
  "pixel-treemap": () => ({
    data: DEMO_SEGMENTS,
    size: { height: 60, width: 60 },
    spec: { cornerRadius: 6, pad: 0, type: "pixel-treemap" },
  }),
  "progress-pills": () => ({
    data: DEMO_SEGMENTS,
    size: CHART_SIZE,
    spec: { gap: 4, pad: 0, pillHeight: 10, type: "progress-pills" },
  }),
  "radial-bars": () => ({
    data: DEMO_SEGMENTS,
    size: { height: 60, width: 60 },
    spec: { minLength: 3, pad: 0, strokeWidth: 3, type: "radial-bars" },
  }),
  "radial-burst": () => ({
    data: DEMO_SEGMENTS,
    size: CHART_SIZE,
    spec: { pad: 0, type: "radial-burst" },
  }),
  "range-band": () => ({
    data: DEMO_SERIES,
    size: CHART_SIZE,
    spec: { bandSeed: DEMO_BAND_SEED, type: "range-band" },
  }),
  "ranked-lanes": () => ({
    data: DEMO_SEGMENTS,
    size: CHART_SIZE,
    spec: { laneHeight: 5, maxLanes: 5, pad: 0, type: "ranked-lanes" },
  }),
  "segmented-bar": () => ({
    data: DEMO_SEGMENTS,
    size: CHART_SIZE,
    spec: { gap: 2, type: "segmented-bar" },
  }),
  "segmented-pill": () => ({
    data: DEMO_SEGMENTS,
    size: CHART_SIZE,
    spec: { pad: 0, type: "segmented-pill" },
  }),
  "segmented-ring": () => ({
    data: DEMO_SEGMENTS,
    size: { height: 32, width: 32 },
    spec: {
      gapSize: 4,
      pad: 2,
      strokeWidth: 3,
      type: "segmented-ring",
    },
  }),
  "shadow-depth": () => ({
    data: DEMO_SEGMENTS,
    size: CHART_SIZE,
    spec: {
      cornerRadius: 4,
      gap: 4,
      maxItems: 4,
      pad: 0,
      type: "shadow-depth",
    },
  }),
  "shape-row": () => ({
    data: DEMO_SEGMENTS,
    size: { height: 8, width: 32 },
    spec: { maxShapes: 4, pad: 0, type: "shape-row" },
  }),
  skyline: () => ({
    data: DEMO_SEGMENTS,
    size: CHART_SIZE,
    spec: { gap: 2, minHeightPct: 20, pad: 0, type: "skyline" },
  }),
  "spark-area": () => ({
    data: DEMO_SERIES,
    size: CHART_SIZE,
    spec: { pad: 3, type: "spark-area" },
  }),
  sparkline: () => ({
    data: DEMO_SERIES,
    size: CHART_SIZE,
    spec: { pad: 3, showDot: true, type: "sparkline" },
  }),
  "sparkline-bars": () => ({
    data: DEMO_SERIES,
    size: CHART_SIZE,
    spec: { barRadius: 1, gap: 1, pad: 2, type: "sparkline-bars" },
  }),
  "split-pareto": () => ({
    data: DEMO_SEGMENTS,
    size: CHART_SIZE,
    spec: { gap: 0, pad: 0, type: "split-pareto" },
  }),
  "split-ribbon": () => ({
    data: DEMO_SEGMENTS,
    size: CHART_SIZE,
    spec: { gap: 2, pad: 0, ribbonGap: 4, type: "split-ribbon" },
  }),
  "stacked-bar": () => ({
    data: DEMO_SEGMENTS,
    size: CHART_SIZE,
    spec: { type: "stacked-bar" },
  }),
  "stacked-chips": () => ({
    data: DEMO_SEGMENTS,
    size: { height: 12, width: 48 },
    spec: {
      className: "transition-all duration-500 text-white dark:text-slate-800",
      maxChips: 4,
      maxChipWidth: 24,
      minChipWidth: 12,
      overlap: 4,
      pad: 0,
      strokeWidth: 2,
      type: "stacked-chips",
    },
  }),
  "step-line": () => ({
    data: DEMO_SERIES,
    size: CHART_SIZE,
    spec: { pad: 3, showDot: true, type: "step-line" },
  }),
  "stepped-area": () => ({
    data: DEMO_SEGMENTS,
    size: CHART_SIZE,
    spec: { gap: 0, pad: 0, stepOffset: 5, type: "stepped-area" },
  }),
  "stripe-density": () => ({
    data: DEMO_SEGMENTS,
    size: CHART_SIZE,
    spec: { pad: 0, type: "stripe-density" },
  }),
  tapered: () => ({
    data: DEMO_SEGMENTS,
    size: CHART_SIZE,
    spec: { pad: 0, type: "tapered" },
  }),
  "two-tier": () => ({
    data: DEMO_SEGMENTS,
    size: CHART_SIZE,
    spec: { gap: 1, pad: 0, type: "two-tier" },
  }),
  "variable-ribbon": () => ({
    data: DEMO_SEGMENTS,
    size: CHART_SIZE,
    spec: {
      gap: 1,
      minHeightPct: 30,
      pad: 0,
      stepDecrement: 18,
      type: "variable-ribbon",
    },
  }),
  "vertical-stack": () => ({
    data: DEMO_SEGMENTS,
    size: { height: 32, width: 8 },
    spec: { pad: 0, type: "vertical-stack" },
  }),
  waveform: () => ({
    data: DEMO_SERIES,
    size: CHART_SIZE,
    spec: {
      barWidth: 6,
      bins: 24,
      colors: DEMO_SEGMENTS.map((segment) => segment.color),
      gap: 1,
      pad: 0,
      type: "waveform",
    },
  }),
} satisfies Record<ChartId, DemoInputBuilder>;

const chartOptions = Object.keys(demoInputBuilders) as ChartId[];

const chartLabelOverrides: Partial<Record<ChartId, string>> = {
  histogram: "Mini histogram",
  waveform: "Waveform bars",
};

function defaultChartTitle(chartId: ChartId): string {
  const parts = chartId.split("-");
  const first = parts[0];
  if (!first) return chartId;
  const rest = parts.slice(1);
  return [`${first[0].toUpperCase()}${first.slice(1)}`, ...rest].join(" ");
}

function chartLabel(chartId: ChartId): string {
  return chartLabelOverrides[chartId] ?? defaultChartTitle(chartId);
}

function buildInput(
  chart: ChartId,
  value: number,
  targetValue: number,
): ComputeModelInput {
  return demoInputBuilders[chart]({ targetValue, value });
}

function useModel(
  input: ComputeModelInput,
  computeMode: ComputeMode,
): RenderModel | null {
  const clientRef = useRef<ModelWorkerClient | null>(null);
  const [model, setModel] = useState<RenderModel | null>(null);

  useEffect(() => {
    return () => {
      clientRef.current?.terminate();
      clientRef.current = null;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (computeMode === "main") {
      setModel(computeModel(input));
      return;
    }

    if (!clientRef.current) clientRef.current = new ModelWorkerClient();
    void clientRef.current.compute(input).then((m) => {
      if (cancelled) return;
      setModel(m);
    });

    return () => {
      cancelled = true;
    };
  }, [computeMode, input]);

  return model;
}

const OffscreenCanvasPreview: FC<{
  applyNoiseOverlay: boolean;
  fillStyle: string;
  input: ComputeModelInput;
  strokeStyle: string;
  strokeWidth: number;
}> = ({ applyNoiseOverlay, fillStyle, input, strokeStyle, strokeWidth }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    if (typeof canvasEl.transferControlToOffscreen !== "function") return;

    let cancelled = false;
    let rafId: number | null = null;

    // React StrictMode (dev) runs effects setup/cleanup/setup once. Since a
    // canvas can only be transferred once, delay transfer until after the first
    // cleanup pass and cancel it there.
    rafId = requestAnimationFrame(() => {
      if (cancelled) return;
      const worker = new Worker(new URL("./worker.ts", import.meta.url), {
        type: "module",
      });
      workerRef.current = worker;

      const offscreen = canvasEl.transferControlToOffscreen();
      worker.postMessage({ canvas: offscreen, type: "initOffscreen" }, [
        offscreen,
      ]);
      setReady(true);
    });

    return () => {
      cancelled = true;
      if (rafId !== null) cancelAnimationFrame(rafId);
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const worker = workerRef.current;
    if (!worker) return;
    if (!ready) return;
    worker.postMessage({
      applyNoiseOverlay,
      input,
      options: { fillStyle, strokeStyle, strokeWidth },
      type: "renderOffscreen",
    });
  }, [applyNoiseOverlay, fillStyle, input, ready, strokeStyle, strokeWidth]);

  return (
    <canvas
      className="rounded bg-[var(--mv-bg)]"
      height={input.size.height}
      ref={canvasRef}
      width={input.size.width}
    />
  );
};

export const VanillaPlayground: FC = () => {
  const [surface, setSurface] = useState<Surface>("svg-string");
  const [computeMode, setComputeMode] = useState<ComputeMode>("main");
  const [chart, setChart] = useState<ChartId>("sparkline");
  const [value, setValue] = useState(72);
  const [targetValue, setTargetValue] = useState(60);
  const [applyNoiseOverlay, setApplyNoiseOverlay] = useState(false);
  const [
    fallbackSvgWhenCanvasUnsupported,
    setFallbackSvgWhenCanvasUnsupported,
  ] = useState(false);

  const input = useMemo(
    () => buildInput(chart, value, targetValue),
    [chart, targetValue, value],
  );
  const computeModeEffective: ComputeMode =
    surface === "offscreen-canvas" ? "worker" : computeMode;
  const model = useModel(input, computeModeEffective);
  const effectiveModel = useMemo(() => {
    if (!model) return null;
    return applyNoiseOverlay ? applyNoiseDisplacementOverlay(model) : model;
  }, [applyNoiseOverlay, model]);

  const svgDomHostRef = useRef<HTMLDivElement | null>(null);
  const svgStringHostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const elementRef = useRef<MicrovizModelElement | null>(null);

  const setElementRef = useCallback((node: MicrovizModelElement | null) => {
    elementRef.current = node;
  }, []);

  const fillStyle = "#2563eb";
  const strokeStyle = "#2563eb";
  const strokeWidth = 2.2;

  const svgString = useMemo(
    () => (effectiveModel ? renderSvgString(effectiveModel) : ""),
    [effectiveModel],
  );

  const canvasUnsupportedFilters = useMemo(
    () =>
      effectiveModel
        ? getCanvasUnsupportedFilterPrimitiveTypes(effectiveModel)
        : [],
    [effectiveModel],
  );
  const hasCanvasLimitations =
    (surface === "canvas" || surface === "offscreen-canvas") &&
    canvasUnsupportedFilters.length > 0;
  const shouldFallbackToSvg =
    fallbackSvgWhenCanvasUnsupported && hasCanvasLimitations;
  const showSvgString = surface === "svg-string" || shouldFallbackToSvg;

  useEffect(() => {
    if (surface !== "svg-dom") return;
    if (!svgDomHostRef.current) return;
    if (!effectiveModel) return;
    svgDomHostRef.current.replaceChildren(renderSvgElement(effectiveModel));
  }, [effectiveModel, surface]);

  useEffect(() => {
    if (!showSvgString) return;
    if (!svgStringHostRef.current) return;
    if (!svgString) {
      svgStringHostRef.current.replaceChildren();
      return;
    }

    const wrapper = document.createElement("div");
    wrapper.innerHTML = svgString;
    const el = wrapper.firstElementChild;
    if (el) svgStringHostRef.current.replaceChildren(el);
  }, [showSvgString, svgString]);

  useEffect(() => {
    if (surface !== "canvas") return;
    if (shouldFallbackToSvg) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!effectiveModel) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    renderCanvas(ctx, effectiveModel, { fillStyle, strokeStyle, strokeWidth });
  }, [effectiveModel, shouldFallbackToSvg, surface]);

  useEffect(() => {
    if (surface !== "elements") return;
    const el = elementRef.current;
    if (!el) return;
    if (!effectiveModel) return;
    el.model = effectiveModel;
  }, [effectiveModel, surface]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Vanilla surfaces</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Exercise core + renderers + elements with optional Worker compute.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm text-slate-600 dark:text-slate-300">
            Chart
            <select
              className="ml-2 rounded border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-950"
              onChange={(e) => setChart(e.target.value as ChartId)}
              value={chart}
            >
              {chartOptions.map((chartId) => (
                <option key={chartId} value={chartId}>
                  {chartLabel(chartId)}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-slate-600 dark:text-slate-300">
            Surface
            <select
              className="ml-2 rounded border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-950"
              onChange={(e) => setSurface(e.target.value as Surface)}
              value={surface}
            >
              <option value="svg-string">SVG (string)</option>
              <option value="svg-dom">SVG (DOM)</option>
              <option value="canvas">Canvas</option>
              <option value="offscreen-canvas">OffscreenCanvas (worker)</option>
              <option value="elements">Elements</option>
            </select>
          </label>

          <label className="text-sm text-slate-600 dark:text-slate-300">
            Compute
            <select
              className="ml-2 rounded border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-950"
              disabled={surface === "offscreen-canvas"}
              onChange={(e) => setComputeMode(e.target.value as ComputeMode)}
              value={surface === "offscreen-canvas" ? "worker" : computeMode}
            >
              <option value="main">Main thread</option>
              <option value="worker">Worker</option>
            </select>
          </label>

          {(surface === "canvas" || surface === "offscreen-canvas") && (
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <input
                checked={fallbackSvgWhenCanvasUnsupported}
                className="accent-blue-500"
                onChange={(e) =>
                  setFallbackSvgWhenCanvasUnsupported(e.target.checked)
                }
                type="checkbox"
              />
              <span>Fallback to SVG when Canvas ignores filters</span>
            </label>
          )}

          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input
              checked={applyNoiseOverlay}
              className="accent-blue-500"
              onChange={(e) => setApplyNoiseOverlay(e.target.checked)}
              type="checkbox"
            />
            <span>Overlay noise displacement filter (SVG-only)</span>
          </label>
        </div>
      </div>

      {(chart === "bar" || chart === "dumbbell") && (
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            {chart === "bar" ? "Value" : "Current"}
            <input
              className="w-48 accent-blue-500"
              max={100}
              min={0}
              onChange={(e) => setValue(Number(e.target.value))}
              type="range"
              value={value}
            />
            <span className="w-10 text-right font-mono text-xs text-slate-500 dark:text-slate-400">
              {value}
            </span>
          </label>

          {chart === "dumbbell" && (
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              Target
              <input
                className="w-48 accent-blue-500"
                max={100}
                min={0}
                onChange={(e) => setTargetValue(Number(e.target.value))}
                type="range"
                value={targetValue}
              />
              <span className="w-10 text-right font-mono text-xs text-slate-500 dark:text-slate-400">
                {targetValue}
              </span>
            </label>
          )}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-medium">Preview</div>
          <div className="flex items-center gap-2">
            {hasCanvasLimitations && (
              <div className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-100">
                Canvas ignores: {canvasUnsupportedFilters.join(", ")}
                {shouldFallbackToSvg ? " (showing SVG)" : ""}
              </div>
            )}
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {surface === "offscreen-canvas"
                ? "Worker render"
                : computeModeEffective}
            </div>
          </div>
        </div>

        <div className="mt-3">
          {showSvgString && (
            <div
              className="inline-block rounded bg-[var(--mv-bg)]"
              ref={svgStringHostRef}
            />
          )}

          {surface === "svg-dom" && (
            <div
              className="inline-block rounded bg-[var(--mv-bg)]"
              ref={svgDomHostRef}
            />
          )}

          {surface === "canvas" && !shouldFallbackToSvg && (
            <canvas
              className="rounded bg-[var(--mv-bg)]"
              height={CHART_SIZE.height}
              ref={canvasRef}
              width={CHART_SIZE.width}
            />
          )}

          {surface === "offscreen-canvas" && !shouldFallbackToSvg && (
            <OffscreenCanvasPreview
              applyNoiseOverlay={applyNoiseOverlay}
              fillStyle={fillStyle}
              input={input}
              strokeStyle={strokeStyle}
              strokeWidth={strokeWidth}
            />
          )}

          {surface === "elements" && elementForChart(chart, setElementRef)}
        </div>
      </div>

      <details className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <summary className="cursor-pointer text-sm font-medium">
          RenderModel
        </summary>
        <pre className="mt-3 overflow-auto rounded bg-slate-900/5 p-3 text-xs text-slate-800 dark:bg-slate-950 dark:text-slate-100">
          {JSON.stringify(effectiveModel, null, 2)}
        </pre>
      </details>
    </div>
  );
};
