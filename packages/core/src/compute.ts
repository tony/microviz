import { inferA11yItems, inferA11ySummary } from "./a11y";
import type {
  ChartDefinition,
  PreferredAspectRatio,
} from "./charts/chart-definition";
import type { InteractionState, Layout, ThemeTokens } from "./charts/context";
import {
  type ChartMeta,
  chartRegistry,
  getAllChartMeta,
  getChartMeta,
} from "./charts/registry";
import {
  coerceFiniteNonNegative,
  isFiniteNumber,
  MAX_DIAGNOSTIC_WARNINGS,
  pushWarning,
} from "./charts/shared";
import { validateDefReferences } from "./diagnostics";
import type {
  A11yTree,
  Def,
  DiagnosticWarning,
  Mark,
  RenderModel,
} from "./model";
import { validateChartData } from "./validation";

export type { InteractionState, Layout, ThemeTokens } from "./charts/context";
export type {
  BarcodeSpec,
  BarData,
  BarSpec,
  BitfieldData,
  BitfieldSegment,
  BitfieldSpec,
  BulletDeltaData,
  BulletDeltaSpec,
  BulletGaugeSpec,
  CascadeStepsSpec,
  ChevronSpec,
  CodeMinimapSpec,
  ConcentricArcsHorizSpec,
  ConcentricArcsSpec,
  DnaHelixSpec,
  DonutSpec,
  DotCascadeSpec,
  DotMatrixData,
  DotMatrixSpec,
  DotRowSpec,
  DumbbellData,
  DumbbellSpec,
  EqualizerSpec,
  FadedPyramidSpec,
  GradientFadeSpec,
  HandOfCardsSpec,
  HeatgridData,
  HeatgridSpec,
  HistogramData,
  HistogramSpec,
  InterlockingSpec,
  LayeredWavesSpec,
  LollipopSpec,
  MaskedWaveSpec,
  MatryoshkaSpec,
  MicroHeatlineSpec,
  MosaicSpec,
  NanoRingSpec,
  NormalizedBar,
  NormalizedBarcode,
  NormalizedBitfield,
  NormalizedBulletDelta,
  NormalizedBulletGauge,
  NormalizedCascadeSteps,
  NormalizedChevron,
  NormalizedCodeMinimap,
  NormalizedConcentricArcs,
  NormalizedConcentricArcsHoriz,
  NormalizedDnaHelix,
  NormalizedDonut,
  NormalizedDotCascade,
  NormalizedDotMatrix,
  NormalizedDotRow,
  NormalizedDumbbell,
  NormalizedEqualizer,
  NormalizedFadedPyramid,
  NormalizedGradientFade,
  NormalizedHandOfCards,
  NormalizedHeatgrid,
  NormalizedHistogram,
  NormalizedInterlocking,
  NormalizedLayeredWaves,
  NormalizedLollipop,
  NormalizedMaskedWave,
  NormalizedMatryoshka,
  NormalizedMicroHeatline,
  NormalizedMosaic,
  NormalizedNanoRing,
  NormalizedOrbitalDots,
  NormalizedPareto,
  NormalizedPatternTiles,
  NormalizedPerforated,
  NormalizedPipeline,
  NormalizedPixelColumn,
  NormalizedPixelGrid,
  NormalizedPixelPill,
  NormalizedPixelTreemap,
  NormalizedProgressPills,
  NormalizedRadialBars,
  NormalizedRadialBurst,
  NormalizedRangeBand,
  NormalizedRankedLanes,
  NormalizedSegmentedBar,
  NormalizedSegmentedPill,
  NormalizedSegmentedRing,
  NormalizedShadowDepth,
  NormalizedShapeRow,
  NormalizedSkyline,
  NormalizedSparkArea,
  NormalizedSparkline,
  NormalizedSparklineBars,
  NormalizedSplitPareto,
  NormalizedSplitRibbon,
  NormalizedStackedBar,
  NormalizedStackedChips,
  NormalizedStepLine,
  NormalizedSteppedArea,
  NormalizedStripeDensity,
  NormalizedTapered,
  NormalizedTwoTier,
  NormalizedVariableRibbon,
  NormalizedVerticalStack,
  NormalizedWaveform,
  OrbitalDotsSpec,
  ParetoSpec,
  PatternTilesSpec,
  PerforatedSpec,
  PipelineSpec,
  PixelColumnSpec,
  PixelGridSpec,
  PixelPillSpec,
  PixelTreemapSpec,
  ProgressPillsSpec,
  RadialBarsSpec,
  RadialBurstSpec,
  RangeBandSpec,
  RankedLanesSpec,
  SegmentedBarSpec,
  SegmentedPillSpec,
  SegmentedRingSpec,
  ShadowDepthSpec,
  ShapeRowSpec,
  SkylineSpec,
  SparkAreaSpec,
  SparklineBarsSpec,
  SparklineData,
  SparklineSpec,
  SplitParetoSpec,
  SplitRibbonSpec,
  StackedBarSpec,
  StackedChipsSpec,
  StepLineSpec,
  SteppedAreaSpec,
  StripeDensitySpec,
  TaperedSpec,
  TwoTierSpec,
  VariableRibbonSpec,
  VerticalStackSpec,
  WaveformSpec,
} from "./charts/types";

