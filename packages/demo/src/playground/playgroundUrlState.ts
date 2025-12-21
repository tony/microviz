import { type ChartSpec, getAllChartMeta } from "@microviz/core";
import type { SeriesPreset } from "./seed";

export type Wrapper = "elements" | "react" | "vanilla";
export type Renderer = "canvas" | "offscreen-canvas" | "svg-dom" | "svg-string";
export type ComputeMode = "main" | "worker";
export type ChartId = ChartSpec["type"];
export type ChartSubtype = "all" | "bars" | "dots" | "grids" | "lines";
export type SidebarTab = "browse" | "debug" | "settings";
export type PaletteMode = "value" | "random" | "chunks";

export type PlaygroundState = {
  applyNoiseOverlay: boolean;
  chartFilter: string;
  chartSubtype: ChartSubtype;
  computeMode: ComputeMode;
  paletteMode: PaletteMode;
  fallbackSvgWhenCanvasUnsupported: boolean;
  height: number;
  renderer: Renderer;
  seed: string;
  segmentCount: number;
  seriesLength: number;
  seriesPreset: SeriesPreset;
  selectedChart: ChartId;
  showHoverTooltip: boolean;
  sidebarTab: SidebarTab;
  width: number;
  wrapper: Wrapper;
};

export const DEFAULT_PLAYGROUND_STATE: PlaygroundState = {
  applyNoiseOverlay: false,
  chartFilter: "",
  chartSubtype: "all",
  computeMode: "main",
  fallbackSvgWhenCanvasUnsupported: false,
  height: 32,
  paletteMode: "value",
  renderer: "svg-string",
  seed: "mv-1",
  segmentCount: 5,
  selectedChart: "sparkline",
  seriesLength: 16,
  seriesPreset: "trend",
  showHoverTooltip: false,
  sidebarTab: "settings",
  width: 200,
  wrapper: "vanilla",
};

type PlaygroundSerializedState = {
  /** applyNoiseOverlay */
  n?: 1;
  /** chartFilter */
  f?: string;
  /** chartSubtype */
  st?: ChartSubtype;
  /** computeMode */
  cm?: ComputeMode;
  /** paletteMode */
  pm?: PaletteMode;
  /** fallbackSvgWhenCanvasUnsupported */
  fb?: 1;
  /** height */
  h?: number;
  /** renderer */
  r?: Renderer;
  /** seed */
  s?: string;
  /** segmentCount */
  sc?: number;
  /** seriesLength */
  sl?: number;
  /** seriesPreset */
  sp?: SeriesPreset;
  /** selectedChart */
  ch?: ChartId;
  /** showHoverTooltip */
  ht?: 1;
  /** sidebarTab */
  tb?: SidebarTab;
  /** width */
  w?: number;
  /** wrapper */
  wr?: Wrapper;
};

const CHART_IDS = new Set<ChartId>(getAllChartMeta().map((m) => m.type));

function clamp(value: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, value));
}

function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  const binString = Array.from(bytes, (byte) =>
    String.fromCodePoint(byte),
  ).join("");
  return btoa(binString);
}

function base64ToUtf8(base64: string): string {
  const binString = atob(base64);
  const bytes = Uint8Array.from(binString, (char) => char.codePointAt(0) ?? 0);
  return new TextDecoder().decode(bytes);
}

function isWrapper(value: unknown): value is Wrapper {
  return value === "vanilla" || value === "react" || value === "elements";
}

function isRenderer(value: unknown): value is Renderer {
  return (
    value === "svg-string" ||
    value === "svg-dom" ||
    value === "canvas" ||
    value === "offscreen-canvas"
  );
}

function isComputeMode(value: unknown): value is ComputeMode {
  return value === "main" || value === "worker";
}

function isPaletteMode(value: unknown): value is PaletteMode {
  return value === "value" || value === "random" || value === "chunks";
}

function isSeriesPreset(value: unknown): value is SeriesPreset {
  return (
    value === "trend" ||
    value === "seasonal" ||
    value === "spiky" ||
    value === "random-walk"
  );
}

function isChartId(value: unknown): value is ChartId {
  return typeof value === "string" && CHART_IDS.has(value as ChartId);
}

function isChartSubtype(value: unknown): value is ChartSubtype {
  return (
    value === "all" ||
    value === "lines" ||
    value === "bars" ||
    value === "grids" ||
    value === "dots"
  );
}

function isSidebarTab(value: unknown): value is SidebarTab {
  return value === "browse" || value === "settings" || value === "debug";
}

function normalizePlaygroundState(state: PlaygroundState): PlaygroundState {
  const next: PlaygroundState = { ...state };

  if (next.wrapper === "elements") {
    next.renderer = "svg-string";
  }

  if (next.renderer === "offscreen-canvas") {
    next.computeMode = "worker";
  }

  if (next.wrapper !== "elements") {
    next.showHoverTooltip = false;
  }

  return next;
}

