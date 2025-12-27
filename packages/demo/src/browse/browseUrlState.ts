import { type ChartSpec, getAllChartMeta } from "@microviz/core";
import type { DataPreset, SeriesPreset } from "./seed";

export type Wrapper = "elements" | "react" | "vanilla";
export type Renderer =
  | "canvas"
  | "offscreen-canvas"
  | "svg-dom"
  | "svg-string"
  | "html"
  | "html-svg";
export type ComputeMode = "main" | "worker";
export type ChartId = ChartSpec["type"];
export type ChartSubtype = "all" | "bars" | "dots" | "grids" | "lines";
export type SidebarTab = "browse" | "debug" | "settings";
export type PaletteMode = "value" | "random" | "chunks";
export type HtmlFilter = "all" | "safe" | "broken";

export type BrowseState = {
  applyNoiseOverlay: boolean;
  chartFilter: string;
  chartSubtype: ChartSubtype;
  computeMode: ComputeMode;
  dataPreset: DataPreset;
  htmlFilter: HtmlFilter;
  paletteMode: PaletteMode;
  fallbackSvgWhenCanvasUnsupported: boolean;
  height: number;
  renderer: Renderer;
  seed: string;
  segmentCount: number;
  seriesLength: number;
  seriesPreset: SeriesPreset;
  selectedChart: ChartId;
  showHtmlSvgOverlay: boolean;
  showHoverTooltip: boolean;
  sidebarTab: SidebarTab;
  width: number;
  wrapper: Wrapper;
};

export const DEFAULT_BROWSE_STATE: BrowseState = {
  applyNoiseOverlay: false,
  chartFilter: "",
  chartSubtype: "all",
  computeMode: "main",
  dataPreset: "balanced",
  fallbackSvgWhenCanvasUnsupported: false,
  height: 32,
  htmlFilter: "all",
  paletteMode: "value",
  renderer: "svg-string",
  seed: "mv-1",
  segmentCount: 5,
  selectedChart: "sparkline",
  seriesLength: 16,
  seriesPreset: "trend",
  showHoverTooltip: false,
  showHtmlSvgOverlay: true,
  sidebarTab: "settings",
  width: 200,
  wrapper: "vanilla",
};