export type { ChartMeta, PreferredAspectRatio };
export { getAllChartMeta, getChartMeta };

type ChartRegistry = typeof chartRegistry;
type ChartType = keyof ChartRegistry & string;

export function isChartType(type: string): type is ChartType {
  return Object.hasOwn(chartRegistry, type);
}

// Helper type to access optional metadata properties
type ChartWithAspectRatio = { preferredAspectRatio?: PreferredAspectRatio };

/**
 * Returns the preferred aspect ratio for a given chart type.
 * - "square": Chart works best with equal width and height
 * - "wide": Chart works best with width > height
 * - "tall": Chart works best with height > width
 * - undefined: Chart adapts to any size (no preference)
 */
export function getPreferredAspectRatio(
  chartType: ChartType,
): PreferredAspectRatio | undefined {
  const chart = chartRegistry[chartType] as ChartWithAspectRatio;
  return chart?.preferredAspectRatio;
}

type SpecOf<D> =
  D extends ChartDefinition<infer _T, infer S, infer _Data, infer _Normalized>
    ? S
    : never;
type DataOf<D> =
  D extends ChartDefinition<infer _T, infer _S, infer Data, infer _Normalized>
    ? Data
    : never;
type NormalizedOf<D> =
  D extends ChartDefinition<infer _T, infer _S, infer _Data, infer Normalized>
    ? Normalized
    : never;

export type ChartSpec = {
  [K in ChartType]: SpecOf<ChartRegistry[K]>;
}[ChartType];

type ChartDataByType = { [K in ChartType]: DataOf<ChartRegistry[K]> };
export type ChartDataBySpec<S extends ChartSpec> = ChartDataByType[S["type"]];

export type Size = { width: number; height: number };

export type ComputeModelInput<S extends ChartSpec = ChartSpec> = {
  spec: S;
  data: ChartDataBySpec<S>;
  size: Size;
  /**
   * Optional theme overrides for chart computation.
   *
   * Note: built-in charts are currently CSS-first and do not consume these
   * tokens; prefer CSS variables (`--mv-*`) for styling.
   */
  theme?: ThemeTokens;
  state?: InteractionState;
};

type NormalizedByType = { [K in ChartType]: NormalizedOf<ChartRegistry[K]> };
export type Normalized = NormalizedByType[ChartType];

type ErasedChartDefinition = {
  defaultPad: number;
  emptyDataWarningMessage?: string;
  normalize: (spec: ChartSpec, data: unknown) => Normalized;
  isEmpty: (normalized: Normalized) => boolean;
  marks: (
    spec: ChartSpec,
    normalized: Normalized,
    layout: Layout,
    state: InteractionState | undefined,
    theme: ThemeTokens | undefined,
    warnings: DiagnosticWarning[] | undefined,
  ) => Mark[];
  defs?: (
    spec: ChartSpec,
    normalized: Normalized,
    layout: Layout,
    warnings: DiagnosticWarning[] | undefined,
  ) => Def[];
  a11y: (spec: ChartSpec, normalized: Normalized, layout: Layout) => A11yTree;
};

function getChartDefinition(type: ChartType): ErasedChartDefinition {
  return chartRegistry[type] as unknown as ErasedChartDefinition;
}

export function normalizeData<S extends ChartSpec>(
  spec: S,
  data: ChartDataBySpec<S>,
): Normalized {
  return getChartDefinition(spec.type).normalize(spec, data);
}