function serializePlaygroundState(
  input: PlaygroundState,
): PlaygroundSerializedState {
  const state = normalizePlaygroundState(input);
  const s: PlaygroundSerializedState = {};

  if (state.wrapper !== DEFAULT_PLAYGROUND_STATE.wrapper) s.wr = state.wrapper;
  if (state.renderer !== DEFAULT_PLAYGROUND_STATE.renderer)
    s.r = state.renderer;
  if (state.computeMode !== DEFAULT_PLAYGROUND_STATE.computeMode)
    s.cm = state.computeMode;
  if (state.paletteMode !== DEFAULT_PLAYGROUND_STATE.paletteMode)
    s.pm = state.paletteMode;
  if (state.seriesPreset !== DEFAULT_PLAYGROUND_STATE.seriesPreset)
    s.sp = state.seriesPreset;

  if (state.seed !== DEFAULT_PLAYGROUND_STATE.seed) s.s = state.seed;
  if (state.seriesLength !== DEFAULT_PLAYGROUND_STATE.seriesLength)
    s.sl = state.seriesLength;
  if (state.segmentCount !== DEFAULT_PLAYGROUND_STATE.segmentCount)
    s.sc = state.segmentCount;

  if (state.selectedChart !== DEFAULT_PLAYGROUND_STATE.selectedChart)
    s.ch = state.selectedChart;
  if (state.chartSubtype !== DEFAULT_PLAYGROUND_STATE.chartSubtype)
    s.st = state.chartSubtype;
  if (state.chartFilter !== DEFAULT_PLAYGROUND_STATE.chartFilter)
    s.f = state.chartFilter;

  if (state.width !== DEFAULT_PLAYGROUND_STATE.width) s.w = state.width;
  if (state.height !== DEFAULT_PLAYGROUND_STATE.height) s.h = state.height;
  if (state.sidebarTab !== DEFAULT_PLAYGROUND_STATE.sidebarTab)
    s.tb = state.sidebarTab;

  if (state.applyNoiseOverlay) s.n = 1;
  if (state.fallbackSvgWhenCanvasUnsupported) s.fb = 1;
  if (state.showHoverTooltip) s.ht = 1;

  return s;
}

function deserializePlaygroundState(
  serialized: PlaygroundSerializedState,
): PlaygroundState {
  const seed =
    typeof serialized.s === "string" && serialized.s.trim()
      ? serialized.s.trim()
      : DEFAULT_PLAYGROUND_STATE.seed;

  const chartFilter =
    typeof serialized.f === "string"
      ? serialized.f.slice(0, 80)
      : DEFAULT_PLAYGROUND_STATE.chartFilter;

  return normalizePlaygroundState({
    applyNoiseOverlay: serialized.n === 1,
    chartFilter,
    chartSubtype: isChartSubtype(serialized.st)
      ? serialized.st
      : DEFAULT_PLAYGROUND_STATE.chartSubtype,
    computeMode: isComputeMode(serialized.cm)
      ? serialized.cm
      : DEFAULT_PLAYGROUND_STATE.computeMode,
    fallbackSvgWhenCanvasUnsupported: serialized.fb === 1,
    height:
      typeof serialized.h === "number" && Number.isFinite(serialized.h)
        ? clamp(Math.round(serialized.h), 16, 140)
        : DEFAULT_PLAYGROUND_STATE.height,
    paletteMode: isPaletteMode(serialized.pm)
      ? serialized.pm
      : DEFAULT_PLAYGROUND_STATE.paletteMode,
    renderer: isRenderer(serialized.r)
      ? serialized.r
      : DEFAULT_PLAYGROUND_STATE.renderer,
    seed,
    segmentCount:
      typeof serialized.sc === "number" && Number.isFinite(serialized.sc)
        ? clamp(Math.round(serialized.sc), 1, 8)
        : DEFAULT_PLAYGROUND_STATE.segmentCount,
    selectedChart: isChartId(serialized.ch)
      ? serialized.ch
      : DEFAULT_PLAYGROUND_STATE.selectedChart,
    seriesLength:
      typeof serialized.sl === "number" && Number.isFinite(serialized.sl)
        ? clamp(Math.round(serialized.sl), 3, 80)
        : DEFAULT_PLAYGROUND_STATE.seriesLength,
    seriesPreset: isSeriesPreset(serialized.sp)
      ? serialized.sp
      : DEFAULT_PLAYGROUND_STATE.seriesPreset,
    showHoverTooltip: serialized.ht === 1,
    sidebarTab: isSidebarTab(serialized.tb)
      ? serialized.tb
      : DEFAULT_PLAYGROUND_STATE.sidebarTab,
    width:
      typeof serialized.w === "number" && Number.isFinite(serialized.w)
        ? clamp(Math.round(serialized.w), 80, 520)
        : DEFAULT_PLAYGROUND_STATE.width,
    wrapper: isWrapper(serialized.wr)
      ? serialized.wr
      : DEFAULT_PLAYGROUND_STATE.wrapper,
  });
}

export function encodePlaygroundState(state: PlaygroundState): string {
  const serialized = serializePlaygroundState(state);
  if (Object.keys(serialized).length === 0) return "";
  return utf8ToBase64(JSON.stringify(serialized));
}

export function decodePlaygroundState(encoded: string): PlaygroundState | null {
  if (!encoded) return null;
  try {
    const json = base64ToUtf8(encoded);
    const parsed = JSON.parse(json) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    return deserializePlaygroundState(parsed as PlaygroundSerializedState);
  } catch {
    return null;
  }
}
