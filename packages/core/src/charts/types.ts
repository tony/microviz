export type SparklineSpec = {
  type: "sparkline";
  pad?: number;
  showDot?: boolean;
  dotRadius?: number;
  className?: string;
};

export type SparkAreaSpec = {
  type: "spark-area";
  pad?: number;
  dotRadius?: number;
  strokeWidth?: number;
  gradientTopOpacity?: number;
  className?: string;
};

export type RangeBandSpec = {
  type: "range-band";
  pad?: number;
  bandSeed?: number;
  dotRadius?: number;
  bandOpacity?: number;
  strokeWidth?: number;
  className?: string;
};

export type BulletDeltaSpec = {
  type: "bullet-delta";
  pad?: number;
  trackStrokeOpacity?: number;
  trackStrokeWidth?: number;
  deltaStrokeOpacity?: number;
  deltaStrokeWidth?: number;
  previousDotRadius?: number;
  previousDotOpacity?: number;
  currentDotRadius?: number;
  arrowTipOffset?: number;
  arrowBaseOffset?: number;
  arrowHalfWidth?: number;
  arrowOpacity?: number;
  className?: string;
};

export type BulletGaugeSpec = {
  type: "bullet-gauge";
  pad?: number;
  gap?: number;
  markerPosition?: number;
  markerOpacity?: number;
  markerWidth?: number;
  className?: string;
};

export type BarSpec = {
  type: "bar";
  pad?: number;
  className?: string;
};

export type HistogramSpec = {
  type: "histogram";
  pad?: number;
  bins?: number;
  gap?: number;
  barRadius?: number;
  gradient?: boolean;
  gradientTopOpacity?: number;
  className?: string;
};

export type HeatgridSpec = {
  type: "heatgrid";
  pad?: number;
  cols?: number;
  rows?: number;
  className?: string;
};

export type DotMatrixSpec = {
  type: "dot-matrix";
  pad?: number;
  cols?: number;
  maxDots?: number;
  dotRadius?: number;
  className?: string;
};

export type BarcodeSpec = {
  type: "barcode";
  pad?: number;
  bins?: number;
  gap?: number;
  interleave?: boolean;
  className?: string;
};

export type WaveformSpec = {
  type: "waveform";
  pad?: number;
  bins?: number;
  gap?: number;
  barWidth?: number;
  className?: string;
};

export type PixelGridSpec = {
  type: "pixel-grid";
  pad?: number;
  cols?: number;
  rows?: number;
  gap?: number;
  interleave?: boolean;
  className?: string;
};

export type PixelTreemapSpec = {
  type: "pixel-treemap";
  pad?: number;
  cornerRadius?: number;
  stroke?: string;
  strokeWidth?: number;
  strokeOpacity?: number;
  className?: string;
};

export type PixelPillSpec = {
  type: "pixel-pill";
  pad?: number;
  gap?: number;
  minPx?: number;
  cornerRadius?: number;
  className?: string;
};

export type PixelColumnSpec = {
  type: "pixel-column";
  pad?: number;
  gap?: number;
  minPx?: number;
  cornerRadius?: number;
  className?: string;
};

export type DotRowSpec = {
  type: "dot-row";
  pad?: number;
  dots?: number;
  gap?: number;
  dotRadius?: number;
  className?: string;
};

export type DotCascadeSpec = {
  type: "dot-cascade";
  pad?: number;
  dots?: number;
  dotRadius?: number;
  className?: string;
};

export type ShapeRowSpec = {
  type: "shape-row";
  pad?: number;
  maxShapes?: number;
  shapeSize?: number;
  cornerRadius?: number;
  className?: string;
};

export type MosaicSpec = {
  type: "mosaic";
  pad?: number;
  gap?: number;
  className?: string;
};

export type StackedBarSpec = {
  type: "stacked-bar";
  pad?: number;
  className?: string;
};

export type SegmentedBarSpec = {
  type: "segmented-bar";
  pad?: number;
  gap?: number;
  className?: string;
};

export type StackedChipsSpec = {
  type: "stacked-chips";
  pad?: number;
  maxChips?: number;
  minChipWidth?: number;
  maxChipWidth?: number;
  overlap?: number;
  chipHeight?: number;
  cornerRadius?: number;
  strokeWidth?: number;
  className?: string;
};

