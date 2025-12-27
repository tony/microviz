import {
  type A11yItem,
  type A11ySummary,
  type ChartMeta,
  type ComputeModelInput,
  computeModel,
  type Def,
  getAllChartMeta,
  getPreferredAspectRatio,
  type Mark,
  type RenderModel,
} from "@microviz/core";
import {
  MicrovizCanvas as MicrovizReactCanvas,
  MicrovizSvg as MicrovizReactSvg,
  MicrovizSvgString as MicrovizReactSvgString,
} from "@microviz/react";
import {
  canvasToBlob,
  getCanvasUnsupportedFilterPrimitiveTypes,
  getHtmlUnsupportedDefTypes,
  getHtmlUnsupportedMarkEffects,
  getHtmlUnsupportedMarkTypes,
  type RenderCanvasOptions,
  renderCanvas,
  renderHtmlString,
  renderSvgString,
  svgStringToBlob,
} from "@microviz/renderers";
import "@microviz/elements";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  type FC,
  Fragment,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { buildPaletteColors } from "../demoPalette";
import { applyNoiseDisplacementOverlay } from "../modelOverlays";
import {
  chartCard,
  chartCardContent,
  inputField,
  sidebarItem,
  statusLed,
  tabButton,
} from "../ui/styles";
import { TabToggle } from "../ui/TabToggle";
import { ToggleGroup } from "../ui/ToggleGroup";
import { renderSvgElement } from "../vanilla/svgDom";
import { JsonViewer } from "./JsonViewer";
import {
  type ChartId,
  type ChartSubtype,
  type ComputeMode,
  DEFAULT_PLAYGROUND_STATE,
  type HtmlFilter,
  type PaletteMode,
  type PlaygroundState,
  type Renderer,
  type SidebarTab,
  type Wrapper,
} from "./playgroundUrlState";
import { ResizablePane } from "./ResizablePane";
import {
  buildCompareRange,
  buildOpacities,
  buildSegmentsForPreset,
  buildSeriesForPreset,
  createSeededRng,
  type DataPreset,
  type SeriesPreset,
} from "./seed";
import { MicrovizWorkerClient } from "./workerClient";

const chartSubtypeOptions = [
  { id: "all", label: "All" },
  { id: "lines", label: "Lines" },
  { id: "bars", label: "Bars" },
  { id: "grids", label: "Grids" },
  { id: "dots", label: "Dots" },
] as const;

/** Charts with minimal data requirements (single value/ratio). Shown in Primitives section. */
const PRIMITIVE_CHART_IDS = new Set<ChartId>([
  "bar",
  "bullet-delta",
  "dumbbell",
]);

const dataPresetOptions: ReadonlyArray<{ id: DataPreset; label: string }> = [
  { id: "balanced", label: "Balanced" },
  { id: "time-series", label: "Time series" },
  { id: "distribution", label: "Distribution" },
  { id: "compare", label: "Compare" },
  { id: "ranking", label: "Ranking" },
];

type ChartCatalogEntry = {
  chartId: ChartId;
  title: string;
  subtype: Exclude<ChartSubtype, "all">;
};

type ChartBlock =
  | { kind: "sectionHeader"; label: string }
  | { kind: "primitiveRow"; charts: ChartCatalogEntry[]; isLast: boolean }
  | { kind: "wideRow"; charts: ChartCatalogEntry[]; isLast: boolean }
  | { kind: "squareRow"; charts: ChartCatalogEntry[]; isLast: boolean }
  | { kind: "tallBlock"; charts: ChartCatalogEntry[] };

// Build catalog directly from registry metadata
const chartMetaMap = new Map<string, ChartMeta>(
  getAllChartMeta().map((meta) => [meta.type, meta]),
);

const useLayoutEffectSafe =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

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

const HTML_SAFE_MARK_TYPES = new Set<Mark["type"]>([
  "rect",
  "circle",
  "line",
  "text",
]);
const HTML_SUPPORTED_FILTER_PRIMITIVES = new Set([
  "dropShadow",
  "gaussianBlur",
]);

const ControlsIcon: FC<{ className?: string }> = ({ className }) => (
  <svg
    aria-hidden="true"
    className={className}
    fill="none"
    height="16"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="1.5"
    viewBox="0 0 24 24"
    width="16"
  >
    <path d="M4 6h10" />
    <path d="M4 12h16" />
    <path d="M4 18h7" />
    <circle cx="18" cy="6" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="11" cy="18" r="2" />
  </svg>
);

const InspectorIcon: FC<{ className?: string }> = ({ className }) => (
  <svg
    aria-hidden="true"
    className={className}
    fill="none"
    height="16"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="1.5"
    viewBox="0 0 24 24"
    width="16"
  >
    <rect height="15" rx="2" width="16" x="4" y="4.5" />
    <path d="M8 9h8" />
    <path d="M8 13h5" />
  </svg>
);

