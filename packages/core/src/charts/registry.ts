import { barChart } from "./bar";
import { barcodeChart } from "./barcode";
import { bitfieldChart } from "./bitfield";
import { bulletDeltaChart } from "./bullet-delta";
import { bulletGaugeChart } from "./bullet-gauge";
import { cascadeStepsChart } from "./cascade-steps";
import { createChartRegistry } from "./chart-definition";
import { chevronChart } from "./chevron";
import { codeMinimapChart } from "./code-minimap";
import { concentricArcsChart } from "./concentric-arcs";
import { concentricArcsHorizChart } from "./concentric-arcs-horiz";
import { dnaHelixChart } from "./dna-helix";
import { donutChart } from "./donut";
import { dotCascadeChart } from "./dot-cascade";
import { dotMatrixChart } from "./dot-matrix";
import { dotRowChart } from "./dot-row";
import { dumbbellChart } from "./dumbbell";
import { equalizerChart } from "./equalizer";
import { fadedPyramidChart } from "./faded-pyramid";
import { gradientFadeChart } from "./gradient-fade";
import { handOfCardsChart } from "./hand-of-cards";
import { heatgridChart } from "./heatgrid";
import { histogramChart } from "./histogram";
import { interlockingChart } from "./interlocking";
import { layeredWavesChart } from "./layered-waves";
import { lollipopChart } from "./lollipop";
import { maskedWaveChart } from "./masked-wave";
import { matryoshkaChart } from "./matryoshka";
import { microHeatlineChart } from "./micro-heatline";
import { mosaicChart } from "./mosaic";
import { nanoRingChart } from "./nano-ring";
import { orbitalDotsChart } from "./orbital-dots";
import { paretoChart } from "./pareto";
import { patternTilesChart } from "./pattern-tiles";
import { perforatedChart } from "./perforated";
import { pipelineChart } from "./pipeline";
import { pixelColumnChart } from "./pixel-column";
import { pixelGridChart } from "./pixel-grid";
import { pixelPillChart } from "./pixel-pill";
import { pixelTreemapChart } from "./pixel-treemap";
import { progressPillsChart } from "./progress-pills";
import { radialBarsChart } from "./radial-bars";
import { radialBurstChart } from "./radial-burst";
import { rangeBandChart } from "./range-band";
import { rankedLanesChart } from "./ranked-lanes";
import { segmentedBarChart } from "./segmented-bar";
import { segmentedRingChart } from "./segmented-ring";
import { shadowDepthChart } from "./shadow-depth";
import { shapeRowChart } from "./shape-row";
import { skylineChart } from "./skyline";
import { sparkAreaChart } from "./spark-area";
import { sparklineChart } from "./sparkline";
import { sparklineBarsChart } from "./sparkline-bars";
import { splitParetoChart } from "./split-pareto";
import { splitRibbonChart } from "./split-ribbon";
import { stackedBarChart } from "./stacked-bar";
import { stackedChipsChart } from "./stacked-chips";
import { stepLineChart } from "./step-line";
import { steppedAreaChart } from "./stepped-area";
import { stripeDensityChart } from "./stripe-density";
import { taperedChart } from "./tapered";
import { twoTierChart } from "./two-tier";
import { variableRibbonChart } from "./variable-ribbon";
import { verticalStackChart } from "./vertical-stack";
import { waveformChart } from "./waveform";

export const chartRegistry = createChartRegistry({
  bar: barChart,
  barcode: barcodeChart,
  bitfield: bitfieldChart,
  "bullet-delta": bulletDeltaChart,
  "bullet-gauge": bulletGaugeChart,
  "cascade-steps": cascadeStepsChart,
  chevron: chevronChart,
  "code-minimap": codeMinimapChart,
  "concentric-arcs": concentricArcsChart,
  "concentric-arcs-horiz": concentricArcsHorizChart,
  "dna-helix": dnaHelixChart,
  donut: donutChart,
  "dot-cascade": dotCascadeChart,
  "dot-matrix": dotMatrixChart,
  "dot-row": dotRowChart,
  dumbbell: dumbbellChart,
  equalizer: equalizerChart,
  "faded-pyramid": fadedPyramidChart,
  "gradient-fade": gradientFadeChart,
  "hand-of-cards": handOfCardsChart,
  heatgrid: heatgridChart,
  histogram: histogramChart,
  interlocking: interlockingChart,
  "layered-waves": layeredWavesChart,
  lollipop: lollipopChart,
  "masked-wave": maskedWaveChart,
  matryoshka: matryoshkaChart,
  "micro-heatline": microHeatlineChart,
  mosaic: mosaicChart,
  "nano-ring": nanoRingChart,
  "orbital-dots": orbitalDotsChart,
  pareto: paretoChart,
  "pattern-tiles": patternTilesChart,
  perforated: perforatedChart,
  pipeline: pipelineChart,
  "pixel-column": pixelColumnChart,
  "pixel-grid": pixelGridChart,
  "pixel-pill": pixelPillChart,
  "pixel-treemap": pixelTreemapChart,
  "progress-pills": progressPillsChart,
  "radial-bars": radialBarsChart,
  "radial-burst": radialBurstChart,
  "range-band": rangeBandChart,
  "ranked-lanes": rankedLanesChart,
  "segmented-bar": segmentedBarChart,
  "segmented-ring": segmentedRingChart,
  "shadow-depth": shadowDepthChart,
  "shape-row": shapeRowChart,
  skyline: skylineChart,
  "spark-area": sparkAreaChart,
  sparkline: sparklineChart,
  "sparkline-bars": sparklineBarsChart,
  "split-pareto": splitParetoChart,
  "split-ribbon": splitRibbonChart,
  "stacked-bar": stackedBarChart,
  "stacked-chips": stackedChipsChart,
  "step-line": stepLineChart,
  "stepped-area": steppedAreaChart,
  "stripe-density": stripeDensityChart,
  tapered: taperedChart,
  "two-tier": twoTierChart,
  "variable-ribbon": variableRibbonChart,
  "vertical-stack": verticalStackChart,
  waveform: waveformChart,
});

export type ChartRegistry = typeof chartRegistry;
export type ChartType = keyof ChartRegistry & string;

/**
 * Metadata for a chart type, extracted from the registry.
 */
export type ChartMeta = {
  type: ChartType;
  displayName: string;
  category: "lines" | "bars" | "grids" | "dots";
  preferredAspectRatio?: "square" | "wide" | "tall";
};

// Helper type to access optional metadata properties
type ChartWithMeta = {
  category?: "lines" | "bars" | "grids" | "dots";
  displayName?: string;
  preferredAspectRatio?: "square" | "wide" | "tall";
};

/**
 * Get metadata for a specific chart type.
 * Returns displayName, category, and preferredAspectRatio from the chart definition.
 */
export function getChartMeta(chartType: ChartType): ChartMeta {
  const chart = chartRegistry[chartType] as ChartWithMeta;
  // Default displayName: capitalize first word, keep rest as-is
  const defaultDisplayName = chartType
    .split("-")
    .map((part, i) =>
      i === 0 ? part.charAt(0).toUpperCase() + part.slice(1) : part,
    )
    .join(" ");

  return {
    category: chart.category ?? "bars",
    displayName: chart.displayName ?? defaultDisplayName,
    preferredAspectRatio: chart.preferredAspectRatio,
    type: chartType,
  };
}

/**
 * Get metadata for all registered charts.
 */
export function getAllChartMeta(): ChartMeta[] {
  return (Object.keys(chartRegistry) as ChartType[]).map(getChartMeta);
}