export type GradientFadeSpec = {
  type: "gradient-fade";
  pad?: number;
  midOpacity?: number;
  endOpacity?: number;
  className?: string;
};

export type StripeDensitySpec = {
  type: "stripe-density";
  pad?: number;
  stripeWidth?: number;
  minTileWidth?: number;
  maxTileWidth?: number;
  densityScale?: number;
  className?: string;
};

export type PerforatedSpec = {
  type: "perforated";
  pad?: number;
  separatorWidth?: number;
  patternSize?: number;
  dotRadius?: number;
  dotOpacity?: number;
  className?: string;
};

export type MaskedWaveSpec = {
  type: "masked-wave";
  pad?: number;
  className?: string;
};

export type ChevronSpec = {
  type: "chevron";
  pad?: number;
  overlap?: number;
  className?: string;
};

export type InterlockingSpec = {
  type: "interlocking";
  pad?: number;
  className?: string;
};

export type TaperedSpec = {
  type: "tapered";
  pad?: number;
  taperPct?: number;
  heightStepPct?: number;
  minHeightPct?: number;
  className?: string;
};

export type PipelineSpec = {
  type: "pipeline";
  pad?: number;
  overlap?: number;
  strokeWidth?: number;
  strokeOpacity?: number;
  className?: string;
};

export type ProgressPillsSpec = {
  type: "progress-pills";
  pad?: number;
  gap?: number;
  pillHeight?: number;
  className?: string;
};

export type DumbbellSpec = {
  type: "dumbbell";
  pad?: number;
  dotRadius?: number;
  trackStrokeOpacity?: number;
  trackStrokeWidth?: number;
  rangeStrokeOpacity?: number;
  rangeStrokeWidth?: number;
  targetFillOpacity?: number;
  targetStrokeOpacity?: number;
  targetStrokeWidth?: number;
  className?: string;
};

export type BitfieldSpec = {
  type: "bitfield";
  pad?: number;
  cellSize?: number;
  dotRadius?: number;
  className?: string;
};

export type RankedLanesSpec = {
  type: "ranked-lanes";
  pad?: number;
  maxLanes?: number;
  laneHeight?: number;
  className?: string;
};

export type SkylineSpec = {
  type: "skyline";
  pad?: number;
  gap?: number;
  minHeightPct?: number;
  className?: string;
};

export type CascadeStepsSpec = {
  type: "cascade-steps";
  pad?: number;
  gap?: number;
  stepDecrement?: number;
  minHeightPct?: number;
  className?: string;
};

export type LollipopSpec = {
  type: "lollipop";
  pad?: number;
  maxItems?: number;
  stemWidth?: number;
  dotRadius?: number;
  minStemHeight?: number;
  className?: string;
};

export type VariableRibbonSpec = {
  type: "variable-ribbon";
  pad?: number;
  gap?: number;
  stepDecrement?: number;
  minHeightPct?: number;
  className?: string;
};

export type ParetoSpec = {
  type: "pareto";
  pad?: number;
  gap?: number;
  bgOpacity?: number;
  className?: string;
};

export type SteppedAreaSpec = {
  type: "stepped-area";
  pad?: number;
  gap?: number;
  stepOffset?: number;
  className?: string;
};

export type SplitParetoSpec = {
  type: "split-pareto";
  pad?: number;
  gap?: number;
  threshold?: number;
  dividerOpacity?: number;
  dividerWidth?: number;
  className?: string;
};

export type TwoTierSpec = {
  type: "two-tier";
  pad?: number;
  gap?: number;
  topRatio?: number;
  bottomOpacity?: number;
  className?: string;
};

export type MicroHeatlineSpec = {
  type: "micro-heatline";
  pad?: number;
  gap?: number;
  maxLines?: number;
  lineHeight?: number;
  className?: string;
};

export type SparklineData = ReadonlyArray<number>;

export type BarData = { value: number; max?: number };

export type BulletDeltaData = {
  current: number;
  previous: number;
  max?: number;
};

export type HistogramData = {
  series: ReadonlyArray<number>;
  opacities?: ReadonlyArray<number>;
};

export type HeatgridData = {
  series: ReadonlyArray<number>;
  opacities?: ReadonlyArray<number>;
};