function extractUrlRefId(value: string | undefined): string | null {
  if (!value) return null;
  const match = /url\((['"]?)#?([^'")]+)\1\)/.exec(value);
  return match?.[2] ?? null;
}

function resolveDefId(value: string | undefined): string | null {
  if (!value) return null;
  return extractUrlRefId(value) ?? value;
}

function isHtmlSafeMark(mark: Mark, defsById: Map<string, Def>): boolean {
  if (!HTML_SAFE_MARK_TYPES.has(mark.type)) return false;
  if ("clipPath" in mark && mark.clipPath) {
    const clipId = resolveDefId(mark.clipPath);
    const clipDef = clipId ? defsById.get(clipId) : null;
    if (!clipDef || clipDef.type !== "clipRect") return false;
  }
  if ("mask" in mark && mark.mask) {
    const maskId = resolveDefId(mark.mask);
    const maskDef = maskId ? defsById.get(maskId) : null;
    if (!maskDef || maskDef.type !== "mask") return false;
  }
  if ("filter" in mark && mark.filter) {
    const filterId = resolveDefId(mark.filter);
    const filterDef = filterId ? defsById.get(filterId) : null;
    if (!filterDef || filterDef.type !== "filter") return false;
    if (
      !filterDef.primitives.every((primitive) =>
        HTML_SUPPORTED_FILTER_PRIMITIVES.has(primitive.type),
      )
    )
      return false;
  }
  if ("strokeDasharray" in mark && mark.strokeDasharray) return false;
  if ("strokeDashoffset" in mark && mark.strokeDashoffset) return false;
  const fill = "fill" in mark ? mark.fill : undefined;
  const stroke = "stroke" in mark ? mark.stroke : undefined;
  const fillRefId = extractUrlRefId(fill);
  if (fillRefId) {
    const fillDef = defsById.get(fillRefId);
    if (!fillDef) return false;
    if (fillDef.type === "linearGradient" && mark.type !== "rect") return false;
    if (
      fillDef.type === "pattern" &&
      mark.type !== "rect" &&
      mark.type !== "circle"
    )
      return false;
    if (fillDef.type !== "linearGradient" && fillDef.type !== "pattern")
      return false;
  }
  const strokeRefId = extractUrlRefId(stroke);
  if (strokeRefId) return false;
  return true;
}

function splitHtmlSvgModel(model: RenderModel): {
  htmlModel: RenderModel;
  svgModel: RenderModel | null;
} {
  const defsById = new Map<string, Def>(
    model.defs?.map((def) => [def.id, def]) ?? [],
  );
  const htmlMarks: Mark[] = [];
  const svgMarks: Mark[] = [];

  for (const mark of model.marks) {
    if (isHtmlSafeMark(mark, defsById)) {
      htmlMarks.push(mark);
    } else {
      svgMarks.push(mark);
    }
  }

  const htmlModel: RenderModel = {
    ...model,
    defs: undefined,
    marks: htmlMarks,
  };

  const svgModel: RenderModel | null =
    svgMarks.length > 0 ? { ...model, marks: svgMarks } : null;

  return { htmlModel, svgModel };
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
  requestedChartIds: readonly ChartId[],
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

  const computeModeRef = useRef(computeMode);
  const inputsRef = useRef(inputs);
  const computedRunIdsRef = useRef<Record<ChartId, number>>(
    createRecordFromKeys<ChartId, number>(initialChartIds, -1),
  );
  const runIdRef = useRef(0);
  const inFlightRef = useRef<Map<ChartId, number>>(new Map());
  const mainQueueRef = useRef<ChartId[]>([]);
  const mainQueuedSetRef = useRef<Set<ChartId>>(new Set());
  const mainRafRef = useRef<number | null>(null);
  const workerPendingModelsRef = useRef<
    Partial<Record<ChartId, RenderModel | null>>
  >({});
  const workerPendingTimingsRef = useRef<
    Partial<Record<ChartId, number | null>>
  >({});
  const workerFlushRafRef = useRef<number | null>(null);
  const didInitialPrepaintRef = useRef(false);

  computeModeRef.current = computeMode;
  inputsRef.current = inputs;

  useLayoutEffect(() => {
    runIdRef.current += 1;
    inFlightRef.current.clear();
    mainQueueRef.current = [];
    mainQueuedSetRef.current.clear();
    if (mainRafRef.current !== null) cancelAnimationFrame(mainRafRef.current);
    mainRafRef.current = null;
    workerPendingModelsRef.current = {};
    workerPendingTimingsRef.current = {};
    if (workerFlushRafRef.current !== null)
      cancelAnimationFrame(workerFlushRafRef.current);
    workerFlushRafRef.current = null;

    const chartIds = Object.keys(inputs) as ChartId[];
    computedRunIdsRef.current = Object.fromEntries(
      chartIds.map((chartId) => [
        chartId,
        computedRunIdsRef.current[chartId] ?? -1,
      ]),
    ) as Record<ChartId, number>;

    if (didInitialPrepaintRef.current) return;
    if (computeModeRef.current !== "main") return;

    const runId = runIdRef.current;
    const nextModels: Partial<Record<ChartId, RenderModel | null>> = {};
    const nextTimings: Partial<Record<ChartId, number | null>> = {};

    for (const chartId of chartIds) {
      const input = inputsRef.current[chartId];
      if (!input) continue;

      const start = performance.now();
      const model = computeModel(input);
      const end = performance.now();

      computedRunIdsRef.current[chartId] = runId;
      nextModels[chartId] = model;
      nextTimings[chartId] = Math.round((end - start) * 1000) / 1000;
    }

    if (Object.keys(nextModels).length > 0) {
      setModels((prev) => ({ ...prev, ...nextModels }));
      setTimingsMs((prev) => ({ ...prev, ...nextTimings }));
    }

    didInitialPrepaintRef.current = true;
  }, [inputs]);

  useEffect(() => {
    return () => {
      if (mainRafRef.current !== null) cancelAnimationFrame(mainRafRef.current);
      if (workerFlushRafRef.current !== null)
        cancelAnimationFrame(workerFlushRafRef.current);
    };
  }, []);

  const scheduleMainCompute = useCallback((runId: number) => {
    if (mainRafRef.current !== null) return;

    const budgetMs = 8;

    const runChunk = () => {
      mainRafRef.current = null;

      if (runId !== runIdRef.current) {
        mainQueueRef.current = [];
        mainQueuedSetRef.current.clear();
        return;
      }

      if (computeModeRef.current !== "main") {
        mainQueueRef.current = [];
        mainQueuedSetRef.current.clear();
        return;
      }

      const chunkStart = performance.now();
      const nextModels: Partial<Record<ChartId, RenderModel | null>> = {};
      const nextTimings: Partial<Record<ChartId, number | null>> = {};

      while (mainQueueRef.current.length > 0) {
        const chartId = mainQueueRef.current.shift();
        if (!chartId) break;
        mainQueuedSetRef.current.delete(chartId);

        if (runId !== runIdRef.current) break;
        if (computedRunIdsRef.current[chartId] === runId) continue;

        const input = inputsRef.current[chartId];
        if (!input) continue;

        const start = performance.now();
        const model = computeModel(input);
        const end = performance.now();

        computedRunIdsRef.current[chartId] = runId;
        nextModels[chartId] = model;
        nextTimings[chartId] = Math.round((end - start) * 1000) / 1000;

        if (performance.now() - chunkStart >= budgetMs) break;
      }

      if (Object.keys(nextModels).length > 0) {
        setModels((prev) => ({ ...prev, ...nextModels }));
        setTimingsMs((prev) => ({ ...prev, ...nextTimings }));
      }

      if (mainQueueRef.current.length > 0 && runId === runIdRef.current) {
        mainRafRef.current = requestAnimationFrame(runChunk);
      }
    };

    mainRafRef.current = requestAnimationFrame(runChunk);
  }, []);

  const scheduleWorkerFlush = useCallback(() => {
    if (workerFlushRafRef.current !== null) return;

    workerFlushRafRef.current = requestAnimationFrame(() => {
      workerFlushRafRef.current = null;
      const nextModels = workerPendingModelsRef.current;
      const nextTimings = workerPendingTimingsRef.current;
      workerPendingModelsRef.current = {};
      workerPendingTimingsRef.current = {};

      if (Object.keys(nextModels).length > 0) {
        setModels((prev) => ({ ...prev, ...nextModels }));
      }

      if (Object.keys(nextTimings).length > 0) {
        setTimingsMs((prev) => ({ ...prev, ...nextTimings }));
      }
    });
  }, []);

  useEffect(() => {
    const chartIds = requestedChartIds;
    if (chartIds.length === 0) return;

    const runId = runIdRef.current;

    if (computeMode === "main") {
      const requestedSet = new Set(chartIds);
      if (mainQueueRef.current.length > 0) {
        mainQueueRef.current = mainQueueRef.current.filter((chartId) =>
          requestedSet.has(chartId),
        );
        mainQueuedSetRef.current = new Set(mainQueueRef.current);
      }

      for (const chartId of chartIds) {
        if (computedRunIdsRef.current[chartId] === runId) continue;
        if (mainQueuedSetRef.current.has(chartId)) continue;
        mainQueuedSetRef.current.add(chartId);
        mainQueueRef.current.push(chartId);
      }

      if (mainQueueRef.current.length > 0) scheduleMainCompute(runId);
      return;
    }

    const worker = ensureWorkerClient();

    for (const chartId of chartIds) {
      if (computedRunIdsRef.current[chartId] === runId) continue;
      if (inFlightRef.current.get(chartId) === runId) continue;

      inFlightRef.current.set(chartId, runId);
      const start = performance.now();

      void worker
        .compute(inputs[chartId])
        .then((model) => {
          const end = performance.now();
          if (runId !== runIdRef.current) return;
          computedRunIdsRef.current[chartId] = runId;

          workerPendingModelsRef.current[chartId] = model;
          workerPendingTimingsRef.current[chartId] =
            Math.round((end - start) * 1000) / 1000;
          scheduleWorkerFlush();
        })
        .finally(() => {
          if (inFlightRef.current.get(chartId) !== runId) return;
          inFlightRef.current.delete(chartId);
        });
    }
  }, [
    computeMode,
    ensureWorkerClient,
    inputs,
    requestedChartIds,
    scheduleMainCompute,
    scheduleWorkerFlush,
  ]);

  return { models, timingsMs };
}

type WarningLike = { code: string; message: string };

type GetCanvasUnsupportedFilters = (model: RenderModel) => readonly string[];
type GetHtmlWarnings = (model: RenderModel) => WarningLike[];
type HtmlWarningTag = { detail: string; label: string };

function hasDiagnosticsWarnings(
  model: RenderModel | null,
  renderer: Renderer,
  getCanvasUnsupportedFilters: GetCanvasUnsupportedFilters,
  getHtmlWarnings: GetHtmlWarnings,
) {
  if (!model) return false;
  if ((model.stats?.warnings?.length ?? 0) > 0) return true;
  if (renderer === "canvas" || renderer === "offscreen-canvas")
    return getCanvasUnsupportedFilters(model).length > 0;
  if (renderer === "html" || renderer === "html-svg")
    return getHtmlWarnings(model).length > 0;
  return false;
}

function getDiagnosticsWarnings(
  model: RenderModel | null,
  renderer: Renderer,
  getCanvasUnsupportedFilters: GetCanvasUnsupportedFilters,
  getHtmlWarnings: GetHtmlWarnings,
): WarningLike[] {
  if (!model) return [];

  const warnings: WarningLike[] = [];
  for (const w of model.stats?.warnings ?? []) {
    warnings.push({ code: w.code, message: w.message });
  }

  if (renderer === "canvas" || renderer === "offscreen-canvas") {
    const unsupported = getCanvasUnsupportedFilters(model);
    if (unsupported.length > 0) {
      warnings.push({
        code: "CANVAS_UNSUPPORTED_FILTER",
        message: `Canvas renderer ignores filter primitives: ${unsupported.join(", ")}.`,
      });
    }
  }

  if (renderer === "html" || renderer === "html-svg") {
    warnings.push(...getHtmlWarnings(model));
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

function summarizeWarningCounts(
  warnings: WarningLike[],
): Array<{ code: string; count: number; label: string }> {
  const labelForCode = (code: string): string => {
    switch (code) {
      case "BLANK_RENDER":
        return "Blank render";
      case "EMPTY_DATA":
        return "Empty data";
      case "MISSING_DEF":
        return "Missing def";
      case "MARK_OUT_OF_BOUNDS":
        return "Marks out of bounds";
      case "NAN_COORDINATE":
        return "NaN coordinates";
      case "CANVAS_UNSUPPORTED_FILTER":
        return "Canvas filters";
      case "HTML_UNSUPPORTED_MARK":
        return "HTML marks";
      case "HTML_UNSUPPORTED_DEF":
        return "HTML defs";
      case "HTML_UNSUPPORTED_EFFECT":
        return "HTML effects";
      default:
        return code;
    }
  };

  const counts = new Map<string, number>();
  for (const warning of warnings) {
    counts.set(warning.code, (counts.get(warning.code) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([code, count]) => ({ code, count, label: labelForCode(code) }))
    .sort((a, b) => b.count - a.count || a.code.localeCompare(b.code));
}

function formatA11ySummary(summary?: A11ySummary): string | null {
  if (!summary) return null;
  if (summary.kind === "series") {
    const parts = [`${summary.count} values`];
    if (summary.min !== undefined && summary.max !== undefined) {
      parts.push(`min ${summary.min}`, `max ${summary.max}`);
    }
    if (summary.last !== undefined) parts.push(`last ${summary.last}`);
    if (summary.trend) parts.push(`trend ${summary.trend}`);
    return parts.join(" · ");
  }

  const parts = [`${summary.count} segments`];
  if (summary.largestPct !== undefined) {
    const pct = Math.round(summary.largestPct);
    const name = summary.largestName?.trim();
    parts.push(name ? `largest ${name} ${pct}%` : `largest ${pct}%`);
  }
  return parts.join(" · ");
}

function formatA11yItem(item: A11yItem): string {
  const parts = [item.label];
  if (item.valueText) parts.push(item.valueText);
  else if (item.value !== undefined) parts.push(String(item.value));
  if (item.series) parts.push(item.series);
  if (item.rank !== undefined) parts.push(`#${item.rank}`);
  return parts.join(" · ");
}

function getHtmlWarningTags(model: RenderModel | null): HtmlWarningTag[] {
  if (!model) return [];
  const tags: HtmlWarningTag[] = [];
  const unsupportedMarks = getHtmlUnsupportedMarkTypes(model);
  const unsupportedDefs = getHtmlUnsupportedDefTypes(model);
  const unsupportedEffects = getHtmlUnsupportedMarkEffects(model);

  if (unsupportedMarks.length > 0) {
    tags.push({ detail: unsupportedMarks.join(", "), label: "Marks" });
  }
  if (unsupportedDefs.length > 0) {
    tags.push({ detail: unsupportedDefs.join(", "), label: "Defs" });
  }
  if (unsupportedEffects.length > 0) {
    tags.push({ detail: unsupportedEffects.join(", "), label: "Effects" });
  }

  return tags;
}

function ChartCard({
  active,
  centered,
  chartId,
  compact,
  hasWarnings,
  htmlWarningTags,
  model,
  onSelect,
  render,
  showHtmlBrokenBadge,
  timingMs,
  title,
}: {
  active: boolean;
  centered?: boolean;
  chartId: ChartId;
  compact?: boolean;
  hasWarnings: boolean;
  htmlWarningTags?: HtmlWarningTag[];
  model: RenderModel | null;
  onSelect: (chartId: ChartId) => void;
  render: ReactNode;
  showHtmlBrokenBadge?: boolean;
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
      title={title}
      type="button"
    >
      <div
        className={statusLed({ status: hasWarnings ? "warning" : "success" })}
        title={hasWarnings ? "Warnings" : "OK"}
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

      {showHtmlBrokenBadge && (
        <div className="absolute right-[3px] top-[3px]">
          <div
            className="-me-0.5 -mt-0.5 select-none rounded-bl-lg rounded-tr-lg border border-amber-200 bg-amber-50 px-1.5 py-[1px] text-[9px] tracking-tight text-amber-700 dark:border-amber-400/40 dark:bg-amber-500/10 dark:text-amber-200"
            title={
              htmlWarningTags && htmlWarningTags.length > 0
                ? htmlWarningTags
                    .map((tag) => `${tag.label}: ${tag.detail}`)
                    .join(" | ")
                : "HTML broken"
            }
          >
            HTML Broken
          </div>
        </div>
      )}

      {markCountLabel && (
        <div className="absolute bottom-[3px] left-[3px]">
          <div
            className="-mb-0.5 -ms-0.5 select-none rounded-bl-lg rounded-tr-lg px-1 py-0 text-[10px] leading-tight text-slate-500/60 sm:tracking-tight dark:text-slate-400/60"
            title={markCountLabel}
          >
            {markCountLabel}
          </div>
        </div>
      )}

      {timingMs !== null && (
        <div className="absolute bottom-[3px] right-[3px]">
          <div
            className="-mb-0.5 -me-0.5 select-none rounded-br-lg rounded-tl-lg px-1 py-0 text-[10px] leading-tight text-slate-500/60 sm:tracking-tight dark:text-slate-400/60"
            title={`${timingMs}ms`}
          >
            {timingMs}ms
          </div>
        </div>
      )}
    </button>
  );
}

export const MicrovizPlayground: FC<{
  onUrlStateChange?: (state: PlaygroundState) => void;
  urlState?: PlaygroundState;
}> = ({ onUrlStateChange, urlState }) => {
  const initialUrlState = urlState ?? DEFAULT_PLAYGROUND_STATE;

  const [wrapper, setWrapper] = useState<Wrapper>(
    () => initialUrlState.wrapper,
  );
  const [renderer, setRenderer] = useState<Renderer>(
    () => initialUrlState.renderer,
  );
  const [applyNoiseOverlay, setApplyNoiseOverlay] = useState(
    () => initialUrlState.applyNoiseOverlay,
  );
  const [showHoverTooltip, setShowHoverTooltip] = useState(
    () => initialUrlState.showHoverTooltip,
  );
  const [
    fallbackSvgWhenCanvasUnsupported,
    setFallbackSvgWhenCanvasUnsupported,
  ] = useState(() => initialUrlState.fallbackSvgWhenCanvasUnsupported);
  const [htmlFilter, setHtmlFilter] = useState<HtmlFilter>(
    () => initialUrlState.htmlFilter,
  );
  const [showHtmlSvgOverlay, setShowHtmlSvgOverlay] = useState(
    () => initialUrlState.showHtmlSvgOverlay,
  );
  const [computeMode, setComputeMode] = useState<ComputeMode>(
    () => initialUrlState.computeMode,
  );
  const [dataPreset, setDataPreset] = useState<DataPreset>(
    () => initialUrlState.dataPreset,
  );
  const [seriesPreset, setSeriesPreset] = useState<SeriesPreset>(
    () => initialUrlState.seriesPreset,
  );
  const [paletteMode, setPaletteMode] = useState<PaletteMode>(
    () => initialUrlState.paletteMode,
  );
  const [seed, setSeed] = useState(() => initialUrlState.seed);
  const [seriesLength, setSeriesLength] = useState(
    () => initialUrlState.seriesLength,
  );
  const [segmentCount, setSegmentCount] = useState(
    () => initialUrlState.segmentCount,
  );
  const [selectedChart, setSelectedChart] = useState<ChartId>(
    () => initialUrlState.selectedChart,
  );
  const [chartSubtype, setChartSubtype] = useState<ChartSubtype>(
    () => initialUrlState.chartSubtype,
  );
  const [width, setWidth] = useState(() => initialUrlState.width);
  const [height, setHeight] = useState(() => initialUrlState.height);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>(
    () => initialUrlState.sidebarTab,
  );
  const [chartFilter, setChartFilter] = useState(
    () => initialUrlState.chartFilter,
  );
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileInspectorOpen, setMobileInspectorOpen] = useState(false);
  const [rerollKey, setRerollKey] = useState(0);
  const [useDrawerLayout, setUseDrawerLayout] = useState(() => {
    if (typeof window === "undefined") return false;
    const hoverMedia = window.matchMedia("(hover: none)");
    const widthMedia = window.matchMedia("(max-width: 1023px)");
    return hoverMedia.matches || widthMedia.matches;
  });
  const seriesPresetDisabled =
    dataPreset === "distribution" || dataPreset === "compare";
  const seriesPresetTooltip = seriesPresetDisabled
    ? `Series preset is ignored for the "${dataPreset}" data preset.`
    : "Series preset";
  const closeMobilePanels = useCallback(() => {
    setMobileSidebarOpen(false);
    setMobileInspectorOpen(false);
  }, []);
  const toggleMobileSidebar = useCallback(() => {
    setMobileInspectorOpen(false);
    setMobileSidebarOpen((prev) => !prev);
  }, []);
  const toggleMobileInspector = useCallback(() => {
    setMobileSidebarOpen(false);
    setMobileInspectorOpen((prev) => !prev);
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hoverMedia = window.matchMedia("(hover: none)");
    const widthMedia = window.matchMedia("(max-width: 1023px)");
    const update = () =>
      setUseDrawerLayout(hoverMedia.matches || widthMedia.matches);
    update();
    hoverMedia.addEventListener("change", update);
    widthMedia.addEventListener("change", update);
    return () => {
      hoverMedia.removeEventListener("change", update);
      widthMedia.removeEventListener("change", update);
    };
  }, []);
  const randomizeSeed = useCallback(() => {
    setSeed(`mv-${Math.floor(Math.random() * 10_000)}`);
  }, []);
  const handlePaletteModeChange = useCallback(
    (next: PaletteMode) => {
      setPaletteMode(next);
      randomizeSeed();
    },
    [randomizeSeed],
  );

  useEffect(() => {
    if (!urlState) return;

    setWrapper((prev) => (prev === urlState.wrapper ? prev : urlState.wrapper));
    setRenderer((prev) =>
      prev === urlState.renderer ? prev : urlState.renderer,
    );
    setApplyNoiseOverlay((prev) =>
      prev === urlState.applyNoiseOverlay ? prev : urlState.applyNoiseOverlay,
    );
    setShowHoverTooltip((prev) =>
      prev === urlState.showHoverTooltip ? prev : urlState.showHoverTooltip,
    );
    setFallbackSvgWhenCanvasUnsupported((prev) =>
      prev === urlState.fallbackSvgWhenCanvasUnsupported
        ? prev
        : urlState.fallbackSvgWhenCanvasUnsupported,
    );
    setHtmlFilter((prev) =>
      prev === urlState.htmlFilter ? prev : urlState.htmlFilter,
    );
    setShowHtmlSvgOverlay((prev) =>
      prev === urlState.showHtmlSvgOverlay ? prev : urlState.showHtmlSvgOverlay,
    );
    setComputeMode((prev) =>
      prev === urlState.computeMode ? prev : urlState.computeMode,
    );
    setDataPreset((prev) =>
      prev === urlState.dataPreset ? prev : urlState.dataPreset,
    );
    setSeriesPreset((prev) =>
      prev === urlState.seriesPreset ? prev : urlState.seriesPreset,
    );
    setPaletteMode((prev) =>
      prev === urlState.paletteMode ? prev : urlState.paletteMode,
    );
    setSeed((prev) => (prev === urlState.seed ? prev : urlState.seed));
    setSeriesLength((prev) =>
      prev === urlState.seriesLength ? prev : urlState.seriesLength,
    );
    setSegmentCount((prev) =>
      prev === urlState.segmentCount ? prev : urlState.segmentCount,
    );
    setSelectedChart((prev) =>
      prev === urlState.selectedChart ? prev : urlState.selectedChart,
    );
    setChartSubtype((prev) =>
      prev === urlState.chartSubtype ? prev : urlState.chartSubtype,
    );
    setWidth((prev) => (prev === urlState.width ? prev : urlState.width));
    setHeight((prev) => (prev === urlState.height ? prev : urlState.height));
    setSidebarTab((prev) =>
      prev === urlState.sidebarTab ? prev : urlState.sidebarTab,
    );
    setChartFilter((prev) =>
      prev === urlState.chartFilter ? prev : urlState.chartFilter,
    );
  }, [urlState]);

  useEffect(() => {
    if (!onUrlStateChange) return;
    onUrlStateChange({
      applyNoiseOverlay,
      chartFilter,
      chartSubtype,
      computeMode,
      dataPreset,
      fallbackSvgWhenCanvasUnsupported,
      height,
      htmlFilter,
      paletteMode,
      renderer,
      seed,
      segmentCount,
      selectedChart,
      seriesLength,
      seriesPreset,
      showHoverTooltip,
      showHtmlSvgOverlay,
      sidebarTab,
      width,
      wrapper,
    });
  }, [
    applyNoiseOverlay,
    chartFilter,
    chartSubtype,
    computeMode,
    dataPreset,
    paletteMode,
    fallbackSvgWhenCanvasUnsupported,
    height,
    htmlFilter,
    showHtmlSvgOverlay,
    onUrlStateChange,
    renderer,
    seed,
    segmentCount,
    seriesLength,
    seriesPreset,
    selectedChart,
    showHoverTooltip,
    sidebarTab,
    width,
    wrapper,
  ]);

  useEffect(() => {
    if (!mobileSidebarOpen && !mobileInspectorOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMobilePanels();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeMobilePanels, mobileInspectorOpen, mobileSidebarOpen]);
  useEffect(() => {
    if (useDrawerLayout) return;
    setMobileSidebarOpen(false);
    setMobileInspectorOpen(false);
  }, [useDrawerLayout]);

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

  const compareRange = useMemo(
    () =>
      buildCompareRange(
        `${seed}:compare`,
        dataPreset === "compare"
          ? { spans: [32, 45, 60, 80, 92, 100] }
          : undefined,
      ),
    [dataPreset, seed],
  );
  const series = useMemo(
    () =>
      buildSeriesForPreset(
        `${seed}:series`,
        seriesLength,
        seriesPreset,
        dataPreset,
        {
          compareRange,
        },
      ),
    [compareRange, dataPreset, seed, seriesLength, seriesPreset],
  );
  const opacities = useMemo(() => buildOpacities(series), [series]);
  const segments = useMemo(
    () => buildSegmentsForPreset(`${seed}:segments`, segmentCount, dataPreset),
    [dataPreset, seed, segmentCount],
  );
  const bandSeed = useMemo(
    () => createSeededRng(`${seed}:band`).int(0, 10_000),
    [seed],
  );

  const inputs: Record<ChartId, ComputeModelInput> = useMemo(() => {
    const palette = segments.map((segment) => segment.color);
    const waveformColors = buildPaletteColors({
      count: 24,
      mode: paletteMode,
      palette,
      seed: `${seed}:waveform`,
      segments,
      series,
    });
    const equalizerColors = buildPaletteColors({
      count: 24,
      mode: paletteMode,
      palette,
      seed: `${seed}:equalizer`,
      segments,
      series,
    });
    const codeMinimapColors = buildPaletteColors({
      count: 8,
      mode: paletteMode,
      palette,
      seed: `${seed}:code-minimap`,
      segments,
      series,
    });

    return {
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
          current: compareRange.current,
          max: compareRange.max,
          previous: compareRange.reference,
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
        data: series,
        size: sizeFor("code-minimap"),
        spec: {
          colors: codeMinimapColors,
          lines: 8,
          pad: 0,
          type: "code-minimap",
        },
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
          current: compareRange.current,
          max: compareRange.max,
          target: compareRange.reference,
        },
        size,
        spec: { type: "dumbbell" },
      },
      equalizer: {
        data: series,
        size,
        spec: {
          barWidth: 6,
          bins: 24,
          colors: equalizerColors,
          gap: 1,
          pad: 0,
          type: "equalizer",
        },
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
        size,
        spec: {
          cardHeightPct: 100,
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
        size,
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
      "segmented-pill": {
        data: segments,
        size,
        spec: { pad: 0, type: "segmented-pill" },
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
        data: series,
        size,
        spec: {
          barWidth: 6,
          bins: 24,
          colors: waveformColors,
          gap: 1,
          pad: 0,
          type: "waveform",
        },
      },
    };
  }, [
    bandSeed,
    compareRange,
    opacities,
    paletteMode,
    segments,
    seed,
    series,
    size,
    sizeFor,
  ]);

  const chartIds = useMemo(() => Object.keys(inputs) as ChartId[], [inputs]);
  const chartCatalog = useMemo(() => buildChartCatalog(chartIds), [chartIds]);

  const htmlFilterActive =
    htmlFilter !== "all" && (renderer === "html" || renderer === "html-svg");
  const htmlSafeCacheRef = useRef(new Map<string, Set<ChartId>>());
  const htmlSafeCacheKey = useMemo(() => {
    if (!htmlFilterActive) return null;
    return [
      applyNoiseOverlay ? "noise:1" : "noise:0",
      `data:${dataPreset}`,
      `palette:${paletteMode}`,
      `seed:${seed}`,
      `series:${seriesLength}`,
      `segments:${segmentCount}`,
      `preset:${seriesPreset}`,
      `size:${width}x${height}`,
      `charts:${chartIds.join(",")}`,
    ].join("|");
  }, [
    applyNoiseOverlay,
    chartIds,
    dataPreset,
    height,
    htmlFilterActive,
    paletteMode,
    seed,
    segmentCount,
    seriesLength,
    seriesPreset,
    width,
  ]);
  const htmlSafeChartIdSet = useMemo(() => {
    if (!htmlFilterActive) return null;
    if (htmlSafeCacheKey) {
      const cached = htmlSafeCacheRef.current.get(htmlSafeCacheKey);
      if (cached) return cached;
    }

    const safeCharts = new Set<ChartId>();
    for (const chartId of chartIds) {
      let model = computeModel(inputs[chartId]);
      if (applyNoiseOverlay) {
        model = applyNoiseDisplacementOverlay(model);
      }
      const hasHtmlUnsupported =
        getHtmlUnsupportedMarkTypes(model).length > 0 ||
        getHtmlUnsupportedDefTypes(model).length > 0 ||
        getHtmlUnsupportedMarkEffects(model).length > 0;
      if (!hasHtmlUnsupported) {
        safeCharts.add(chartId);
      }
    }

    if (htmlSafeCacheKey) {
      htmlSafeCacheRef.current.set(htmlSafeCacheKey, safeCharts);
    }
    return safeCharts;
  }, [applyNoiseOverlay, chartIds, htmlSafeCacheKey, htmlFilterActive, inputs]);

  const htmlFilteredCatalog = useMemo(() => {
    if (!htmlFilterActive || !htmlSafeChartIdSet) return chartCatalog;
    if (htmlFilter === "safe")
      return chartCatalog.filter((chart) =>
        htmlSafeChartIdSet.has(chart.chartId),
      );
    if (htmlFilter === "broken")
      return chartCatalog.filter(
        (chart) => !htmlSafeChartIdSet.has(chart.chartId),
      );
    return chartCatalog;
  }, [chartCatalog, htmlFilter, htmlFilterActive, htmlSafeChartIdSet]);

  const visibleCharts = useMemo(() => {
    if (chartSubtype === "all") return htmlFilteredCatalog;
    return htmlFilteredCatalog.filter(
      (chart) => chart.subtype === chartSubtype,
    );
  }, [chartSubtype, htmlFilteredCatalog]);

  const filteredCharts = useMemo(() => {
    const q = chartFilter.toLowerCase().trim();
    if (!q) return visibleCharts;
    return visibleCharts.filter((c) => c.title.toLowerCase().includes(q));
  }, [visibleCharts, chartFilter]);

  // Group charts by aspect ratio for sectioned display
  const chartsByAspectRatio = useMemo(() => {
    const primitive: ChartCatalogEntry[] = [];
    const square: ChartCatalogEntry[] = [];
    const tall: ChartCatalogEntry[] = [];
    const wide: ChartCatalogEntry[] = [];

    for (const chart of visibleCharts) {
      if (PRIMITIVE_CHART_IDS.has(chart.chartId)) {
        primitive.push(chart);
      } else {
        const aspectRatio = getPreferredAspectRatio(chart.chartId);
        if (aspectRatio === "square") {
          square.push(chart);
        } else if (aspectRatio === "tall") {
          tall.push(chart);
        } else {
          wide.push(chart);
        }
      }
    }

    return { primitive, square, tall, wide };
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

  const chartListRef = useRef<HTMLDivElement | null>(null);
  const [chartListWidthPx, setChartListWidthPx] = useState(0);

  useEffect(() => {
    const el = chartListRef.current;
    if (!el) return;

    setChartListWidthPx(el.getBoundingClientRect().width);

    const ro = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (typeof width === "number") setChartListWidthPx(width);
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const gridGapPx = 12; // Tailwind `gap-3`
  const chartListGutterPx = 16; // Tailwind `px-4` on the scroll content wrapper
  const chartListContentWidthPx = Math.max(
    0,
    chartListWidthPx - chartListGutterPx * 2,
  );

  const wideCols = useMemo(() => {
    const minCardWidth = 224; // 20% narrower
    if (chartListContentWidthPx <= 0) return 1;
    return Math.max(
      1,
      Math.floor(
        (chartListContentWidthPx + gridGapPx) / (minCardWidth + gridGapPx),
      ),
    );
  }, [chartListContentWidthPx]);

  const squareCols = useMemo(() => {
    const minCardWidth = 120;
    if (chartListContentWidthPx <= 0) return 1;
    return Math.max(
      1,
      Math.floor(
        (chartListContentWidthPx + gridGapPx) / (minCardWidth + gridGapPx),
      ),
    );
  }, [chartListContentWidthPx]);

  const primitiveCols = useMemo(() => {
    const minCardWidth = 210; // 25% smaller than wide
    if (chartListContentWidthPx <= 0) return 1;
    return Math.max(
      1,
      Math.floor(
        (chartListContentWidthPx + gridGapPx) / (minCardWidth + gridGapPx),
      ),
    );
  }, [chartListContentWidthPx]);

  const chartBlocks = useMemo<ChartBlock[]>(() => {
    const blocks: ChartBlock[] = [];

    if (chartsByAspectRatio.wide.length > 0) {
      blocks.push({ kind: "sectionHeader", label: "Wide" });
      for (let i = 0; i < chartsByAspectRatio.wide.length; i += wideCols) {
        const charts = chartsByAspectRatio.wide.slice(i, i + wideCols);
        blocks.push({
          charts,
          isLast: i + wideCols >= chartsByAspectRatio.wide.length,
          kind: "wideRow",
        });
      }
    }

    if (chartsByAspectRatio.primitive.length > 0) {
      blocks.push({ kind: "sectionHeader", label: "Primitives" });
      for (
        let i = 0;
        i < chartsByAspectRatio.primitive.length;
        i += primitiveCols
      ) {
        const charts = chartsByAspectRatio.primitive.slice(
          i,
          i + primitiveCols,
        );
        blocks.push({
          charts,
          isLast: i + primitiveCols >= chartsByAspectRatio.primitive.length,
          kind: "primitiveRow",
        });
      }
    }

    if (chartsByAspectRatio.square.length > 0) {
      blocks.push({ kind: "sectionHeader", label: "Square" });
      for (let i = 0; i < chartsByAspectRatio.square.length; i += squareCols) {
        const charts = chartsByAspectRatio.square.slice(i, i + squareCols);
        blocks.push({
          charts,
          isLast: i + squareCols >= chartsByAspectRatio.square.length,
          kind: "squareRow",
        });
      }
    }

    if (chartsByAspectRatio.tall.length > 0) {
      blocks.push({ kind: "sectionHeader", label: "Tall" });
      blocks.push({ charts: chartsByAspectRatio.tall, kind: "tallBlock" });
    }

    return blocks;
  }, [chartsByAspectRatio, primitiveCols, squareCols, wideCols]);

  const chartBlocksVirtualizer = useVirtualizer({
    count: chartBlocks.length,
    estimateSize: (index) => {
      const block = chartBlocks[index];
      if (!block) return 220;

      if (block.kind === "sectionHeader") return 22;
      if (block.kind === "primitiveRow") return 190; // Slightly smaller than wide
      if (block.kind === "squareRow") return 170;
      if (block.kind === "tallBlock") return 160;
      return 220; // wide rows tend to be the tallest
    },
    getScrollElement: () => chartListRef.current,
    overscan: 8,
  });

  const virtualBlocks = chartBlocksVirtualizer.getVirtualItems();
  const requestedChartIdSet = new Set<ChartId>([selectedChart]);
  for (const row of virtualBlocks) {
    const block = chartBlocks[row.index];
    if (!block) continue;
    if (block.kind === "sectionHeader") continue;

    for (const chart of block.charts) {
      requestedChartIdSet.add(chart.chartId);
    }
  }

  const requestedChartIds = chartIds.filter((id) =>
    requestedChartIdSet.has(id),
  );

  const { models, timingsMs } = useModels(
    inputs,
    computeModeEffective,
    ensureWorkerClient,
    requestedChartIds,
  );

  const noiseOverlayCacheRef = useRef(new WeakMap<RenderModel, RenderModel>());
  const canvasUnsupportedFiltersCacheRef = useRef(
    new WeakMap<RenderModel, readonly string[]>(),
  );
  const htmlWarningsCacheRef = useRef(
    new WeakMap<RenderModel, WarningLike[]>(),
  );

  const getEffectiveModel = useCallback(
    (chartId: ChartId): RenderModel | null => {
      const model = models[chartId] ?? null;
      if (!model) return null;
      if (!applyNoiseOverlay) return model;

      const cached = noiseOverlayCacheRef.current.get(model);
      if (cached) return cached;
      const nextModel = applyNoiseDisplacementOverlay(model);
      noiseOverlayCacheRef.current.set(model, nextModel);
      return nextModel;
    },
    [applyNoiseOverlay, models],
  );

  const getCanvasUnsupportedFilters = useCallback(
    (model: RenderModel): readonly string[] => {
      const cached = canvasUnsupportedFiltersCacheRef.current.get(model);
      if (cached) return cached;
      const unsupported = getCanvasUnsupportedFilterPrimitiveTypes(model);
      canvasUnsupportedFiltersCacheRef.current.set(model, unsupported);
      return unsupported;
    },
    [],
  );

  const getHtmlWarnings = useCallback((model: RenderModel): WarningLike[] => {
    const cached = htmlWarningsCacheRef.current.get(model);
    if (cached) return cached;

    const warnings: WarningLike[] = [];
    const unsupportedMarkTypes = getHtmlUnsupportedMarkTypes(model);
    if (unsupportedMarkTypes.length > 0) {
      warnings.push({
        code: "HTML_UNSUPPORTED_MARK",
        message: `HTML renderer ignores marks: ${unsupportedMarkTypes.join(", ")}.`,
      });
    }

    const unsupportedDefs = getHtmlUnsupportedDefTypes(model);
    if (unsupportedDefs.length > 0) {
      warnings.push({
        code: "HTML_UNSUPPORTED_DEF",
        message: `HTML renderer ignores defs: ${unsupportedDefs.join(", ")}.`,
      });
    }

    const unsupportedEffects = getHtmlUnsupportedMarkEffects(model);
    if (unsupportedEffects.length > 0) {
      warnings.push({
        code: "HTML_UNSUPPORTED_EFFECT",
        message: `HTML renderer ignores mark effects: ${unsupportedEffects.join(", ")}.`,
      });
    }

    htmlWarningsCacheRef.current.set(model, warnings);
    return warnings;
  }, []);

  const fillStyle = "#2563eb";
  const strokeStyle = "#2563eb";
  const strokeWidth = 2.2;
  const canvasOptions: RenderCanvasOptions = useMemo(
    () => ({ fillStyle, strokeStyle, strokeWidth }),
    [],
  );

  const inspectorTabOptions = [
    "diagnostics",
    "model",
    "data",
    "a11y",
    "export",
  ] as const;
  type InspectorTab = (typeof inspectorTabOptions)[number];
  const inspectorTabLabels: Record<InspectorTab, string> = {
    a11y: "A11y",
    data: "Data",
    diagnostics: "Diagnostics",
    export: "Export",
    model: "Model",
  };
  const inspectorTabTitles: Record<InspectorTab, string> = {
    a11y: "Accessibility",
    data: "Inputs",
    diagnostics: "Warnings",
    export: "Export assets",
    model: "Render model",
  };
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("model");
  const [a11yCopied, setA11yCopied] = useState(false);
  const a11yCopyTimeoutRef = useRef<number | null>(null);
  const [diagnosticsCopied, setDiagnosticsCopied] = useState(false);
  const diagnosticsCopyTimeoutRef = useRef<number | null>(null);
  const [exportingPng, setExportingPng] = useState(false);
  const [copyingPng, setCopyingPng] = useState(false);
  const selectedModel = getEffectiveModel(selectedChart);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const exportNoticeTimeoutRef = useRef<number | null>(null);

  const flashExportNotice = useCallback((message: string) => {
    setExportNotice(message);
    if (exportNoticeTimeoutRef.current !== null) {
      window.clearTimeout(exportNoticeTimeoutRef.current);
    }
    exportNoticeTimeoutRef.current = window.setTimeout(() => {
      setExportNotice(null);
    }, 1400);
  }, []);

  const downloadBlob = useCallback((blob: Blob, filename: string) => {
    if (typeof document === "undefined") return;
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }, []);

  const handleDownloadSvg = useCallback(() => {
    if (!selectedModel) return;
    const svg = renderSvgString(selectedModel);
    downloadBlob(svgStringToBlob(svg), `microviz-${selectedChart}.svg`);
    flashExportNotice("SVG downloaded");
  }, [downloadBlob, flashExportNotice, selectedChart, selectedModel]);

  const handleCopySvg = useCallback(() => {
    if (!selectedModel) return;
    const payload = renderSvgString(selectedModel);
    const finish = () => flashExportNotice("SVG copied");

    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(payload).then(finish).catch(finish);
      return;
    }

    if (typeof document === "undefined") return;
    const textarea = document.createElement("textarea");
    textarea.value = payload;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    textarea.style.pointerEvents = "none";
    document.body.append(textarea);
    textarea.focus();
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
    finish();
  }, [flashExportNotice, selectedModel]);

  const handleDownloadPng = useCallback(async () => {
    if (!selectedModel || exportingPng) return;
    setExportingPng(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = selectedModel.width;
      canvas.height = selectedModel.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      renderCanvas(ctx, selectedModel, canvasOptions);
      const blob = await canvasToBlob(canvas, { type: "image/png" });
      downloadBlob(blob, `microviz-${selectedChart}.png`);
      flashExportNotice("PNG downloaded");
    } catch {
      flashExportNotice("PNG export failed");
    } finally {
      setExportingPng(false);
    }
  }, [
    canvasOptions,
    downloadBlob,
    exportingPng,
    flashExportNotice,
    selectedChart,
    selectedModel,
  ]);

  const handleCopyPngDataUrl = useCallback(async () => {
    if (!selectedModel || copyingPng) return;
    setCopyingPng(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = selectedModel.width;
      canvas.height = selectedModel.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      renderCanvas(ctx, selectedModel, canvasOptions);
      const blob = await canvasToBlob(canvas, { type: "image/png" });
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === "string") resolve(reader.result);
          else reject(new Error("PNG data URL unavailable."));
        };
        reader.onerror = () =>
          reject(reader.error ?? new Error("PNG data URL failed."));
        reader.readAsDataURL(blob);
      });

      const finish = () => flashExportNotice("PNG copied");
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(dataUrl);
        finish();
        return;
      }

      if (typeof document === "undefined") return;
      const textarea = document.createElement("textarea");
      textarea.value = dataUrl;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      textarea.style.pointerEvents = "none";
      document.body.append(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
      finish();
    } catch {
      flashExportNotice("PNG copy failed");
    } finally {
      setCopyingPng(false);
    }
  }, [canvasOptions, copyingPng, flashExportNotice, selectedModel]);

  function renderSurface(chartId: ChartId): ReactNode {
    const model = getEffectiveModel(chartId);
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
        ? getCanvasUnsupportedFilters(model)
        : [];
    const shouldFallbackToSvg =
      fallbackSvgWhenCanvasUnsupported &&
      canvasUnsupportedFilters.length > 0 &&
      (renderer === "canvas" || renderer === "offscreen-canvas");

    if (renderer === "svg-string") {
      if (wrapper === "react")
        return (
          <MicrovizReactSvgString
            className="inline-block rounded bg-[var(--mv-bg)]"
            model={model}
          />
        );
      const svg = renderSvgString(model);
      return <SvgStringPreview svg={svg} />;
    }

    if (shouldFallbackToSvg) {
      if (wrapper === "react")
        return (
          <MicrovizReactSvgString
            className="inline-block rounded bg-[var(--mv-bg)]"
            model={model}
          />
        );
      const svg = renderSvgString(model);
      return <SvgStringPreview svg={svg} />;
    }

    if (renderer === "html-svg") {
      const { htmlModel, svgModel } = splitHtmlSvgModel(model);
      const html = renderHtmlString(htmlModel);
      if (!showHtmlSvgOverlay || !svgModel) {
        return <HtmlPreview html={html} />;
      }
      const svg = renderSvgString(svgModel);
      return <HtmlSvgOverlayPreview html={html} svg={svg} />;
    }

    if (renderer === "html") {
      const html = renderHtmlString(model);
      return <HtmlPreview html={html} />;
    }

    if (renderer === "svg-dom") {
      if (wrapper === "react")
        return (
          <div className="inline-block rounded bg-[var(--mv-bg)]">
            <MicrovizReactSvg className="block" model={model} />
          </div>
        );
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

  const selectedWarnings = getDiagnosticsWarnings(
    selectedModel,
    renderer,
    getCanvasUnsupportedFilters,
    getHtmlWarnings,
  );
  const warningCount = selectedWarnings.length;
  const a11ySummary = selectedModel?.a11y?.summary;
  const a11yItems = selectedModel?.a11y?.items ?? [];
  const a11yExpectedCount =
    a11ySummary?.kind === "series" || a11ySummary?.kind === "segments"
      ? a11ySummary.count
      : null;
  const a11yMissingItems =
    a11yExpectedCount !== null &&
    a11yExpectedCount > 0 &&
    a11yItems.length === 0;
  const a11yTruncatedItems =
    a11yExpectedCount !== null &&
    a11yItems.length > 0 &&
    a11yItems.length < a11yExpectedCount;
  const selectedWarningSummary = useMemo(
    () => summarizeWarningCounts(selectedWarnings),
    [selectedWarnings],
  );
  const htmlSvgMarkCounts = useMemo(() => {
    if (renderer !== "html-svg" || !selectedModel) return null;
    const { htmlModel, svgModel } = splitHtmlSvgModel(selectedModel);
    return {
      html: htmlModel.marks.length,
      svg: svgModel?.marks.length ?? 0,
    };
  }, [renderer, selectedModel]);

  const selectedInput = inputs[selectedChart];

  useEffect(() => {
    return () => {
      if (a11yCopyTimeoutRef.current !== null) {
        window.clearTimeout(a11yCopyTimeoutRef.current);
      }
      if (diagnosticsCopyTimeoutRef.current !== null) {
        window.clearTimeout(diagnosticsCopyTimeoutRef.current);
      }
      if (exportNoticeTimeoutRef.current !== null) {
        window.clearTimeout(exportNoticeTimeoutRef.current);
      }
    };
  }, []);

  const allWarnings = useMemo(() => {
    if (inspectorTab !== "diagnostics")
      return [] as Array<{ chartId: ChartId; warnings: WarningLike[] }>;

    const rows: Array<{ chartId: ChartId; warnings: WarningLike[] }> = [];
    for (const chartId of chartIds) {
      const model = getEffectiveModel(chartId);
      const warnings = getDiagnosticsWarnings(
        model,
        renderer,
        getCanvasUnsupportedFilters,
        getHtmlWarnings,
      );
      if (warnings.length > 0) rows.push({ chartId, warnings });
    }
    return rows;
  }, [
    chartIds,
    getCanvasUnsupportedFilters,
    getEffectiveModel,
    getHtmlWarnings,
    inspectorTab,
    renderer,
  ]);
  const allWarningSummary = useMemo(
    () =>
      summarizeWarningCounts(allWarnings.flatMap((row) => row.warnings ?? [])),
    [allWarnings],
  );

  const handleCopyA11y = useCallback(() => {
    if (!selectedModel?.a11y) return;
    const payload = JSON.stringify(selectedModel.a11y, null, 2);
    const finish = () => {
      setA11yCopied(true);
      if (a11yCopyTimeoutRef.current !== null) {
        window.clearTimeout(a11yCopyTimeoutRef.current);
      }
      a11yCopyTimeoutRef.current = window.setTimeout(() => {
        setA11yCopied(false);
      }, 1200);
    };

    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(payload).then(finish).catch(finish);
      return;
    }

    if (typeof document === "undefined") return;
    const textarea = document.createElement("textarea");
    textarea.value = payload;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    textarea.style.pointerEvents = "none";
    document.body.append(textarea);
    textarea.focus();
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
    finish();
  }, [selectedModel?.a11y]);

  const handleCopyDiagnostics = useCallback(() => {
    const payload = JSON.stringify(
      {
        all: {
          charts: allWarnings,
          summary: allWarningSummary,
        },
        selected: {
          chartId: selectedChart,
          summary: selectedWarningSummary,
          warnings: selectedWarnings,
        },
      },
      null,
      2,
    );

    const finish = () => {
      setDiagnosticsCopied(true);
      if (diagnosticsCopyTimeoutRef.current !== null) {
        window.clearTimeout(diagnosticsCopyTimeoutRef.current);
      }
      diagnosticsCopyTimeoutRef.current = window.setTimeout(() => {
        setDiagnosticsCopied(false);
      }, 1200);
    };

    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(payload).then(finish).catch(finish);
      return;
    }

    if (typeof document === "undefined") return;
    const textarea = document.createElement("textarea");
    textarea.value = payload;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    textarea.style.pointerEvents = "none";
    document.body.append(textarea);
    textarea.focus();
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
    finish();
  }, [
    allWarningSummary,
    allWarnings,
    selectedChart,
    selectedWarningSummary,
    selectedWarnings,
  ]);
  const mobileDrawerOpen =
    useDrawerLayout && (mobileSidebarOpen || mobileInspectorOpen);

  return (
    <div className="relative flex h-full min-h-0 w-full">
      {mobileDrawerOpen && (
        <button
          aria-label="Close panels"
          className="fixed inset-0 z-30 bg-slate-950/50 backdrop-blur-[1px]"
          onClick={closeMobilePanels}
          type="button"
        />
      )}
      <ResizablePane
        className={`h-full border-r border-slate-200 bg-white/90 dark:border-slate-800 dark:bg-slate-950/70 ${useDrawerLayout ? `fixed inset-y-0 left-0 z-40 shadow-xl transition-transform duration-200 ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}` : "static shadow-none"}`}
        contentClassName="h-full w-full overflow-hidden"
        defaultSize={260}
        name="sidebar"
        side="left"
      >
        <div className="flex h-full flex-col">
          <div className="flex flex-col gap-2 border-b border-slate-200/70 bg-white/80 px-3 py-2 backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/70">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Controls
              </div>
              {useDrawerLayout && (
                <button
                  aria-label="Close controls"
                  className={tabButton({
                    active: false,
                    size: "xs",
                    variant: "muted",
                  })}
                  onClick={() => setMobileSidebarOpen(false)}
                  type="button"
                >
                  Close
                </button>
              )}
            </div>
            <div className="max-w-full overflow-x-auto [scrollbar-gutter:stable]">
              <TabToggle
                label="Sidebar navigation"
                onChange={setSidebarTab}
                options={[
                  { id: "browse", label: "Browse", title: "Charts" },
                  { id: "settings", label: "Settings" },
                  { id: "debug", label: "Debug" },
                ]}
                size="xs"
                value={sidebarTab}
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden px-3 py-3">
            {/* Browse tab */}
            {sidebarTab === "browse" && (
              <div className="flex min-h-0 flex-1 flex-col gap-2">
                <input
                  className={inputField({
                    className:
                      "placeholder:text-slate-400 dark:placeholder:text-slate-500",
                    size: "md",
                  })}
                  onChange={(e) => setChartFilter(e.target.value)}
                  placeholder="Filter charts..."
                  title="Filter charts"
                  type="text"
                  value={chartFilter}
                />
                <div className="min-h-0 flex-1 overflow-auto pr-1">
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
              <div className="h-full overflow-auto pr-1">
                <div className="space-y-2">
                  <label className="block text-sm" title={seriesPresetTooltip}>
                    <div className="mb-1 text-xs text-slate-500 dark:text-slate-400">
                      Data preset
                    </div>
                    <select
                      className={inputField()}
                      onChange={(e) =>
                        setDataPreset(e.target.value as DataPreset)
                      }
                      title="Data preset"
                      value={dataPreset}
                    >
                      {dataPresetOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-sm">
                    <div className="mb-1 text-xs text-slate-500 dark:text-slate-400">
                      Series preset
                    </div>
                    <select
                      className={`${inputField()} disabled:cursor-not-allowed disabled:border-slate-200/60 disabled:bg-slate-100/80 disabled:text-slate-400 dark:disabled:border-slate-700/50 dark:disabled:bg-slate-900/60 dark:disabled:text-slate-500`}
                      disabled={seriesPresetDisabled}
                      onChange={(e) =>
                        setSeriesPreset(e.target.value as SeriesPreset)
                      }
                      title={seriesPresetTooltip}
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
                        title="Seed"
                        value={seed}
                      />
                      <button
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:shadow active:scale-[0.98] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                        onClick={() => randomizeSeed()}
                        title="Random seed"
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

                  <ToggleGroup<PaletteMode>
                    columns={3}
                    label="Palette mapping"
                    onChange={handlePaletteModeChange}
                    options={[
                      { id: "value", label: "By value" },
                      { id: "random", label: "Random" },
                      { id: "chunks", label: "Chunks" },
                    ]}
                    value={paletteMode}
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
                      {
                        id: "offscreen-canvas",
                        label: "OffscreenCanvas (worker)",
                      },
                      { id: "html", label: "HTML (experimental)" },
                      { id: "html-svg", label: "HTML + SVG (overlay)" },
                    ]}
                    value={renderer}
                  />

                  <ToggleGroup<HtmlFilter>
                    columns={3}
                    disabled={renderer !== "html" && renderer !== "html-svg"}
                    label="HTML compatibility"
                    onChange={setHtmlFilter}
                    options={[
                      { id: "all", label: "All" },
                      { id: "safe", label: "Safe" },
                      { id: "broken", label: "Broken" },
                    ]}
                    value={htmlFilter}
                  />

                  <label
                    className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200"
                    title="Show SVG overlay when using HTML + SVG renderer"
                  >
                    <input
                      checked={showHtmlSvgOverlay}
                      className="accent-blue-500"
                      disabled={renderer !== "html-svg"}
                      onChange={(e) => setShowHtmlSvgOverlay(e.target.checked)}
                      type="checkbox"
                    />
                    <span className="text-sm">Show SVG overlay</span>
                  </label>

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
              </div>
            )}

            {/* Debug tab */}
            {sidebarTab === "debug" && (
              <div className="h-full overflow-auto pr-1">
                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Render
                  </div>

                  <label
                    className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200"
                    title="Noise overlay (SVG)"
                  >
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

                  <label
                    className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200"
                    title="SVG fallback (Canvas filters)"
                  >
                    <input
                      checked={fallbackSvgWhenCanvasUnsupported}
                      className="accent-blue-500"
                      disabled={
                        wrapper === "elements" ||
                        (renderer !== "canvas" &&
                          renderer !== "offscreen-canvas")
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

                  <label
                    className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200"
                    title="Element hover tooltip"
                  >
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
              </div>
            )}
          </div>
        </div>
      </ResizablePane>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {useDrawerLayout && (
          <div className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 px-2 py-0.5 backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/70">
            <div className="relative h-9">
              <button
                aria-expanded={mobileSidebarOpen}
                aria-label="Controls"
                className={tabButton({
                  active: mobileSidebarOpen,
                  className:
                    "absolute left-0 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center p-0",
                  size: "xs",
                  variant: "muted",
                })}
                onClick={toggleMobileSidebar}
                title="Controls"
                type="button"
              >
                <ControlsIcon className="h-6 w-6" />
                <span className="sr-only">Controls</span>
              </button>
              <div className="flex h-full min-w-0 items-center justify-center gap-2 px-7">
                <label className="flex shrink-0 items-center gap-2 whitespace-nowrap text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <span>Filter</span>
                  <select
                    className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-800 shadow-sm outline-none transition focus:ring-2 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-slate-600"
                    onChange={(event) =>
                      setChartSubtype(event.target.value as ChartSubtype)
                    }
                    title="Filter charts"
                    value={chartSubtype}
                  >
                    {chartSubtypeOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 px-2 py-1 text-xs font-bold text-white shadow-sm transition-all hover:from-indigo-600 hover:to-purple-600 active:scale-95 dark:from-indigo-400 dark:to-purple-400 animate-[bounce-pop_0.3s_ease-out]"
                  key={rerollKey}
                  onClick={() => {
                    randomizeSeed();
                    setRerollKey((k) => k + 1);
                  }}
                  title="Randomize seed"
                  type="button"
                >
                  <span className="inline-block animate-[spin-dice_0.3s_ease-out]">
                    🎲
                  </span>
                </button>
                <div
                  className="min-w-0 max-w-[45vw] truncate text-[10px] text-slate-500 dark:text-slate-400"
                  title={`${wrapper} · ${renderer} · ${computeModeEffective}`}
                >
                  {wrapper} · {renderer}
                  {warningCount > 0 && (
                    <span className="font-semibold text-amber-600 dark:text-amber-300">
                      {" "}
                      · {warningCount} warning{warningCount === 1 ? "" : "s"}
                    </span>
                  )}{" "}
                  · {computeModeEffective}
                </div>
              </div>
              <button
                aria-expanded={mobileInspectorOpen}
                aria-label="Inspector"
                className={tabButton({
                  active: mobileInspectorOpen,
                  className:
                    "absolute right-0 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center p-0",
                  size: "xs",
                  variant: "muted",
                })}
                onClick={toggleMobileInspector}
                title="Inspector"
                type="button"
              >
                <InspectorIcon className="h-6 w-6" />
                <span className="sr-only">Inspector</span>
              </button>
            </div>
          </div>
        )}
        <div className="px-4 py-2">
          <div className="flex items-center gap-3 overflow-x-auto [scrollbar-gutter:stable]">
            {!useDrawerLayout && (
              <div className="flex items-center gap-2 whitespace-nowrap">
                <TabToggle
                  container="bordered"
                  label="Chart subtype filter"
                  onChange={setChartSubtype}
                  options={chartSubtypeOptions.map((o) => ({
                    ...o,
                    title: `Filter: ${o.label}`,
                  }))}
                  size="xs"
                  value={chartSubtype}
                  variant="muted"
                />
                <button
                  className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 px-3 py-1.5 text-sm font-bold text-white shadow-md transition-all hover:from-indigo-600 hover:to-purple-600 hover:shadow-lg active:scale-95 dark:from-indigo-400 dark:to-purple-400 dark:shadow-indigo-500/20 animate-[bounce-pop_0.3s_ease-out]"
                  key={rerollKey}
                  onClick={() => {
                    randomizeSeed();
                    setRerollKey((k) => k + 1);
                  }}
                  title="Randomize seed"
                  type="button"
                >
                  <span className="inline-block animate-[spin-dice_0.3s_ease-out]">
                    🎲
                  </span>
                  Reroll
                </button>
              </div>
            )}
            {!useDrawerLayout && (
              <div className="ml-auto text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                <span
                  title={`Shown: ${visibleCharts.length}/${chartCatalog.length}`}
                >
                  {visibleCharts.length} charts ·{" "}
                </span>
                {wrapper} · {renderer}
                {warningCount > 0 && (
                  <span className="font-semibold text-amber-600 dark:text-amber-300">
                    {" "}
                    · {warningCount} warning{warningCount === 1 ? "" : "s"}
                  </span>
                )}{" "}
                · {computeModeEffective}
              </div>
            )}
          </div>
        </div>

        <div
          className="min-h-0 flex-1 overflow-auto [scrollbar-gutter:stable]"
          ref={chartListRef}
        >
          <div className="px-4 pb-4">
            {chartBlocks.length === 0 ? (
              <div className="text-sm text-slate-500 dark:text-slate-400">
                No charts
              </div>
            ) : (
              <div
                className="relative w-full"
                style={{ height: chartBlocksVirtualizer.getTotalSize() }}
              >
                {virtualBlocks.map((virtualRow) => {
                  const block = chartBlocks[virtualRow.index];
                  if (!block) return null;

                  return (
                    <div
                      className="absolute left-0 top-0 w-full"
                      data-index={virtualRow.index}
                      key={virtualRow.key}
                      ref={chartBlocksVirtualizer.measureElement}
                      style={{ transform: `translateY(${virtualRow.start}px)` }}
                    >
                      {block.kind === "sectionHeader" ? (
                        <div className="pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          {block.label}
                        </div>
                      ) : block.kind === "wideRow" ? (
                        <div className={block.isLast ? "pb-6" : "pb-3"}>
                          <div
                            className="grid gap-3"
                            style={{
                              gridTemplateColumns: `repeat(${wideCols}, minmax(224px, 1fr))`,
                            }}
                          >
                            {block.charts.map((chart) => {
                              const model = getEffectiveModel(chart.chartId);
                              const hasWarnings = hasDiagnosticsWarnings(
                                model,
                                renderer,
                                getCanvasUnsupportedFilters,
                                getHtmlWarnings,
                              );
                              return (
                                <ChartCard
                                  active={selectedChart === chart.chartId}
                                  chartId={chart.chartId}
                                  hasWarnings={hasWarnings}
                                  htmlWarningTags={
                                    renderer === "html" ||
                                    renderer === "html-svg"
                                      ? getHtmlWarningTags(model)
                                      : undefined
                                  }
                                  key={chart.chartId}
                                  model={model}
                                  onSelect={setSelectedChart}
                                  render={renderSurface(chart.chartId)}
                                  showHtmlBrokenBadge={
                                    renderer === "html" && hasWarnings
                                  }
                                  timingMs={timingsMs[chart.chartId]}
                                  title={chart.title}
                                />
                              );
                            })}
                          </div>
                        </div>
                      ) : block.kind === "primitiveRow" ? (
                        <div className={block.isLast ? "pb-6" : "pb-3"}>
                          <div
                            className="grid gap-3"
                            style={{
                              gridTemplateColumns: `repeat(${primitiveCols}, minmax(210px, 1fr))`,
                            }}
                          >
                            {block.charts.map((chart) => {
                              const model = getEffectiveModel(chart.chartId);
                              const hasWarnings = hasDiagnosticsWarnings(
                                model,
                                renderer,
                                getCanvasUnsupportedFilters,
                                getHtmlWarnings,
                              );
                              return (
                                <ChartCard
                                  active={selectedChart === chart.chartId}
                                  chartId={chart.chartId}
                                  hasWarnings={hasWarnings}
                                  htmlWarningTags={
                                    renderer === "html" ||
                                    renderer === "html-svg"
                                      ? getHtmlWarningTags(model)
                                      : undefined
                                  }
                                  key={chart.chartId}
                                  model={model}
                                  onSelect={setSelectedChart}
                                  render={renderSurface(chart.chartId)}
                                  showHtmlBrokenBadge={
                                    renderer === "html" && hasWarnings
                                  }
                                  timingMs={timingsMs[chart.chartId]}
                                  title={chart.title}
                                />
                              );
                            })}
                          </div>
                        </div>
                      ) : block.kind === "squareRow" ? (
                        <div className={block.isLast ? "pb-6" : "pb-3"}>
                          <div
                            className="grid gap-3"
                            style={{
                              gridTemplateColumns: `repeat(${squareCols}, minmax(120px, 1fr))`,
                            }}
                          >
                            {block.charts.map((chart) => {
                              const model = getEffectiveModel(chart.chartId);
                              const hasWarnings = hasDiagnosticsWarnings(
                                model,
                                renderer,
                                getCanvasUnsupportedFilters,
                                getHtmlWarnings,
                              );
                              return (
                                <ChartCard
                                  active={selectedChart === chart.chartId}
                                  centered
                                  chartId={chart.chartId}
                                  hasWarnings={hasWarnings}
                                  htmlWarningTags={
                                    renderer === "html" ||
                                    renderer === "html-svg"
                                      ? getHtmlWarningTags(model)
                                      : undefined
                                  }
                                  key={chart.chartId}
                                  model={model}
                                  onSelect={setSelectedChart}
                                  render={renderSurface(chart.chartId)}
                                  showHtmlBrokenBadge={
                                    renderer === "html" && hasWarnings
                                  }
                                  timingMs={timingsMs[chart.chartId]}
                                  title={chart.title}
                                />
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="pb-6">
                          <div className="flex flex-wrap gap-3">
                            {block.charts.map((chart) => {
                              const model = getEffectiveModel(chart.chartId);
                              const hasWarnings = hasDiagnosticsWarnings(
                                model,
                                renderer,
                                getCanvasUnsupportedFilters,
                                getHtmlWarnings,
                              );
                              return (
                                <ChartCard
                                  active={selectedChart === chart.chartId}
                                  chartId={chart.chartId}
                                  compact
                                  hasWarnings={hasWarnings}
                                  htmlWarningTags={
                                    renderer === "html" ||
                                    renderer === "html-svg"
                                      ? getHtmlWarningTags(model)
                                      : undefined
                                  }
                                  key={chart.chartId}
                                  model={model}
                                  onSelect={setSelectedChart}
                                  render={renderSurface(chart.chartId)}
                                  showHtmlBrokenBadge={
                                    renderer === "html" && hasWarnings
                                  }
                                  timingMs={timingsMs[chart.chartId]}
                                  title={chart.title}
                                />
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <ResizablePane
        className={`h-full border-l border-slate-200 bg-white/90 dark:border-slate-800 dark:bg-slate-950/70 ${useDrawerLayout ? `fixed inset-y-0 right-0 z-40 shadow-xl transition-transform duration-200 ${mobileInspectorOpen ? "translate-x-0" : "translate-x-full"}` : "static shadow-none"}`}
        collapsible
        contentClassName="h-full w-full overflow-hidden"
        defaultSize={340}
        forceExpanded={useDrawerLayout && mobileInspectorOpen}
        name="inspector"
        side="right"
      >
        <div className="flex h-full flex-col">
          <div className="flex flex-col gap-2 border-b border-slate-200/70 bg-white/80 px-4 py-2 backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/70">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Inspector
              </div>
              {useDrawerLayout && (
                <button
                  aria-label="Close inspector"
                  className={tabButton({
                    active: false,
                    size: "xs",
                    variant: "muted",
                  })}
                  onClick={() => setMobileInspectorOpen(false)}
                  type="button"
                >
                  Close
                </button>
              )}
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <div className="min-w-0 flex-1">
                <div className="max-w-full overflow-x-auto [scrollbar-gutter:stable]">
                  <TabToggle
                    container="bordered"
                    label="Inspector tabs"
                    onChange={setInspectorTab}
                    options={inspectorTabOptions.map((tab) => ({
                      id: tab,
                      label: inspectorTabLabels[tab],
                      title: inspectorTabTitles[tab],
                    }))}
                    size="xs"
                    value={inspectorTab}
                    variant="muted"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-auto px-4 py-3">
            <div
              className="mb-2 truncate text-[11px] text-slate-500 dark:text-slate-400"
              title={selectedChart}
            >
              {selectedChart}
            </div>
            {inspectorTab === "diagnostics" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <span>Diagnostics</span>
                  <button
                    className={tabButton({
                      active: false,
                      size: "xs",
                      variant: "muted",
                    })}
                    onClick={handleCopyDiagnostics}
                    type="button"
                  >
                    {diagnosticsCopied ? "Copied" : "Copy"}
                  </button>
                </div>
                {htmlSvgMarkCounts && (
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    HTML marks: {htmlSvgMarkCounts.html} · SVG marks:{" "}
                    {htmlSvgMarkCounts.svg}
                  </div>
                )}

                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Selected warnings
                  </div>
                  {selectedWarningSummary.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                      {selectedWarningSummary.map((summary) => (
                        <span
                          className="rounded bg-slate-100 px-2 py-0.5 dark:bg-slate-800/60"
                          key={summary.code}
                          title={summary.code}
                        >
                          {summary.label} ×{summary.count}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-2">
                    {formatWarningsList(selectedWarnings)}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    All warnings
                  </div>
                  {allWarningSummary.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                      {allWarningSummary.map((summary) => (
                        <span
                          className="rounded bg-slate-100 px-2 py-0.5 dark:bg-slate-800/60"
                          key={summary.code}
                          title={summary.code}
                        >
                          {summary.label} ×{summary.count}
                        </span>
                      ))}
                    </div>
                  )}
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

            {inspectorTab === "a11y" && (
              <div className="rounded border border-slate-200 bg-white/80 p-2 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200">
                <div className="flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <span>A11y</span>
                  <button
                    className={tabButton({
                      active: false,
                      size: "xs",
                      variant: "muted",
                    })}
                    disabled={!selectedModel?.a11y}
                    onClick={handleCopyA11y}
                    type="button"
                  >
                    {a11yCopied ? "Copied" : "Copy"}
                  </button>
                </div>
                <div className="mt-2 space-y-1">
                  <div className="flex flex-wrap gap-x-2 gap-y-1">
                    <span className="text-slate-500 dark:text-slate-400">
                      Label:
                    </span>
                    <span>{selectedModel?.a11y?.label ?? "—"}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-2 gap-y-1">
                    <span className="text-slate-500 dark:text-slate-400">
                      Role:
                    </span>
                    <span>{selectedModel?.a11y?.role ?? "—"}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-2 gap-y-1">
                    <span className="text-slate-500 dark:text-slate-400">
                      Summary:
                    </span>
                    <span>{formatA11ySummary(a11ySummary) ?? "—"}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-2 gap-y-1">
                    <span className="text-slate-500 dark:text-slate-400">
                      Items:
                    </span>
                    <span>
                      {a11yMissingItems
                        ? "0 (missing)"
                        : a11yTruncatedItems
                          ? `${a11yItems.length}/${a11yExpectedCount} (truncated)`
                          : a11yItems.length}
                    </span>
                  </div>
                  {a11yItems.length > 0 && (
                    <ul className="mt-2 space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                      {a11yItems.slice(0, 5).map((item) => (
                        <li key={item.id}>{formatA11yItem(item)}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {inspectorTab === "export" && (
              <div className="rounded border border-slate-200 bg-white/80 p-2 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Export
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    className={tabButton({
                      active: false,
                      size: "xs",
                      variant: "muted",
                    })}
                    disabled={!selectedModel}
                    onClick={handleDownloadSvg}
                    type="button"
                  >
                    Download SVG
                  </button>
                  <button
                    className={tabButton({
                      active: false,
                      size: "xs",
                      variant: "muted",
                    })}
                    disabled={!selectedModel}
                    onClick={handleCopySvg}
                    type="button"
                  >
                    Copy SVG
                  </button>
                  <button
                    className={tabButton({
                      active: false,
                      size: "xs",
                      variant: "muted",
                    })}
                    disabled={!selectedModel || exportingPng}
                    onClick={handleDownloadPng}
                    type="button"
                  >
                    {exportingPng ? "Exporting PNG…" : "Download PNG"}
                  </button>
                  <button
                    className={tabButton({
                      active: false,
                      size: "xs",
                      variant: "muted",
                    })}
                    disabled={!selectedModel || copyingPng}
                    onClick={handleCopyPngDataUrl}
                    title="Copy PNG as data URL"
                    type="button"
                  >
                    {copyingPng ? "Copying PNG…" : "Copy PNG URL"}
                  </button>
                </div>
                {exportNotice && (
                  <div className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400">
                    {exportNotice}
                  </div>
                )}
                <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                  PNG export renders with the Canvas pipeline.
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
      title={`${label}: ${value}`}
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
      title={label}
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
      title={`${label}: ${value}`}
      type="range"
      value={value}
    />
  </div>
);

const HtmlPreview: FC<{ html: string }> = ({ html }) => {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffectSafe(() => {
    const host = hostRef.current;
    if (!host) return;
    if (!html) {
      host.replaceChildren();
      return;
    }

    const wrapper = document.createElement("div");
    wrapper.innerHTML = html;
    const el = wrapper.firstElementChild;
    if (el) host.replaceChildren(el);
  }, [html]);

  return (
    <div className="inline-block rounded bg-[var(--mv-bg)]" ref={hostRef} />
  );
};

const HtmlSvgOverlayPreview: FC<{ html: string; svg: string }> = ({
  html,
  svg,
}) => {
  const htmlRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffectSafe(() => {
    const host = htmlRef.current;
    if (!host) return;
    if (!html) {
      host.replaceChildren();
      return;
    }

    const wrapper = document.createElement("div");
    wrapper.innerHTML = html;
    const el = wrapper.firstElementChild;
    if (el) host.replaceChildren(el);
  }, [html]);

  useLayoutEffectSafe(() => {
    const host = svgRef.current;
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

  return (
    <div className="relative inline-block rounded bg-[var(--mv-bg)]">
      <div ref={htmlRef} />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        ref={svgRef}
      />
    </div>
  );
};

const SvgStringPreview: FC<{ svg: string }> = ({ svg }) => {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffectSafe(() => {
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

  return (
    <div className="inline-block rounded bg-[var(--mv-bg)]" ref={hostRef} />
  );
};

const SvgDomPreview: FC<{ model: RenderModel }> = ({ model }) => {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffectSafe(() => {
    if (!hostRef.current) return;
    hostRef.current.replaceChildren(renderSvgElement(model));
  }, [model]);

  return (
    <div className="inline-block rounded bg-[var(--mv-bg)]" ref={hostRef} />
  );
};

const CanvasPreview: FC<{
  model: RenderModel;
  options: RenderCanvasOptions;
}> = ({ model, options }) => {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useLayoutEffectSafe(() => {
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

  useLayoutEffectSafe(() => {
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
