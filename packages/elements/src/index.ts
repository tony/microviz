import { MicrovizBar } from "./bar";
import { MicrovizBarcode } from "./barcode";
import { MicrovizBitfield } from "./bitfield";
import { MicrovizBulletDelta } from "./bullet-delta";
import { MicrovizBulletGauge } from "./bullet-gauge";
import { MicrovizCascadeSteps } from "./cascade-steps";
import { MicrovizChart } from "./chart";
import { MicrovizChevron } from "./chevron";
import { MicrovizCodeMinimap } from "./code-minimap";
import { MicrovizConcentricArcs } from "./concentric-arcs";
import { MicrovizConcentricArcsHoriz } from "./concentric-arcs-horiz";
import { MicrovizDnaHelix } from "./dna-helix";
import { MicrovizDonut } from "./donut";
import { MicrovizDotCascade } from "./dot-cascade";
import { MicrovizDotMatrix } from "./dot-matrix";
import { MicrovizDotRow } from "./dot-row";
import { MicrovizDumbbell } from "./dumbbell";
import { MicrovizEqualizer } from "./equalizer";
import { MicrovizFadedPyramid } from "./faded-pyramid";
import { MicrovizGradientFade } from "./gradient-fade";
import { MicrovizHandOfCards } from "./hand-of-cards";
import { MicrovizHeatgrid } from "./heatgrid";
import { MicrovizHistogram } from "./histogram";
import { MicrovizInterlocking } from "./interlocking";
import { MicrovizLayeredWaves } from "./layered-waves";
import { MicrovizLegend } from "./legend";
import { MicrovizLollipop } from "./lollipop";
import { MicrovizMaskedWave } from "./masked-wave";
import { MicrovizMatryoshka } from "./matryoshka";
import { MicrovizMicroHeatline } from "./micro-heatline";
import { MicrovizModel } from "./model";
import { MicrovizMosaic } from "./mosaic";
import { MicrovizNanoRing } from "./nano-ring";
import { MicrovizOrbitalDots } from "./orbital-dots";
import { MicrovizPareto } from "./pareto";
import { MicrovizPatternTiles } from "./pattern-tiles";
import { MicrovizPerforated } from "./perforated";
import { MicrovizPipeline } from "./pipeline";
import { MicrovizPixelColumn } from "./pixel-column";
import { MicrovizPixelGrid } from "./pixel-grid";
import { MicrovizPixelPill } from "./pixel-pill";
import { MicrovizPixelTreemap } from "./pixel-treemap";
import { MicrovizProgressPills } from "./progress-pills";
import { MicrovizRadialBars } from "./radial-bars";
import { MicrovizRadialBurst } from "./radial-burst";
import { MicrovizRangeBand } from "./range-band";
import { MicrovizRankedLanes } from "./ranked-lanes";
import { MicrovizSegmentedBar } from "./segmented-bar";
import { MicrovizSegmentedPill } from "./segmented-pill";
import { MicrovizSegmentedRing } from "./segmented-ring";
import { MicrovizShadowDepth } from "./shadow-depth";
import { MicrovizShapeRow } from "./shape-row";
import { MicrovizSkyline } from "./skyline";
import { MicrovizSparkArea } from "./spark-area";
import { MicrovizSparkline } from "./sparkline";
import { MicrovizSparklineBars } from "./sparkline-bars";
import { MicrovizSplitPareto } from "./split-pareto";
import { MicrovizSplitRibbon } from "./split-ribbon";
import { MicrovizStackedBar } from "./stacked-bar";
import { MicrovizStackedChips } from "./stacked-chips";
import { MicrovizStepLine } from "./step-line";
import { MicrovizSteppedArea } from "./stepped-area";
import { MicrovizStripeDensity } from "./stripe-density";
import { MicrovizTapered } from "./tapered";
import { MicrovizTwoTier } from "./two-tier";
import { MicrovizVariableRibbon } from "./variable-ribbon";
import { MicrovizVerticalStack } from "./vertical-stack";
import { MicrovizWaveform } from "./waveform";