export type DotMatrixData = {
  series: ReadonlyArray<number>;
  opacities?: ReadonlyArray<number>;
};

export type DumbbellData = {
  current: number;
  target: number;
  max?: number;
};

export type BitfieldSegment = { name?: string; pct: number; color: string };
export type BitfieldData = ReadonlyArray<BitfieldSegment>;

export type NormalizedSparkline = {
  type: "sparkline";
  series: number[];
  min: number;
  max: number;
};

export type NormalizedSparkArea = {
  type: "spark-area";
  series: number[];
};

export type NormalizedRangeBand = {
  type: "range-band";
  series: number[];
};

export type NormalizedBulletDelta = {
  type: "bullet-delta";
  current: number;
  previous: number;
  max: number;
};

export type NormalizedBulletGauge = {
  type: "bullet-gauge";
  segments: Array<{ name?: string; pct: number; color: string }>;
};

export type NormalizedBar = {
  type: "bar";
  value: number;
  max: number;
};

export type NormalizedHistogram = {
  type: "histogram";
  series: number[];
  opacities?: number[];
};

export type NormalizedHeatgrid = {
  type: "heatgrid";
  series: number[];
  opacities?: number[];
};

export type NormalizedDotMatrix = {
  type: "dot-matrix";
  series: number[];
  opacities?: number[];
};

export type NormalizedBarcode = {
  type: "barcode";
  segments: Array<{ name?: string; pct: number; color: string }>;
};

export type NormalizedWaveform = {
  type: "waveform";
  segments: Array<{ name?: string; pct: number; color: string }>;
};

export type NormalizedPixelGrid = {
  type: "pixel-grid";
  segments: Array<{ name?: string; pct: number; color: string }>;
};

export type NormalizedPixelTreemap = {
  type: "pixel-treemap";
  segments: Array<{ name?: string; pct: number; color: string }>;
};

export type NormalizedPixelPill = {
  type: "pixel-pill";
  segments: Array<{ name?: string; pct: number; color: string }>;
};

export type NormalizedPixelColumn = {
  type: "pixel-column";
  segments: Array<{ name?: string; pct: number; color: string }>;
};

export type NormalizedDotRow = {
  type: "dot-row";
  segments: Array<{ name?: string; pct: number; color: string }>;
};

export type NormalizedDotCascade = {
  type: "dot-cascade";
  segments: Array<{ name?: string; pct: number; color: string }>;
};

export type NormalizedShapeRow = {
  type: "shape-row";
  segments: Array<{ name?: string; pct: number; color: string }>;
};

export type NormalizedMosaic = {
  type: "mosaic";
  segments: Array<{ name?: string; pct: number; color: string }>;
};

export type NormalizedProgressPills = {
  type: "progress-pills";
  segments: Array<{ name?: string; pct: number; color: string }>;
};

export type NormalizedStackedBar = {
  type: "stacked-bar";
  segments: Array<{ name?: string; pct: number; color: string }>;
};

export type NormalizedStackedChips = {
  type: "stacked-chips";
  segments: Array<{ name?: string; pct: number; color: string }>;
};

export type NormalizedSegmentedBar = {
  type: "segmented-bar";
  segments: Array<{ name?: string; pct: number; color: string }>;
};

export type NormalizedGradientFade = {
  type: "gradient-fade";
  segments: Array<{ name?: string; pct: number; color: string }>;
};

export type NormalizedStripeDensity = {
  type: "stripe-density";
  segments: Array<{ name?: string; pct: number; color: string }>;
};

export type NormalizedPerforated = {
  type: "perforated";
  segments: Array<{ name?: string; pct: number; color: string }>;
};

export type NormalizedMaskedWave = {
  type: "masked-wave";
  segments: Array<{ name?: string; pct: number; color: string }>;
};

export type NormalizedChevron = {
  type: "chevron";
  segments: Array<{ name?: string; pct: number; color: string }>;
};

export type NormalizedInterlocking = {
  type: "interlocking";
  segments: Array<{ name?: string; pct: number; color: string }>;
};

export type NormalizedTapered = {
  type: "tapered";
  segments: Array<{ name?: string; pct: number; color: string }>;
};

export type NormalizedPipeline = {
  type: "pipeline";
  segments: Array<{ name?: string; pct: number; color: string }>;
};