export function computeLayout(
  spec: ChartSpec,
  size: Size,
  warnings?: DiagnosticWarning[],
): Layout {
  const padRaw = spec.pad ?? chartRegistry[spec.type].defaultPad;

  const width = coerceFiniteNonNegative(
    size.width,
    0,
    warnings,
    "Non-finite chart width; defaulted to 0.",
  );
  const height = coerceFiniteNonNegative(
    size.height,
    0,
    warnings,
    "Non-finite chart height; defaulted to 0.",
  );
  const pad = coerceFiniteNonNegative(
    padRaw,
    0,
    warnings,
    "Non-finite chart padding; defaulted to 0.",
  );

  return {
    height,
    pad,
    width,
  };
}

export function computeMarks(
  spec: ChartSpec,
  normalized: Normalized,
  layout: Layout,
  state?: InteractionState,
  theme?: ThemeTokens,
  warnings?: DiagnosticWarning[],
): Mark[] {
  if (spec.type !== normalized.type) return [];
  return getChartDefinition(spec.type).marks(
    spec,
    normalized,
    layout,
    state,
    theme,
    warnings,
  );
}

export function computeDefs(
  spec: ChartSpec,
  normalized: Normalized,
  layout: Layout,
  warnings?: DiagnosticWarning[],
): Def[] {
  if (spec.type !== normalized.type) return [];
  return (
    getChartDefinition(spec.type).defs?.(spec, normalized, layout, warnings) ??
    []
  );
}

export function computeA11y(
  spec: ChartSpec,
  normalized: Normalized,
  layout: Layout,
): A11yTree {
  if (spec.type !== normalized.type)
    return { label: `Chart (${spec.type})`, role: "img" };
  const tree = getChartDefinition(spec.type).a11y(spec, normalized, layout);
  const summary = tree.summary ?? inferA11ySummary(normalized);
  const items = tree.items ?? inferA11yItems(normalized);
  if (!summary && !items) return tree;
  return {
    ...tree,
    ...(summary ? { summary } : {}),
    ...(items ? { items } : {}),
  };
}

type Bounds = { maxX: number; maxY: number; minX: number; minY: number };

function maybeBoundsForPath(mark: Mark): Bounds | null {
  if (mark.type !== "path") return null;

  const commands = mark.d.match(/[a-zA-Z]/g) ?? [];
  for (const c of commands) {
    const upper = c.toUpperCase();
    if (upper !== "M" && upper !== "L" && upper !== "Z") return null;
  }

  const nums = mark.d.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi);
  if (!nums || nums.length < 2) return null;
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (let i = 0; i + 1 < nums.length; i += 2) {
    const x = Number(nums[i]);
    const y = Number(nums[i + 1]);
    if (!isFiniteNumber(x) || !isFiniteNumber(y)) return null;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  if (!isFiniteNumber(minX) || !isFiniteNumber(minY)) return null;
  if (!isFiniteNumber(maxX) || !isFiniteNumber(maxY)) return null;
  return { maxX, maxY, minX, minY };
}

function boundsForMark(mark: Mark): Bounds | null {
  switch (mark.type) {
    case "rect": {
      const x0 = mark.x;
      const y0 = mark.y;
      const x1 = mark.x + mark.w;
      const y1 = mark.y + mark.h;
      return {
        maxX: Math.max(x0, x1),
        maxY: Math.max(y0, y1),
        minX: Math.min(x0, x1),
        minY: Math.min(y0, y1),
      };
    }
    case "circle":
      return {
        maxX: mark.cx + mark.r,
        maxY: mark.cy + mark.r,
        minX: mark.cx - mark.r,
        minY: mark.cy - mark.r,
      };
    case "line":
      return {
        maxX: Math.max(mark.x1, mark.x2),
        maxY: Math.max(mark.y1, mark.y2),
        minX: Math.min(mark.x1, mark.x2),
        minY: Math.min(mark.y1, mark.y2),
      };
    case "text":
      return { maxX: mark.x, maxY: mark.y, minX: mark.x, minY: mark.y };
    case "path":
      return maybeBoundsForPath(mark);
  }
}