export type {
  MicrovizClientPoint,
  MicrovizHitDetail,
  MicrovizHitEvent,
} from "./events";

export {
  MicrovizBar,
  MicrovizBulletDelta,
  MicrovizBulletGauge,
  MicrovizCascadeSteps,
  MicrovizBarcode,
  MicrovizBitfield,
  MicrovizChart,
  MicrovizChevron,
  MicrovizCodeMinimap,
  MicrovizConcentricArcs,
  MicrovizConcentricArcsHoriz,
  MicrovizDnaHelix,
  MicrovizDonut,
  MicrovizDotCascade,
  MicrovizDotMatrix,
  MicrovizDotRow,
  MicrovizDumbbell,
  MicrovizEqualizer,
  MicrovizFadedPyramid,
  MicrovizGradientFade,
  MicrovizHandOfCards,
  MicrovizHeatgrid,
  MicrovizHistogram,
  MicrovizInterlocking,
  MicrovizLayeredWaves,
  MicrovizLegend,
  MicrovizLollipop,
  MicrovizMaskedWave,
  MicrovizMatryoshka,
  MicrovizModel,
  MicrovizMicroHeatline,
  MicrovizMosaic,
  MicrovizNanoRing,
  MicrovizOrbitalDots,
  MicrovizPareto,
  MicrovizPatternTiles,
  MicrovizPerforated,
  MicrovizPixelColumn,
  MicrovizPixelGrid,
  MicrovizPixelPill,
  MicrovizPixelTreemap,
  MicrovizPipeline,
  MicrovizProgressPills,
  MicrovizRadialBurst,
  MicrovizRadialBars,
  MicrovizRankedLanes,
  MicrovizRangeBand,
  MicrovizShadowDepth,
  MicrovizSegmentedRing,
  MicrovizSegmentedBar,
  MicrovizSegmentedPill,
  MicrovizShapeRow,
  MicrovizSkyline,
  MicrovizSparkArea,
  MicrovizSparkline,
  MicrovizSparklineBars,
  MicrovizStackedBar,
  MicrovizStackedChips,
  MicrovizSplitPareto,
  MicrovizSplitRibbon,
  MicrovizStepLine,
  MicrovizSteppedArea,
  MicrovizStripeDensity,
  MicrovizTapered,
  MicrovizTwoTier,
  MicrovizVariableRibbon,
  MicrovizVerticalStack,
  MicrovizWaveform,
};