export type NormalizedDumbbell = {
  type: "dumbbell";
  current: number;
  target: number;
  max: number;
};

export type NormalizedBitfield = {
  type: "bitfield";
  segments: Array<{ name?: string; pct: number; color: string }>;
};

export type NormalizedRankedLanes = {
  type: "ranked-lanes";
  segments: Array<{ name?: string; pct: number; color: string }>;
};

export type NormalizedSkyline = {
  type: "skyline";
  segments: Array<{ name?: string; pct: number; color: string }>;
};

export type NormalizedCascadeSteps = {
  type: "cascade-steps";
  segments: Array<{ name?: string; pct: number; color: string }>;
};

export type NormalizedLollipop = {
  type: "lollipop";
  segments: Array<{ name?: string; pct: number; color: string }>;
};

export type NormalizedVariableRibbon = {
  type: "variable-ribbon";
  segments: Array<{ name?: string; pct: number; color: string }>;
};

export type NormalizedPareto = {
  type: "pareto";
  segments: Array<{ name?: string; pct: number; color: string }>;
};

export type NormalizedSteppedArea = {
  type: "stepped-area";
  segments: Array<{ name?: string; pct: number; color: string }>;
};

export type NormalizedSplitPareto = {
  type: "split-pareto";
  segments: Array<{ name?: string; pct: number; color: string }>;
};

export type NormalizedTwoTier = {
  type: "two-tier";
  segments: Array<{ name?: string; pct: number; color: string }>;
};

export type NormalizedMicroHeatline = {
  type: "micro-heatline";
  segments: Array<{ name?: string; pct: number; color: string }>;
};

export type DnaHelixSpec = {
  type: "dna-helix";
  pad?: number;
  gap?: number;
  strandGap?: number;
  strandHeight?: number;
  className?: string;
};

export type NormalizedDnaHelix = {
  type: "dna-helix";
  segments: Array<{ name?: string; pct: number; color: string }>;
};

export type ConcentricArcsSpec = {
  type: "concentric-arcs";
  pad?: number;
  rings?: number;
  strokeWidth?: number;
  ringGap?: number;
  className?: string;
};

export type NormalizedConcentricArcs = {
  type: "concentric-arcs";
  arcs: Array<{ name?: string; pct: number; color: string }>;
};

export type ConcentricArcsHorizSpec = {
  type: "concentric-arcs-horiz";
  pad?: number;
  /** Maximum arcs to render (default: 4) */
  maxArcs?: number;
  /** Height decrement per arc (default: 10) */
  step?: number;
  strokeWidth?: number;
  className?: string;
};

export type NormalizedConcentricArcsHoriz = {
  type: "concentric-arcs-horiz";
  arcs: Array<{ name?: string; pct: number; color: string }>;
};

export type SplitRibbonSpec = {
  type: "split-ribbon";
  pad?: number;
  gap?: number;
  ribbonGap?: number;
  splitAt?: number;
  className?: string;
};

export type NormalizedSplitRibbon = {
  type: "split-ribbon";
  segments: Array<{ name?: string; pct: number; color: string }>;
};

export type MatryoshkaSpec = {
  type: "matryoshka";
  pad?: number;
  heightDecrement?: number;
  cornerRadius?: number;
  className?: string;
};

export type NormalizedMatryoshka = {
  type: "matryoshka";
  segments: Array<{ name?: string; pct: number; color: string }>;
};

export type LayeredWavesSpec = {
  type: "layered-waves";
  pad?: number;
  waveOffset?: number;
  baseOpacity?: number;
  cornerRadius?: number;
  className?: string;
};

export type NormalizedLayeredWaves = {
  type: "layered-waves";
  segments: Array<{ name?: string; pct: number; color: string }>;
};

export type HandOfCardsSpec = {
  type: "hand-of-cards";
  pad?: number;
  /** Overlap between cards in pixels (default: 12) */
  overlap?: number;
  /** Card height as percentage of usable height (default: 70) */
  cardHeightPct?: number;
  className?: string;
};

export type NormalizedHandOfCards = {
  type: "hand-of-cards";
  segments: Array<{ name?: string; pct: number; color: string }>;
};