type BrowseSerializedState = {
  /** applyNoiseOverlay */
  n?: 1;
  /** chartFilter */
  f?: string;
  /** chartSubtype */
  st?: ChartSubtype;
  /** computeMode */
  cm?: ComputeMode;
  /** dataPreset */
  dp?: DataPreset;
  /** htmlFilter */
  hf?: HtmlFilter;
  /** paletteMode */
  pm?: PaletteMode;
  /** fallbackSvgWhenCanvasUnsupported */
  fb?: 1;
  /** htmlSafeOnly */
  hs?: 1;
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
  /** showHtmlSvgOverlay (0 = false) */
  ho?: 0 | 1;
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
    value === "offscreen-canvas" ||
    value === "html" ||
    value === "html-svg"
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

function isHtmlFilter(value: unknown): value is HtmlFilter {
  return value === "all" || value === "safe" || value === "broken";
}

function isDataPreset(value: unknown): value is DataPreset {
  return (
    value === "balanced" ||
    value === "time-series" ||
    value === "distribution" ||
    value === "compare" ||
    value === "ranking"
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

function normalizeBrowseState(state: BrowseState): BrowseState {
  const next: BrowseState = { ...state };

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

function serializeBrowseState(input: BrowseState): BrowseSerializedState {
  const state = normalizeBrowseState(input);
  const s: BrowseSerializedState = {};

  if (state.wrapper !== DEFAULT_BROWSE_STATE.wrapper) s.wr = state.wrapper;
  if (state.renderer !== DEFAULT_BROWSE_STATE.renderer) s.r = state.renderer;
  if (state.computeMode !== DEFAULT_BROWSE_STATE.computeMode)
    s.cm = state.computeMode;
  if (state.dataPreset !== DEFAULT_BROWSE_STATE.dataPreset)
    s.dp = state.dataPreset;
  if (state.htmlFilter !== DEFAULT_BROWSE_STATE.htmlFilter)
    s.hf = state.htmlFilter;
  if (state.paletteMode !== DEFAULT_BROWSE_STATE.paletteMode)
    s.pm = state.paletteMode;
  if (state.seriesPreset !== DEFAULT_BROWSE_STATE.seriesPreset)
    s.sp = state.seriesPreset;

  if (state.seed !== DEFAULT_BROWSE_STATE.seed) s.s = state.seed;
  if (state.seriesLength !== DEFAULT_BROWSE_STATE.seriesLength)
    s.sl = state.seriesLength;
  if (state.segmentCount !== DEFAULT_BROWSE_STATE.segmentCount)
    s.sc = state.segmentCount;

  if (state.selectedChart !== DEFAULT_BROWSE_STATE.selectedChart)
    s.ch = state.selectedChart;
  if (state.chartSubtype !== DEFAULT_BROWSE_STATE.chartSubtype)
    s.st = state.chartSubtype;
  if (state.chartFilter !== DEFAULT_BROWSE_STATE.chartFilter)
    s.f = state.chartFilter;

  if (state.width !== DEFAULT_BROWSE_STATE.width) s.w = state.width;
  if (state.height !== DEFAULT_BROWSE_STATE.height) s.h = state.height;
  if (state.sidebarTab !== DEFAULT_BROWSE_STATE.sidebarTab)
    s.tb = state.sidebarTab;

  if (state.applyNoiseOverlay) s.n = 1;
  if (state.fallbackSvgWhenCanvasUnsupported) s.fb = 1;
  if (!state.showHtmlSvgOverlay) s.ho = 0;
  if (state.showHoverTooltip) s.ht = 1;

  return s;
}

function deserializeBrowseState(
  serialized: BrowseSerializedState,
): BrowseState {
  const seed =
    typeof serialized.s === "string" && serialized.s.trim()
      ? serialized.s.trim()
      : DEFAULT_BROWSE_STATE.seed;

  const chartFilter =
    typeof serialized.f === "string"
      ? serialized.f.slice(0, 80)
      : DEFAULT_BROWSE_STATE.chartFilter;

  return normalizeBrowseState({
    applyNoiseOverlay: serialized.n === 1,
    chartFilter,
    chartSubtype: isChartSubtype(serialized.st)
      ? serialized.st
      : DEFAULT_BROWSE_STATE.chartSubtype,
    computeMode: isComputeMode(serialized.cm)
      ? serialized.cm
      : DEFAULT_BROWSE_STATE.computeMode,
    dataPreset: isDataPreset(serialized.dp)
      ? serialized.dp
      : DEFAULT_BROWSE_STATE.dataPreset,
    fallbackSvgWhenCanvasUnsupported: serialized.fb === 1,
    height:
      typeof serialized.h === "number" && Number.isFinite(serialized.h)
        ? clamp(Math.round(serialized.h), 16, 140)
        : DEFAULT_BROWSE_STATE.height,
    htmlFilter: isHtmlFilter(serialized.hf)
      ? serialized.hf
      : serialized.hs === 1
        ? "safe"
        : DEFAULT_BROWSE_STATE.htmlFilter,
    paletteMode: isPaletteMode(serialized.pm)
      ? serialized.pm
      : DEFAULT_BROWSE_STATE.paletteMode,
    renderer: isRenderer(serialized.r)
      ? serialized.r
      : DEFAULT_BROWSE_STATE.renderer,
    seed,
    segmentCount:
      typeof serialized.sc === "number" && Number.isFinite(serialized.sc)
        ? clamp(Math.round(serialized.sc), 1, 8)
        : DEFAULT_BROWSE_STATE.segmentCount,
    selectedChart: isChartId(serialized.ch)
      ? serialized.ch
      : DEFAULT_BROWSE_STATE.selectedChart,
    seriesLength:
      typeof serialized.sl === "number" && Number.isFinite(serialized.sl)
        ? clamp(Math.round(serialized.sl), 3, 80)
        : DEFAULT_BROWSE_STATE.seriesLength,
    seriesPreset: isSeriesPreset(serialized.sp)
      ? serialized.sp
      : DEFAULT_BROWSE_STATE.seriesPreset,
    showHoverTooltip: serialized.ht === 1,
    showHtmlSvgOverlay: serialized.ho !== 0,
    sidebarTab: isSidebarTab(serialized.tb)
      ? serialized.tb
      : DEFAULT_BROWSE_STATE.sidebarTab,
    width:
      typeof serialized.w === "number" && Number.isFinite(serialized.w)
        ? clamp(Math.round(serialized.w), 80, 520)
        : DEFAULT_BROWSE_STATE.width,
    wrapper: isWrapper(serialized.wr)
      ? serialized.wr
      : DEFAULT_BROWSE_STATE.wrapper,
  });
}

export function encodeBrowseState(state: BrowseState): string {
  const serialized = serializeBrowseState(state);
  if (Object.keys(serialized).length === 0) return "";
  return utf8ToBase64(JSON.stringify(serialized));
}

export function decodeBrowseState(encoded: string): BrowseState | null {
  if (!encoded) return null;
  try {
    const json = base64ToUtf8(encoded);
    const parsed = JSON.parse(json) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    return deserializeBrowseState(parsed as BrowseSerializedState);
  } catch {
    return null;
  }
}