export function registerMicrovizElements(): void {
  if (!customElements.get("microviz-chart")) {
    customElements.define("microviz-chart", MicrovizChart);
  }

  if (!customElements.get("microviz-legend")) {
    customElements.define("microviz-legend", MicrovizLegend);
  }

  if (!customElements.get("microviz-model")) {
    customElements.define("microviz-model", MicrovizModel);
  }

  if (!customElements.get("microviz-sparkline")) {
    customElements.define("microviz-sparkline", MicrovizSparkline);
  }

  if (!customElements.get("microviz-range-band")) {
    customElements.define("microviz-range-band", MicrovizRangeBand);
  }

  if (!customElements.get("microviz-bullet-delta")) {
    customElements.define("microviz-bullet-delta", MicrovizBulletDelta);
  }

  if (!customElements.get("microviz-bullet-gauge")) {
    customElements.define("microviz-bullet-gauge", MicrovizBulletGauge);
  }

  if (!customElements.get("microviz-cascade-steps")) {
    customElements.define("microviz-cascade-steps", MicrovizCascadeSteps);
  }

  if (!customElements.get("microviz-chevron")) {
    customElements.define("microviz-chevron", MicrovizChevron);
  }

  if (!customElements.get("microviz-dna-helix")) {
    customElements.define("microviz-dna-helix", MicrovizDnaHelix);
  }

  if (!customElements.get("microviz-code-minimap")) {
    customElements.define("microviz-code-minimap", MicrovizCodeMinimap);
  }

  if (!customElements.get("microviz-equalizer")) {
    customElements.define("microviz-equalizer", MicrovizEqualizer);
  }

  if (!customElements.get("microviz-gradient-fade")) {
    customElements.define("microviz-gradient-fade", MicrovizGradientFade);
  }

  if (!customElements.get("microviz-faded-pyramid")) {
    customElements.define("microviz-faded-pyramid", MicrovizFadedPyramid);
  }

  if (!customElements.get("microviz-hand-of-cards")) {
    customElements.define("microviz-hand-of-cards", MicrovizHandOfCards);
  }

  if (!customElements.get("microviz-interlocking")) {
    customElements.define("microviz-interlocking", MicrovizInterlocking);
  }

  if (!customElements.get("microviz-layered-waves")) {
    customElements.define("microviz-layered-waves", MicrovizLayeredWaves);
  }

  if (!customElements.get("microviz-lollipop")) {
    customElements.define("microviz-lollipop", MicrovizLollipop);
  }

  if (!customElements.get("microviz-masked-wave")) {
    customElements.define("microviz-masked-wave", MicrovizMaskedWave);
  }

  if (!customElements.get("microviz-matryoshka")) {
    customElements.define("microviz-matryoshka", MicrovizMatryoshka);
  }

  if (!customElements.get("microviz-micro-heatline")) {
    customElements.define("microviz-micro-heatline", MicrovizMicroHeatline);
  }

  if (!customElements.get("microviz-pareto")) {
    customElements.define("microviz-pareto", MicrovizPareto);
  }

  if (!customElements.get("microviz-perforated")) {
    customElements.define("microviz-perforated", MicrovizPerforated);
  }

  if (!customElements.get("microviz-spark-area")) {
    customElements.define("microviz-spark-area", MicrovizSparkArea);
  }

  if (!customElements.get("microviz-bar")) {
    customElements.define("microviz-bar", MicrovizBar);
  }

  if (!customElements.get("microviz-donut")) {
    customElements.define("microviz-donut", MicrovizDonut);
  }

  if (!customElements.get("microviz-segmented-ring")) {
    customElements.define("microviz-segmented-ring", MicrovizSegmentedRing);
  }

  if (!customElements.get("microviz-nano-ring")) {
    customElements.define("microviz-nano-ring", MicrovizNanoRing);
  }

  if (!customElements.get("microviz-concentric-arcs")) {
    customElements.define("microviz-concentric-arcs", MicrovizConcentricArcs);
  }

  if (!customElements.get("microviz-concentric-arcs-horiz")) {
    customElements.define(
      "microviz-concentric-arcs-horiz",
      MicrovizConcentricArcsHoriz,
    );
  }

  if (!customElements.get("microviz-radial-burst")) {
    customElements.define("microviz-radial-burst", MicrovizRadialBurst);
  }

  if (!customElements.get("microviz-barcode")) {
    customElements.define("microviz-barcode", MicrovizBarcode);
  }

  if (!customElements.get("microviz-pixel-grid")) {
    customElements.define("microviz-pixel-grid", MicrovizPixelGrid);
  }

  if (!customElements.get("microviz-pixel-pill")) {
    customElements.define("microviz-pixel-pill", MicrovizPixelPill);
  }

  if (!customElements.get("microviz-pixel-column")) {
    customElements.define("microviz-pixel-column", MicrovizPixelColumn);
  }

  if (!customElements.get("microviz-pixel-treemap")) {
    customElements.define("microviz-pixel-treemap", MicrovizPixelTreemap);
  }

  if (!customElements.get("microviz-progress-pills")) {
    customElements.define("microviz-progress-pills", MicrovizProgressPills);
  }

  if (!customElements.get("microviz-stacked-bar")) {
    customElements.define("microviz-stacked-bar", MicrovizStackedBar);
  }

  if (!customElements.get("microviz-segmented-bar")) {
    customElements.define("microviz-segmented-bar", MicrovizSegmentedBar);
  }

  if (!customElements.get("microviz-segmented-pill")) {
    customElements.define("microviz-segmented-pill", MicrovizSegmentedPill);
  }

  if (!customElements.get("microviz-stacked-chips")) {
    customElements.define("microviz-stacked-chips", MicrovizStackedChips);
  }

  if (!customElements.get("microviz-histogram")) {
    customElements.define("microviz-histogram", MicrovizHistogram);
  }

  if (!customElements.get("microviz-heatgrid")) {
    customElements.define("microviz-heatgrid", MicrovizHeatgrid);
  }

  if (!customElements.get("microviz-dot-matrix")) {
    customElements.define("microviz-dot-matrix", MicrovizDotMatrix);
  }

  if (!customElements.get("microviz-dot-row")) {
    customElements.define("microviz-dot-row", MicrovizDotRow);
  }

  if (!customElements.get("microviz-dot-cascade")) {
    customElements.define("microviz-dot-cascade", MicrovizDotCascade);
  }

  if (!customElements.get("microviz-shape-row")) {
    customElements.define("microviz-shape-row", MicrovizShapeRow);
  }

  if (!customElements.get("microviz-orbital-dots")) {
    customElements.define("microviz-orbital-dots", MicrovizOrbitalDots);
  }

  if (!customElements.get("microviz-radial-bars")) {
    customElements.define("microviz-radial-bars", MicrovizRadialBars);
  }

  if (!customElements.get("microviz-dumbbell")) {
    customElements.define("microviz-dumbbell", MicrovizDumbbell);
  }

  if (!customElements.get("microviz-bitfield")) {
    customElements.define("microviz-bitfield", MicrovizBitfield);
  }

  if (!customElements.get("microviz-mosaic")) {
    customElements.define("microviz-mosaic", MicrovizMosaic);
  }

  if (!customElements.get("microviz-waveform")) {
    customElements.define("microviz-waveform", MicrovizWaveform);
  }

  if (!customElements.get("microviz-pipeline")) {
    customElements.define("microviz-pipeline", MicrovizPipeline);
  }

  if (!customElements.get("microviz-ranked-lanes")) {
    customElements.define("microviz-ranked-lanes", MicrovizRankedLanes);
  }

  if (!customElements.get("microviz-shadow-depth")) {
    customElements.define("microviz-shadow-depth", MicrovizShadowDepth);
  }

  if (!customElements.get("microviz-skyline")) {
    customElements.define("microviz-skyline", MicrovizSkyline);
  }

  if (!customElements.get("microviz-split-pareto")) {
    customElements.define("microviz-split-pareto", MicrovizSplitPareto);
  }

  if (!customElements.get("microviz-split-ribbon")) {
    customElements.define("microviz-split-ribbon", MicrovizSplitRibbon);
  }

  if (!customElements.get("microviz-step-line")) {
    customElements.define("microviz-step-line", MicrovizStepLine);
  }

  if (!customElements.get("microviz-stepped-area")) {
    customElements.define("microviz-stepped-area", MicrovizSteppedArea);
  }

  if (!customElements.get("microviz-stripe-density")) {
    customElements.define("microviz-stripe-density", MicrovizStripeDensity);
  }

  if (!customElements.get("microviz-tapered")) {
    customElements.define("microviz-tapered", MicrovizTapered);
  }

  if (!customElements.get("microviz-two-tier")) {
    customElements.define("microviz-two-tier", MicrovizTwoTier);
  }

  if (!customElements.get("microviz-variable-ribbon")) {
    customElements.define("microviz-variable-ribbon", MicrovizVariableRibbon);
  }

  if (!customElements.get("microviz-sparkline-bars")) {
    customElements.define("microviz-sparkline-bars", MicrovizSparklineBars);
  }

  if (!customElements.get("microviz-pattern-tiles")) {
    customElements.define("microviz-pattern-tiles", MicrovizPatternTiles);
  }

  if (!customElements.get("microviz-vertical-stack")) {
    customElements.define("microviz-vertical-stack", MicrovizVerticalStack);
  }
}

registerMicrovizElements();