export type StepLineSpec = {
  type: "step-line";
  pad?: number;
  showDot?: boolean;
  dotRadius?: number;
  className?: string;
};

export type NormalizedStepLine = {
  type: "step-line";
  series: number[];
  min: number;
  max: number;
};

export type FadedPyramidSpec = {
  type: "faded-pyramid";
  pad?: number;
  gap?: number;
  heightDecrement?: number;
  minHeightPct?: number;
  className?: string;
};

export type NormalizedFadedPyramid = {
  type: "faded-pyramid";
  segments: Array<{ name?: string; pct: number; color: string }>;
};

export type SegmentedRingSpec = {
  type: "segmented-ring";
  pad?: number;
  strokeWidth?: number;
  gapSize?: number;
  className?: string;
};

export type NormalizedSegmentedRing = {
  type: "segmented-ring";
  segments: Array<{ name?: string; pct: number; color: string }>;
};

export type NanoRingSpec = {
  type: "nano-ring";
  pad?: number;
  strokeWidth?: number;
  gapSize?: number;
  className?: string;
};

export type NormalizedNanoRing = {
  type: "nano-ring";
  segments: Array<{ name?: string; pct: number; color: string }>;
};

export type CodeMinimapSpec = {
  type: "code-minimap";
  pad?: number;
  lines?: number;
  lineHeight?: number;
  gapY?: number;
  insetX?: number;
  insetY?: number;
  lineRadius?: number;
  widthPattern?: number[];
  className?: string;
};

export type NormalizedCodeMinimap = {
  type: "code-minimap";
  segments: Array<{ name?: string; pct: number; color: string }>;
};

export type PatternTilesSpec = {
  type: "pattern-tiles";
  pad?: number;
  className?: string;
};

export type NormalizedPatternTiles = {
  type: "pattern-tiles";
  segments: Array<{ name?: string; pct: number; color: string }>;
};

export type EqualizerSpec = {
  type: "equalizer";
  pad?: number;
  bins?: number;
  gap?: number;
  barWidth?: number;
  className?: string;
};

export type NormalizedEqualizer = {
  type: "equalizer";
  segments: Array<{ name?: string; pct: number; color: string }>;
};

export type SparklineBarsSpec = {
  type: "sparkline-bars";
  pad?: number;
  gap?: number;
  barRadius?: number;
  colors?: string[];
  className?: string;
};

export type NormalizedSparklineBars = {
  type: "sparkline-bars";
  series: number[];
  min: number;
  max: number;
};

export type DonutSpec = {
  type: "donut";
  pad?: number;
  innerRadius?: number;
  className?: string;
};

export type NormalizedDonut = {
  type: "donut";
  segments: Array<{ name?: string; pct: number; color: string }>;
};

export type OrbitalDotsSpec = {
  type: "orbital-dots";
  pad?: number;
  radius?: number;
  ringStrokeWidth?: number;
  minDotRadius?: number;
  maxDotRadius?: number;
  className?: string;
};

export type NormalizedOrbitalDots = {
  type: "orbital-dots";
  segments: Array<{ name?: string; pct: number; color: string }>;
};

export type RadialBarsSpec = {
  type: "radial-bars";
  pad?: number;
  startRadius?: number;
  minLength?: number;
  maxLength?: number;
  strokeWidth?: number;
  className?: string;
};

export type NormalizedRadialBars = {
  type: "radial-bars";
  segments: Array<{ name?: string; pct: number; color: string }>;
};

export type RadialBurstSpec = {
  type: "radial-burst";
  pad?: number;
  className?: string;
};

export type NormalizedRadialBurst = {
  type: "radial-burst";
  segments: Array<{ name?: string; pct: number; color: string }>;
};

export type ShadowDepthSpec = {
  type: "shadow-depth";
  pad?: number;
  gap?: number;
  maxItems?: number;
  cornerRadius?: number;
  className?: string;
};

export type NormalizedShadowDepth = {
  type: "shadow-depth";
  segments: Array<{ name?: string; pct: number; color: string }>;
};

export type VerticalStackSpec = {
  type: "vertical-stack";
  pad?: number;
  className?: string;
};

export type NormalizedVerticalStack = {
  type: "vertical-stack";
  segments: Array<{ name?: string; pct: number; color: string }>;
};