function hasNonFiniteNumbers(mark: Mark): boolean {
  const numericValues: number[] = [];

  switch (mark.type) {
    case "rect":
      numericValues.push(
        mark.x,
        mark.y,
        mark.w,
        mark.h,
        ...(mark.rx === undefined ? [] : [mark.rx]),
        ...(mark.ry === undefined ? [] : [mark.ry]),
      );
      break;
    case "circle":
      numericValues.push(
        mark.cx,
        mark.cy,
        mark.r,
        ...(mark.strokeWidth === undefined ? [] : [mark.strokeWidth]),
      );
      break;
    case "line":
      numericValues.push(
        mark.x1,
        mark.y1,
        mark.x2,
        mark.y2,
        ...(mark.strokeWidth === undefined ? [] : [mark.strokeWidth]),
      );
      break;
    case "text":
      numericValues.push(mark.x, mark.y);
      break;
    case "path":
      if (mark.d.includes("NaN") || mark.d.includes("Infinity")) return true;
      numericValues.push(
        ...(mark.strokeWidth === undefined ? [] : [mark.strokeWidth]),
      );
      break;
  }

  if (mark.opacity !== undefined) numericValues.push(mark.opacity);
  if ("fillOpacity" in mark && mark.fillOpacity !== undefined)
    numericValues.push(mark.fillOpacity);
  if ("strokeOpacity" in mark && mark.strokeOpacity !== undefined)
    numericValues.push(mark.strokeOpacity);

  return numericValues.some((v) => !isFiniteNumber(v));
}

function validateMarks(
  marks: readonly Mark[],
  width: number,
  height: number,
  warnings: DiagnosticWarning[],
): void {
  const eps = 1e-6;

  for (const mark of marks) {
    if (warnings.length >= MAX_DIAGNOSTIC_WARNINGS) return;

    if (hasNonFiniteNumbers(mark)) {
      pushWarning(warnings, {
        code: "NAN_COORDINATE",
        markId: mark.id,
        message: `Non-finite numeric value in mark (${mark.type}).`,
      });
      continue;
    }

    const bounds = boundsForMark(mark);
    if (!bounds) continue;
    if (!isFiniteNumber(bounds.minX)) continue;
    if (!isFiniteNumber(bounds.minY)) continue;
    if (!isFiniteNumber(bounds.maxX)) continue;
    if (!isFiniteNumber(bounds.maxY)) continue;

    const outOfBounds =
      bounds.minX < 0 - eps ||
      bounds.minY < 0 - eps ||
      bounds.maxX > width + eps ||
      bounds.maxY > height + eps;
    if (!outOfBounds) continue;

    pushWarning(warnings, {
      code: "MARK_OUT_OF_BOUNDS",
      markId: mark.id,
      message: `Mark is outside the viewport (${mark.type}).`,
    });
  }
}

export function computeModel<S extends ChartSpec>(
  input: ComputeModelInput<S>,
): RenderModel {
  const warnings: DiagnosticWarning[] = [];

  // Validate chart data and add any errors as warnings
  const validationResult = validateChartData(input.spec, input.data);
  if (!validationResult.success) {
    for (const error of validationResult.errors) {
      pushWarning(warnings, {
        code: error.code,
        expected: error.expected,
        hint: error.hint,
        message: error.message,
        path: error.path,
        received: error.received,
      });
    }
  }

  const normalized = normalizeData(input.spec, input.data);

  const def = getChartDefinition(input.spec.type);
  if (def.emptyDataWarningMessage && def.isEmpty(normalized)) {
    warnings.push({ code: "EMPTY_DATA", message: def.emptyDataWarningMessage });
  }

  const layout = computeLayout(input.spec, input.size, warnings);
  const marks = computeMarks(
    input.spec,
    normalized,
    layout,
    input.state,
    input.theme,
    warnings,
  );
  const defs = computeDefs(input.spec, normalized, layout, warnings);
  if (marks.length === 0)
    pushWarning(warnings, {
      code: "BLANK_RENDER",
      message: "No marks produced.",
    });
  validateMarks(marks, layout.width, layout.height, warnings);
  validateDefReferences(marks, defs, warnings);

  const model: RenderModel = {
    ...(defs.length > 0 ? { defs } : {}),
    height: layout.height,
    marks,
    width: layout.width,
  };

  model.a11y = computeA11y(input.spec, normalized, layout);
  model.stats = {
    hasDefs: defs.length > 0,
    markCount: marks.length,
    textCount: marks.filter((m) => m.type === "text").length,
    warnings: warnings.length > 0 ? warnings : undefined,
  };

  return model;
}
