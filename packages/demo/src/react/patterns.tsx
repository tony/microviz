import type { MicrovizSegment } from "@microviz/core";
import { computeModel } from "@microviz/core";
import { MicrovizSvg } from "@microviz/react";
import {
  type CSSProperties,
  type FC,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getDemoRange } from "../demoRange";
import { VirtualizedStack } from "../ui/VirtualizedStack";

// ============================================
// TYPES
// ============================================

export type Segment = MicrovizSegment;

// ============================================
// CONSTANTS
// ============================================

export const VIZ_CLASS = "h-8 w-[200px]";
export const DUR_MS = 500;
export const T = "transition-all duration-500 ease-out";
export const FALLBACK_COLOR = "oklch(0.65 0.15 250)";

export const DEMO_DISTRIBUTION: Segment[] = [
  { color: "oklch(0.65 0.15 250)", name: "TypeScript", pct: 38 },
  { color: "oklch(0.70 0.15 150)", name: "React", pct: 22 },
  { color: "oklch(0.72 0.15 80)", name: "CSS", pct: 14 },
  { color: "oklch(0.72 0.12 30)", name: "HTML", pct: 10 },
  { color: "oklch(0.68 0.14 10)", name: "Other", pct: 16 },
];

export const DEMO_TIMELINE_MONTHS: Array<{ label: string; count: number }> = [
  { count: 6, label: "Jan" },
  { count: 10, label: "Feb" },
  { count: 7, label: "Mar" },
  { count: 12, label: "Apr" },
  { count: 9, label: "May" },
  { count: 14, label: "Jun" },
  { count: 11, label: "Jul" },
  { count: 18, label: "Aug" },
  { count: 13, label: "Sep" },
  { count: 20, label: "Oct" },
  { count: 16, label: "Nov" },
  { count: 22, label: "Dec" },
];

export const DEMO_TIMELINE_YEARS: Array<{ label: string; count: number }> = [
  { count: 40, label: "2022" },
  { count: 55, label: "2023" },
  { count: 70, label: "2024" },
  { count: 62, label: "2025" },
];

// ============================================
// SECTION 6-10: CSS DISTRIBUTION PATTERNS (38)
// ============================================

// 1. Stacked Bar
export const StackedBar: FC<{ data: Segment[] }> = ({ data }) => {
  const model = computeModel({
    data,
    size: { height: 32, width: 200 },
    spec: { type: "stacked-bar" },
  });
  return (
    <MicrovizSvg
      aria-hidden
      className={`${VIZ_CLASS} overflow-hidden rounded`}
      model={model}
      role="presentation"
    />
  );
};

// 2. Segmented Bar
export const SegmentedBar: FC<{ data: Segment[] }> = ({ data }) => {
  const model = computeModel({
    data,
    size: { height: 32, width: 200 },
    spec: { type: "segmented-bar" },
  });

  return (
    <MicrovizSvg
      aria-hidden
      className={VIZ_CLASS}
      model={model}
      role="presentation"
    />
  );
};

// 3. Progress Pills
export const ProgressPills: FC<{ data: Segment[] }> = ({ data }) => {
  const model = computeModel({
    data,
    size: { height: 32, width: 200 },
    spec: { type: "progress-pills" },
  });

  return (
    <MicrovizSvg
      aria-hidden
      className={VIZ_CLASS}
      model={model}
      role="presentation"
    />
  );
};

// 4. Dot Row
export const DotRow: FC<{ data: Segment[] }> = ({ data }) => {
  const model = computeModel({
    data,
    size: { height: 32, width: 200 },
    spec: { type: "dot-row" },
  });
  return (
    <MicrovizSvg
      aria-hidden
      className={VIZ_CLASS}
      model={model}
      role="presentation"
    />
  );
};

// 5. Skyline Bar
export const SkylineBar: FC<{ data: Segment[] }> = ({ data }) => {
  const model = computeModel({
    data,
    size: { height: 32, width: 200 },
    spec: { type: "skyline" },
  });
  return (
    <MicrovizSvg
      aria-hidden
      className={VIZ_CLASS}
      model={model}
      role="presentation"
    />
  );
};

// 6. Cascade Steps
export const CascadeSteps: FC<{ data: Segment[] }> = ({ data }) => {
  const model = computeModel({
    data,
    size: { height: 32, width: 200 },
    spec: { type: "cascade-steps" },
  });

  return (
    <MicrovizSvg
      aria-hidden
      className={VIZ_CLASS}
      model={model}
      role="presentation"
    />
  );
};

// 7. Ranked Lanes
export const RankedLanes: FC<{ data: Segment[] }> = ({ data }) => {
  const model = computeModel({
    data,
    size: { height: 32, width: 200 },
    spec: { type: "ranked-lanes" },
  });

  return (
    <MicrovizSvg
      aria-hidden
      className={VIZ_CLASS}
      model={model}
      role="presentation"
    />
  );
};

// 8. Lollipop Skyline
export const LollipopSkyline: FC<{ data: Segment[] }> = ({ data }) => {
  const model = computeModel({
    data,
    size: { height: 32, width: 200 },
    spec: { type: "lollipop" },
  });
  return (
    <MicrovizSvg
      aria-hidden
      className={VIZ_CLASS}
      model={model}
      role="presentation"
    />
  );
};

// 9. Variable Ribbon
export const VariableRibbon: FC<{ data: Segment[] }> = ({ data }) => {
  const model = computeModel({
    data,
    size: { height: 32, width: 200 },
    spec: { type: "variable-ribbon" },
  });

  return (
    <MicrovizSvg
      aria-hidden
      className={VIZ_CLASS}
      model={model}
      role="presentation"
    />
  );
};

// 10. Faded Pyramid
export const FadedPyramid: FC<{ data: Segment[] }> = ({ data }) => {
  const model = computeModel({
    data,
    size: { height: 32, width: 200 },
    spec: { type: "faded-pyramid" },
  });

  return (
    <MicrovizSvg
      aria-hidden
      className={VIZ_CLASS}
      model={model}
      role="presentation"
    />
  );
};

// 11. Pipeline
export const PipelineBar: FC<{ data: Segment[] }> = ({ data }) => {
  const model = computeModel({
    data,
    size: { height: 32, width: 200 },
    spec: { type: "pipeline" },
  });
  return (
    <MicrovizSvg
      aria-hidden
      className={VIZ_CLASS}
      model={model}
      role="presentation"
    />
  );
};

// 12. Chevron Segments
export const ChevronSegments: FC<{ data: Segment[] }> = ({ data }) => {
  const model = computeModel({
    data,
    size: { height: 32, width: 200 },
    spec: { className: T, overlap: 6, pad: 0, type: "chevron" },
  });

  return (
    <MicrovizSvg
      aria-hidden
      className={`${VIZ_CLASS} overflow-hidden`}
      model={model}
      role="presentation"
    />
  );
};

// 13. Tapered Bar
export const TaperedBar: FC<{ data: Segment[] }> = ({ data }) => {
  const model = computeModel({
    data,
    size: { height: 32, width: 200 },
    spec: { className: T, pad: 0, type: "tapered" },
  });

  return (
    <MicrovizSvg
      aria-hidden
      className={`${VIZ_CLASS} overflow-hidden`}
      model={model}
      role="presentation"
    />
  );
};

// 14. Interlocking Blocks
export const InterlockingBlocks: FC<{ data: Segment[] }> = ({ data }) => {
  const model = computeModel({
    data,
    size: { height: 32, width: 200 },
    spec: { className: T, pad: 0, type: "interlocking" },
  });

  return (
    <MicrovizSvg
      aria-hidden
      className={`${VIZ_CLASS} overflow-hidden`}
      model={model}
      role="presentation"
    />
  );
};

// 15. DNA Helix
export const DNAHelix: FC<{ data: Segment[] }> = ({ data }) => {
  const model = computeModel({
    data,
    size: { height: 32, width: 200 },
    spec: { type: "dna-helix" },
  });

  return (
    <MicrovizSvg
      aria-hidden
      className={VIZ_CLASS}
      model={model}
      role="presentation"
    />
  );
};

// 16. Matryoshka
export const MatryoshkaBar: FC<{ data: Segment[] }> = ({ data }) => {
  const model = computeModel({
    data,
    size: { height: 32, width: 200 },
    spec: { type: "matryoshka" },
  });

  return (
    <div
      className={`relative ${VIZ_CLASS} overflow-hidden rounded-md bg-slate-900/5 dark:bg-slate-800/20`}
    >
      <MicrovizSvg
        aria-hidden
        className="h-full w-full"
        model={model}
        role="presentation"
      />
    </div>
  );
};

// 17. Layered Waves
export const LayeredWaves: FC<{ data: Segment[] }> = ({ data }) => {
  const model = computeModel({
    data,
    size: { height: 32, width: 200 },
    spec: { type: "layered-waves" },
  });
  return (
    <div className={`relative ${VIZ_CLASS} overflow-hidden rounded`}>
      <MicrovizSvg
        aria-hidden
        className="h-full w-full"
        model={model}
        role="presentation"
      />
    </div>
  );
};

// 18. Hand of Cards
export const HandOfCards: FC<{ data: Segment[] }> = ({ data }) => {
  const model = computeModel({
    data,
    size: { height: 32, width: 200 },
    spec: { type: "hand-of-cards" },
  });

  return (
    <div className={`relative ${VIZ_CLASS} overflow-hidden rounded pl-1`}>
      <MicrovizSvg
        aria-hidden
        className="h-full w-full"
        model={model}
        role="presentation"
      />
    </div>
  );
};

// 19. Shadow Depth
export const ShadowDepth: FC<{ data: Segment[] }> = ({ data }) => {
  const model = computeModel({
    data,
    size: { height: 32, width: 200 },
    spec: {
      cornerRadius: 4,
      gap: 4,
      maxItems: 4,
      pad: 0,
      type: "shadow-depth",
    },
  });

  return (
    <MicrovizSvg
      aria-hidden
      className={`${VIZ_CLASS} overflow-visible`}
      model={model}
      role="presentation"
    />
  );
};

// 20. Stepped Area
export const SteppedArea: FC<{ data: Segment[] }> = ({ data }) => {
  const model = computeModel({
    data,
    size: { height: 32, width: 200 },
    spec: { type: "stepped-area" },
  });
  return (
    <div className={`relative ${VIZ_CLASS} overflow-hidden`}>
      <MicrovizSvg
        aria-hidden
        className="h-full w-full"
        model={model}
        role="presentation"
      />
    </div>
  );
};

// 21. Pareto
export const ParetoBar: FC<{ data: Segment[] }> = ({ data }) => {
  const model = computeModel({
    data,
    size: { height: 32, width: 200 },
    spec: { type: "pareto" },
  });
  return (
    <MicrovizSvg
      aria-hidden
      className={`${VIZ_CLASS} overflow-hidden rounded-sm`}
      model={model}
      role="presentation"
    />
  );
};

// 22. Bullet Gauge
export const BulletGauge: FC<{ data: Segment[] }> = ({ data }) => {
  const model = computeModel({
    data,
    size: { height: 32, width: 200 },
    spec: { type: "bullet-gauge" },
  });

  return (
    <MicrovizSvg
      aria-hidden
      className={`${VIZ_CLASS} overflow-hidden rounded-full`}
      model={model}
      role="presentation"
    />
  );
};

// 23. Two-Tier
export const TwoTierBar: FC<{ data: Segment[] }> = ({ data }) => {
  const model = computeModel({
    data,
    size: { height: 32, width: 200 },
    spec: { type: "two-tier" },
  });

  return (
    <MicrovizSvg
      aria-hidden
      className={VIZ_CLASS}
      model={model}
      role="presentation"
    />
  );
};

// 24. Split-Pareto
export const SplitPareto: FC<{ data: Segment[] }> = ({ data }) => {
  const model = computeModel({
    data,
    size: { height: 32, width: 200 },
    spec: { type: "split-pareto" },
  });
  return (
    <MicrovizSvg
      aria-hidden
      className={`${VIZ_CLASS} overflow-hidden rounded`}
      model={model}
      role="presentation"
    />
  );
};

// 25. Bitfield
export const BitfieldBar: FC<{ data: Segment[] }> = ({ data }) => {
  const model = computeModel({
    data,
    size: { height: 32, width: 200 },
    spec: { type: "bitfield" },
  });

  return (
    <MicrovizSvg
      aria-hidden
      className={VIZ_CLASS}
      model={model}
      role="presentation"
    />
  );
};

// 26. Stripe Density
export const StripeDensity: FC<{ data: Segment[] }> = ({ data }) => {
  const model = computeModel({
    data,
    size: { height: 32, width: 200 },
    spec: { className: T, type: "stripe-density" },
  });

  return (
    <MicrovizSvg
      aria-hidden
      className={`${VIZ_CLASS} overflow-hidden rounded`}
      model={model}
      role="presentation"
    />
  );
};

// 27. Gradient Fade
export const GradientFade: FC<{ data: Segment[] }> = ({ data }) => {
  const model = computeModel({
    data,
    size: { height: 32, width: 200 },
    spec: { className: T, type: "gradient-fade" },
  });

  return (
    <MicrovizSvg
      aria-hidden
      className={`${VIZ_CLASS} overflow-hidden rounded`}
      model={model}
      role="presentation"
    />
  );
};

// 28. Perforated
export const PerforatedBar: FC<{ data: Segment[] }> = ({ data }) => {
  const model = computeModel({
    data,
    size: { height: 32, width: 200 },
    spec: { className: T, type: "perforated" },
  });

  return (
    <MicrovizSvg
      aria-hidden
      className={`${VIZ_CLASS} overflow-hidden rounded`}
      model={model}
      role="presentation"
    />
  );
};

// 29. Masked Waveform Strip
export const MaskedWaveformStrip: FC<{ data: Segment[] }> = ({ data }) => {
  const model = computeModel({
    data,
    size: { height: 32, width: 200 },
    spec: { className: T, type: "masked-wave" },
  });

  return (
    <MicrovizSvg
      aria-hidden
      className={`${VIZ_CLASS} overflow-hidden rounded`}
      model={model}
      role="presentation"
    />
  );
};

// Noise Displacement (SVG filter demo fixture)
export const NoiseDisplacement: FC<{ data: Segment[] }> = ({ data }) => {
  const model = useMemo(() => {
    const base = computeModel({
      data,
      size: { height: 32, width: 200 },
      spec: { className: T, type: "stacked-bar" },
    });

    const filterId = "mv-noise-displacement";
    return {
      ...base,
      defs: [
        ...(base.defs ?? []),
        {
          filterUnits: "objectBoundingBox" as const,
          height: 2,
          id: filterId,
          primitives: [
            {
              baseFrequency: "0.02 0.08",
              noiseType: "fractalNoise" as const,
              numOctaves: 2,
              result: "noise",
              seed: 7,
              stitchTiles: "stitch" as const,
              type: "turbulence" as const,
            },
            {
              in: "SourceGraphic",
              in2: "noise",
              scale: 12,
              type: "displacementMap" as const,
              xChannelSelector: "R" as const,
              yChannelSelector: "G" as const,
            },
          ],
          type: "filter" as const,
          width: 1.4,
          x: -0.2,
          y: -0.5,
        },
      ],
      marks: base.marks.map((mark) => ({ ...mark, filter: filterId })),
    };
  }, [data]);

  return (
    <MicrovizSvg
      aria-hidden
      className={`${VIZ_CLASS} overflow-hidden rounded`}
      model={model}
      role="presentation"
    />
  );
};

// 30. Pixel Grid
export const PixelGrid: FC<{ data: Segment[] }> = ({ data }) => {
  const model = computeModel({
    data,
    size: { height: 32, width: 200 },
    spec: { type: "pixel-grid" },
  });
  return (
    <MicrovizSvg
      aria-hidden
      className={VIZ_CLASS}
      model={model}
      role="presentation"
    />
  );
};

// 31. Barcode Strip
export const BarcodeStrip: FC<{ data: Segment[] }> = ({ data }) => {
  const model = computeModel({
    data,
    size: { height: 32, width: 200 },
    spec: { type: "barcode" },
  });
  return (
    <MicrovizSvg
      aria-hidden
      className={VIZ_CLASS}
      model={model}
      role="presentation"
    />
  );
};

// 32. Waveform Bars
export const WaveformBars: FC<{ series: number[] }> = ({ series }) => {
  const model = computeModel({
    data: series,
    size: { height: 32, width: 200 },
    spec: { type: "waveform" },
  });
  return (
    <MicrovizSvg
      aria-hidden
      className={VIZ_CLASS}
      model={model}
      role="presentation"
    />
  );
};

// 33. Dot Cascade
export const RankedDotCascade: FC<{ data: Segment[] }> = ({ data }) => {
  const model = computeModel({
    data,
    size: { height: 32, width: 200 },
    spec: { type: "dot-cascade" },
  });
  return (
    <MicrovizSvg
      aria-hidden
      className={VIZ_CLASS}
      model={model}
      role="presentation"
    />
  );
};

// 34. Mosaic
export const MosaicBar: FC<{ data: Segment[] }> = ({ data }) => {
  const model = computeModel({
    data,
    size: { height: 32, width: 200 },
    spec: { type: "mosaic" },
  });
  return (
    <MicrovizSvg
      aria-hidden
      className={`${VIZ_CLASS} overflow-hidden rounded`}
      model={model}
      role="presentation"
    />
  );
};

// 35. Concentric Arcs
export const ConcentricArcsHoriz: FC<{ data: Segment[] }> = ({ data }) => {
  const model = computeModel({
    data,
    size: { height: 32, width: 200 },
    spec: {
      maxArcs: 4,
      step: 10,
      strokeWidth: 3,
      type: "concentric-arcs-horiz",
    },
  });

  return (
    <MicrovizSvg
      aria-hidden
      className={`${VIZ_CLASS} overflow-hidden`}
      model={model}
      role="presentation"
    />
  );
};

// 36. Split Ribbon
export const SplitRibbon: FC<{ data: Segment[] }> = ({ data }) => {
  const model = computeModel({
    data,
    size: { height: 32, width: 200 },
    spec: { gap: 1, ribbonGap: 1, type: "split-ribbon" },
  });
  return (
    <MicrovizSvg
      aria-hidden
      className={`${VIZ_CLASS} overflow-hidden rounded`}
      model={model}
      role="presentation"
    />
  );
};

// 37. Micro Heatline
export const MicroHeatline: FC<{ data: Segment[] }> = ({ data }) => {
  const model = computeModel({
    data,
    size: { height: 32, width: 200 },
    spec: { type: "micro-heatline" },
  });

  return (
    <MicrovizSvg
      aria-hidden
      className={VIZ_CLASS}
      model={model}
      role="presentation"
    />
  );
};

// 38. Radial Burst
export const RadialBurst: FC<{ data: Segment[] }> = ({ data }) => {
  const model = computeModel({
    data,
    size: { height: 32, width: 200 },
    spec: { pad: 0, type: "radial-burst" },
  });
  return (
    <div className={`relative ${VIZ_CLASS} overflow-hidden`}>
      <MicrovizSvg
        aria-hidden
        className="h-full w-full"
        model={model}
        role="presentation"
      />
    </div>
  );
};

// ============================================
// SECTION 1: SVG MICRO-CHARTS (7)
// ============================================

// 39. Sparkline
export const Sparkline: FC<{ series: number[]; color: string }> = ({
  series,
  color,
}) => {
  const model = computeModel({
    data: series,
    size: { height: 32, width: 200 },
    spec: { type: "sparkline" },
  });

  return (
    <MicrovizSvg
      aria-hidden
      className={VIZ_CLASS}
      model={model}
      role="presentation"
      style={
        {
          "--mv-series-1": color,
          "--mv-stroke-width": "2.2px",
        } as CSSProperties
      }
    />
  );
};

// 40. Spark Area
export const SparkArea: FC<{ series: number[]; color: string }> = ({
  series,
  color,
}) => {
  const model = computeModel({
    data: series,
    size: { height: 32, width: 200 },
    spec: { type: "spark-area" },
  });

  return (
    <MicrovizSvg
      aria-hidden
      className={VIZ_CLASS}
      model={model}
      role="presentation"
      style={{ "--mv-series-1": color } as CSSProperties}
    />
  );
};

// 41. Mini Histogram
export const MiniHistogram: FC<{
  series: number[];
  color: string;
  opacities?: number[];
}> = ({ series, color, opacities }) => {
  const model = computeModel({
    data: { opacities, series },
    size: { height: 32, width: 200 },
    spec: { type: "histogram" },
  });

  return (
    <MicrovizSvg
      aria-hidden
      className={VIZ_CLASS}
      model={model}
      role="presentation"
      style={{ "--mv-series-1": color } as CSSProperties}
    />
  );
};

// 41b. Activity Cadence (CSS - exact HUD replica)
export const ActivityCadence: FC<{
  series: number[];
  color: string;
  opacities?: number[];
}> = ({ series, color, opacities }) => {
  const sampled = series.slice(-40);
  const opStart = Math.max(0, series.length - 40);
  const max = Math.max(...sampled, 1);

  const cadenceSeries = sampled.map((v) => ((v ?? 0) / max) * 100);
  const cadenceOpacities = sampled.map((v, i) => {
    const srcIdx = opStart + i;
    const t = max === 0 ? 0 : (v ?? 0) / max;
    const baseOp = 0.22 + t * 0.78;
    const fadeOp = opacities ? (opacities[srcIdx] ?? 1) : 1;
    return baseOp * fadeOp;
  });

  const model = computeModel({
    data: { opacities: cadenceOpacities, series: cadenceSeries },
    size: { height: 32, width: 200 },
    spec: {
      barRadius: 1,
      bins: Math.max(1, cadenceSeries.length),
      className: T,
      gap: 4,
      pad: 0,
      type: "histogram",
    },
  });

  return (
    <MicrovizSvg
      aria-hidden
      className={VIZ_CLASS}
      model={model}
      role="presentation"
      style={{ "--mv-series-1": color } as CSSProperties}
    />
  );
};

// 41c. Activity Cadence Tight (CSS variant - denser)
export const ActivityCadenceTight: FC<{
  series: number[];
  color: string;
  opacities?: number[];
}> = ({ series, color, opacities }) => {
  const sampled = series.slice(-60);
  const opStart = Math.max(0, series.length - 60);
  const max = Math.max(...sampled, 1);

  const cadenceSeries = sampled.map((v) => ((v ?? 0) / max) * 100);
  const cadenceOpacities = sampled.map((v, i) => {
    const srcIdx = opStart + i;
    const t = max === 0 ? 0 : (v ?? 0) / max;
    const baseOp = 0.3 + t * 0.7;
    const fadeOp = opacities ? (opacities[srcIdx] ?? 1) : 1;
    return baseOp * fadeOp;
  });

  const model = computeModel({
    data: { opacities: cadenceOpacities, series: cadenceSeries },
    size: { height: 32, width: 200 },
    spec: {
      bins: Math.max(1, cadenceSeries.length),
      className: T,
      gap: 1,
      pad: 0,
      type: "histogram",
    },
  });

  return (
    <MicrovizSvg
      aria-hidden
      className={VIZ_CLASS}
      model={model}
      role="presentation"
      style={{ "--mv-series-1": color } as CSSProperties}
    />
  );
};

// 41d. Activity Cadence Dots (CSS variant - dot-matrix)
export const ActivityCadenceDots: FC<{
  series: number[];
  color: string;
  opacities?: number[];
}> = ({ series, color, opacities }) => {
  const model = computeModel({
    data: { opacities, series },
    size: { height: 32, width: 200 },
    spec: {
      className: T,
      cols: 32,
      dotRadius: 3,
      maxDots: 4,
      pad: 0,
      type: "dot-matrix",
    },
  });

  return (
    <MicrovizSvg
      aria-hidden
      className={VIZ_CLASS}
      model={model}
      role="presentation"
      style={{ "--mv-series-1": color } as CSSProperties}
    />
  );
};

// 41e. Mini Histogram Rounded (SVG variant)
export const MiniHistogramRounded: FC<{
  series: number[];
  color: string;
  opacities?: number[];
}> = ({ series, color, opacities }) => {
  const model = computeModel({
    data: { opacities, series },
    size: { height: 32, width: 200 },
    spec: { barRadius: 2, bins: 18, className: T, type: "histogram" },
  });

  return (
    <MicrovizSvg
      aria-hidden
      className={VIZ_CLASS}
      model={model}
      role="presentation"
      style={{ "--mv-series-1": color } as CSSProperties}
    />
  );
};

// 41f. Mini Histogram Gradient (SVG variant)
export const MiniHistogramGradient: FC<{
  series: number[];
  color: string;
  opacities?: number[];
}> = ({ series, color, opacities }) => {
  const model = computeModel({
    data: { opacities, series },
    size: { height: 32, width: 200 },
    spec: { bins: 18, className: T, gradient: true, type: "histogram" },
  });

  return (
    <MicrovizSvg
      aria-hidden
      className={VIZ_CLASS}
      model={model}
      role="presentation"
      style={{ "--mv-series-1": color } as CSSProperties}
    />
  );
};

// 41g. Mini Histogram Line (SVG variant - stepped line)
export const MiniHistogramLine: FC<{ series: number[]; color: string }> = ({
  series,
  color,
}) => {
  const bins = 24;
  const stride = Math.max(1, Math.floor(series.length / bins));
  const sampled: number[] = [];
  for (let i = 0; i < series.length; i += stride) sampled.push(series[i]);

  const model = computeModel({
    data: sampled,
    size: { height: 32, width: 200 },
    spec: { className: T, showDot: false, type: "step-line" },
  });

  return (
    <MicrovizSvg
      aria-hidden
      className={VIZ_CLASS}
      model={model}
      role="presentation"
      style={{ "--mv-series-1": color } as CSSProperties}
    />
  );
};

// 42. Range Band
export const RangeBand: FC<{
  series: number[];
  color: string;
  bandSeed: number;
}> = ({ series, color, bandSeed }) => {
  const model = computeModel({
    data: series,
    size: { height: 32, width: 200 },
    spec: { bandSeed, type: "range-band" },
  });

  return (
    <MicrovizSvg
      aria-hidden
      className={VIZ_CLASS}
      model={model}
      role="presentation"
      style={{ "--mv-series-1": color } as CSSProperties}
    />
  );
};

// 43. Bullet Delta
export const BulletDelta: FC<{
  current: number;
  previous: number;
  color: string;
}> = ({ current, previous, color }) => {
  const model = computeModel({
    data: { current, previous },
    size: { height: 32, width: 200 },
    spec: { type: "bullet-delta" },
  });

  return (
    <MicrovizSvg
      aria-hidden
      className={VIZ_CLASS}
      model={model}
      role="presentation"
      style={{ "--mv-series-1": color } as CSSProperties}
    />
  );
};

// 44. Dumbbell Compare
export const DumbbellCompare: FC<{
  current: number;
  target: number;
  color: string;
}> = ({ current, target, color }) => {
  const model = computeModel({
    data: { current, target },
    size: { height: 32, width: 200 },
    spec: { type: "dumbbell" },
  });

  return (
    <MicrovizSvg
      aria-hidden
      className={VIZ_CLASS}
      model={model}
      role="presentation"
      style={{ "--mv-series-1": color } as CSSProperties}
    />
  );
};

// 45. Micro Heatgrid
export const MicroHeatgrid: FC<{
  series: number[];
  color: string;
  opacities?: number[];
}> = ({ series, color, opacities }) => {
  const model = computeModel({
    data: { opacities, series },
    size: { height: 32, width: 200 },
    spec: { cols: 12, rows: 4, type: "heatgrid" },
  });

  return (
    <MicrovizSvg
      aria-hidden
      className={VIZ_CLASS}
      model={model}
      role="presentation"
      style={{ "--mv-series-1": color } as CSSProperties}
    />
  );
};

// ============================================
// UI COMPONENTS
// ============================================

const DemoContent: FC<{ children: ReactNode }> = ({ children }) => (
  <div className="flex flex-col gap-6">{children}</div>
);

export const Tag: FC<{ children: ReactNode }> = ({ children }) => (
  <span className="rounded bg-slate-200/80 dark:bg-slate-800/80 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-slate-600 dark:text-slate-400 border border-slate-300/50 dark:border-slate-700/50">
    {children}
  </span>
);

interface VizCardProps {
  title: string;
  tags?: string[];
  children: ReactNode;
}

export const VizCard: FC<VizCardProps> = ({ title, children, tags = [] }) => (
  <div className="flex flex-col gap-2 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/30 p-3 transition-all hover:bg-slate-50 dark:hover:bg-slate-800/60">
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
        {title}
      </span>
      <div className="flex gap-1">
        {tags.map((t) => (
          <Tag key={t}>{t}</Tag>
        ))}
      </div>
    </div>
    <div className="flex min-h-[4rem] items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-900/50 p-3">
      {children}
    </div>
  </div>
);

export const SectionHeader: FC<{
  title: string;
  description: string;
  isFirst?: boolean;
}> = ({ title, description, isFirst = false }) => (
  <div
    className={[
      "mb-4 border-b border-slate-200 pb-2 dark:border-slate-800/50",
      isFirst ? "mt-0" : "mt-8",
    ].join(" ")}
  >
    <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
      <span className="h-4 w-1 rounded-full bg-blue-500" />
      {title}
    </h3>
    <p className="ml-3 mt-1 text-xs text-slate-500 dark:text-slate-500">
      {description}
    </p>
  </div>
);

export const Legend: FC<{ data: Segment[] }> = ({ data }) => (
  <div className="flex flex-wrap gap-x-4 gap-y-1">
    {data.map((item) => (
      <div className="flex items-center gap-1.5" key={item.name}>
        <div
          className="h-2.5 w-2.5 rounded-full shadow-sm"
          style={{ backgroundColor: item.color }}
        />
        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
          {item.name}
        </span>
        <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">
          {item.pct.toFixed(0)}%
        </span>
      </div>
    ))}
  </div>
);

type VirtualBlock = {
  key: string;
  node: ReactNode;
  estimateSize?: number;
};

type GridColumns = {
  base: number;
  sm?: number;
  lg?: number;
};

type GridSection = {
  key: string;
  title: string;
  description: string;
  gridClassName: string;
  rowGapClass: string;
  columns: GridColumns;
  estimateRowSize?: number;
  cards: ReactNode[];
};

const DEFAULT_VIEWPORT_WIDTH = 1024;
const TAILWIND_SM = 640;
const TAILWIND_LG = 1024;

function useViewportWidth(): number {
  const [width, setWidth] = useState(() =>
    typeof window === "undefined" ? DEFAULT_VIEWPORT_WIDTH : window.innerWidth,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return width;
}

function resolveColumns(width: number, columns: GridColumns): number {
  if (width >= TAILWIND_LG) return columns.lg ?? columns.sm ?? columns.base;
  if (width >= TAILWIND_SM) return columns.sm ?? columns.base;
  return columns.base;
}

function chunkRows<T>(items: readonly T[], columns: number): T[][] {
  const rows: T[][] = [];
  const step = Math.max(columns, 1);
  for (let i = 0; i < items.length; i += step) {
    rows.push(items.slice(i, i + step));
  }
  return rows;
}

function buildSectionBlocks(
  sections: readonly GridSection[],
  width: number,
): VirtualBlock[] {
  const blocks: VirtualBlock[] = [];

  sections.forEach((section, sectionIndex) => {
    blocks.push({
      estimateSize: 72,
      key: `${section.key}-header`,
      node: (
        <SectionHeader
          description={section.description}
          isFirst={sectionIndex === 0}
          title={section.title}
        />
      ),
    });

    const cols = resolveColumns(width, section.columns);
    const rows = chunkRows(section.cards, cols);
    rows.forEach((row, rowIndex) => {
      const isLast = rowIndex === rows.length - 1;
      const rowClassName = [
        section.gridClassName,
        isLast ? "" : section.rowGapClass,
      ]
        .filter(Boolean)
        .join(" ");

      blocks.push({
        estimateSize: section.estimateRowSize ?? 200,
        key: `${section.key}-row-${rowIndex}`,
        node: <div className={rowClassName}>{row}</div>,
      });
    });
  });

  return blocks;
}

// ============================================
// MAIN DEMO COMPONENT
// ============================================

export const MicroVizDemo: FC<{
  distribution?: Segment[];
  months?: Array<{ label: string; count: number }>;
  years?: Array<{ label: string; count: number }>;
  getScrollElement?: () => HTMLElement | null;
}> = ({
  distribution = DEMO_DISTRIBUTION,
  months = DEMO_TIMELINE_MONTHS,
  years = DEMO_TIMELINE_YEARS,
  getScrollElement,
}) => {
  const [maxSlices, setMaxSlices] = useState(5);

  // Time granularity controls for Section 9-10
  const [timeGranularity, setTimeGranularity] = useState<"months" | "years">(
    "years",
  );
  const [skipEmpty, setSkipEmpty] = useState(false);
  const [fadeLight, setFadeLight] = useState(true);
  const [lightThreshold, setLightThreshold] = useState(20);

  // Transform distribution data to Segment[]
  const rawData = useMemo((): Segment[] => {
    const base = distribution.slice(0, Math.max(1, maxSlices));
    const total = base.reduce((sum, seg) => sum + seg.pct, 0);
    if (total === 0) return [];
    return base.map((seg) => ({
      ...seg,
      pct: (seg.pct / total) * 100,
    }));
  }, [distribution, maxSlices]);

  const data = useMemo(
    () =>
      [...rawData].sort(
        (a, b) => b.pct - a.pct || a.name.localeCompare(b.name),
      ),
    [rawData],
  );
  // Transform months to series for SVG charts
  const monthSeries = useMemo(() => {
    if (months.length === 0) return [];
    const max = Math.max(...months.map((m) => m.count), 1);
    return months.map((m) => (m.count / max) * 100);
  }, [months]);

  // Unified series data supporting months/years granularity with filtering
  const seriesData = useMemo(() => {
    const raw =
      timeGranularity === "months"
        ? months.map((m) => ({
            count: m.count,
            label: m.label,
          }))
        : years.map((y) => ({
            count: y.count,
            label: y.label,
          }));

    // Skip empty if enabled
    const filtered = skipEmpty ? raw.filter((d) => d.count > 0) : raw;
    if (filtered.length === 0) return [];

    // Normalize to 0-100
    const max = Math.max(...filtered.map((d) => d.count), 1);
    return filtered.map((d) => ({
      ...d,
      isLight: (d.count / max) * 100 < lightThreshold,
      value: (d.count / max) * 100,
    }));
  }, [months, years, timeGranularity, skipEmpty, lightThreshold]);

  // Simple series values for chart components (number[])
  const seriesValues = useMemo(
    () => seriesData.map((d) => d.value),
    [seriesData],
  );

  const seriesRange = useMemo(() => getDemoRange(seriesValues), [seriesValues]);

  // Opacity array for fading light values
  const seriesOpacities = useMemo(
    () => seriesData.map((d) => (fadeLight && d.isLight ? 0.35 : 1)),
    [seriesData, fadeLight],
  );

  // Primary color for SVG charts
  const primaryColor = data[0]?.color ?? FALLBACK_COLOR;

  // Derived values for delta/compare charts
  const current = seriesRange.max;
  const previous = seriesRange.min;
  const target = seriesRange.min;
  const bandSeed = useMemo(
    () => months.reduce((acc, m) => acc + m.count, 0) % 1000,
    [months],
  );
  const viewportWidth = useViewportWidth();

  if (data.length === 0) {
    return (
      <DemoContent>
        <div className="text-center text-slate-500 py-8">
          No language data available. Apply filters to see visualizations.
        </div>
      </DemoContent>
    );
  }

  const sections: GridSection[] = [
    {
      cards: [
        <VizCard key="sparkline" tags={["SVG", "Trend"]} title="Sparkline">
          <Sparkline color={primaryColor} series={seriesValues} />
        </VizCard>,
        <VizCard key="spark-area" tags={["SVG", "Area"]} title="Spark Area">
          <SparkArea color={primaryColor} series={seriesValues} />
        </VizCard>,
        <VizCard
          key="mini-histogram"
          tags={["SVG", "Bars"]}
          title="Mini Histogram"
        >
          <MiniHistogram
            color={primaryColor}
            opacities={seriesOpacities}
            series={seriesValues}
          />
        </VizCard>,
        <VizCard key="range-band" tags={["SVG", "Min/Max"]} title="Range Band">
          <RangeBand
            bandSeed={bandSeed}
            color={primaryColor}
            series={seriesValues}
          />
        </VizCard>,
        <VizCard key="heatgrid" tags={["SVG", "Calendar"]} title="Heatgrid">
          <MicroHeatgrid
            color={primaryColor}
            opacities={seriesOpacities}
            series={seriesValues}
          />
        </VizCard>,
        <VizCard
          key="bullet-delta"
          tags={["SVG", "Delta"]}
          title="Bullet Delta"
        >
          <BulletDelta
            color={primaryColor}
            current={current}
            previous={previous}
          />
        </VizCard>,
        <VizCard key="dumbbell" tags={["SVG", "Compare"]} title="Dumbbell">
          <DumbbellCompare
            color={primaryColor}
            current={data[0]?.pct ?? 50}
            target={target}
          />
        </VizCard>,
      ],
      columns: { base: 1, lg: 4, sm: 2 },
      description:
        "Compact SVG charts for time series (use controls above to switch months/years)",
      gridClassName: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
      key: "micro-charts",
      rowGapClass: "mb-4",
      title: "1. Micro-Charts (SVG)",
    },
    {
      cards: [
        <VizCard
          key="activity-cadence"
          tags={["CSS", "HUD"]}
          title="Activity Cadence"
        >
          <ActivityCadence
            color={primaryColor}
            opacities={seriesOpacities}
            series={seriesValues}
          />
        </VizCard>,
        <VizCard key="tight-bars" tags={["CSS", "Dense"]} title="Tight Bars">
          <ActivityCadenceTight
            color={primaryColor}
            opacities={seriesOpacities}
            series={seriesValues}
          />
        </VizCard>,
        <VizCard key="dot-matrix" tags={["CSS", "Dots"]} title="Dot Matrix">
          <ActivityCadenceDots
            color={primaryColor}
            opacities={seriesOpacities}
            series={seriesValues}
          />
        </VizCard>,
        <VizCard
          key="rounded-bars"
          tags={["SVG", "Rounded"]}
          title="Rounded Bars"
        >
          <MiniHistogramRounded
            color={primaryColor}
            opacities={seriesOpacities}
            series={seriesValues}
          />
        </VizCard>,
        <VizCard
          key="gradient-bars"
          tags={["SVG", "Gradient"]}
          title="Gradient Bars"
        >
          <MiniHistogramGradient
            color={primaryColor}
            opacities={seriesOpacities}
            series={seriesValues}
          />
        </VizCard>,
        <VizCard key="step-line" tags={["SVG", "Stepped"]} title="Step Line">
          <MiniHistogramLine color={primaryColor} series={seriesValues} />
        </VizCard>,
      ],
      columns: { base: 1, lg: 4, sm: 2 },
      description:
        "Histogram and bar chart variants (use controls above to switch months/years)",
      gridClassName: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
      key: "activity",
      rowGapClass: "mb-4",
      title: "2. Activity Cadence",
    },
    {
      cards: [
        <VizCard key="bitfield" tags={["Mask"]} title="Bitfield">
          <BitfieldBar data={data} />
        </VizCard>,
        <VizCard
          key="stripe-density"
          tags={["Repeating"]}
          title="Stripe Density"
        >
          <StripeDensity data={data} />
        </VizCard>,
        <VizCard key="gradient-fade" tags={["Gradient"]} title="Gradient Fade">
          <GradientFade data={data} />
        </VizCard>,
        <VizCard
          key="noise-displacement"
          tags={["SVG Filter"]}
          title="Noise Displacement"
        >
          <NoiseDisplacement data={data} />
        </VizCard>,
        <VizCard key="perforated" tags={["Stitched"]} title="Perforated">
          <PerforatedBar data={data} />
        </VizCard>,
        <VizCard key="masked-wave" tags={["SVG Mask"]} title="Masked Wave">
          <MaskedWaveformStrip data={data} />
        </VizCard>,
      ],
      columns: { base: 1, lg: 3, sm: 2 },
      description: "CSS masks, gradients, and visual effects",
      gridClassName: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
      key: "texture",
      rowGapClass: "mb-4",
      title: "3. Texture & Creative",
    },
    {
      cards: [
        <VizCard key="pixel-grid" tags={["32 Cells"]} title="Pixel Grid">
          <PixelGrid data={data} />
        </VizCard>,
        <VizCard key="barcode" tags={["48 Bins"]} title="Barcode">
          <BarcodeStrip data={data} />
        </VizCard>,
        <VizCard key="waveform" tags={["Discrete"]} title="Waveform">
          <WaveformBars series={monthSeries} />
        </VizCard>,
        <VizCard key="dot-cascade" tags={["Scatter"]} title="Dot Cascade">
          <RankedDotCascade data={data} />
        </VizCard>,
      ],
      columns: { base: 1, lg: 4, sm: 2 },
      description: "Quantized views using dots and pixels",
      gridClassName: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
      key: "grid",
      rowGapClass: "mb-4",
      title: "4. Discrete & Grid",
    },
    {
      cards: [
        <VizCard key="mosaic" tags={["Long-Tail"]} title="Mosaic">
          <MosaicBar data={data} />
        </VizCard>,
        <VizCard
          key="concentric-arcs"
          tags={["Border"]}
          title="Concentric Arcs"
        >
          <ConcentricArcsHoriz data={data} />
        </VizCard>,
        <VizCard key="split-ribbon" tags={["Top/Bottom"]} title="Split Ribbon">
          <SplitRibbon data={data} />
        </VizCard>,
        <VizCard key="micro-heatline" tags={["Minimal"]} title="Micro Heatline">
          <MicroHeatline data={data} />
        </VizCard>,
        <VizCard key="radial-burst" tags={["Conic"]} title="Radial Burst">
          <RadialBurst data={data} />
        </VizCard>,
      ],
      columns: { base: 1, lg: 3, sm: 2 },
      description: "Unique approaches for specific contexts",
      gridClassName: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
      key: "specialty",
      rowGapClass: "mb-4",
      title: "5. Specialty Patterns",
    },
    {
      cards: [
        <VizCard key="stacked-bar" tags={["Gradient"]} title="Stacked Bar">
          <StackedBar data={data} />
        </VizCard>,
        <VizCard key="segmented-bar" tags={["Flex"]} title="Segmented Bar">
          <SegmentedBar data={data} />
        </VizCard>,
        <VizCard key="progress-pills" tags={["Rounded"]} title="Progress Pills">
          <ProgressPills data={data} />
        </VizCard>,
        <VizCard key="dot-row" tags={["Discrete"]} title="Dot Row">
          <DotRow data={data} />
        </VizCard>,
      ],
      columns: { base: 1, lg: 4, sm: 2 },
      description: "Classic, reliable approaches for any context",
      gridClassName: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
      key: "foundational",
      rowGapClass: "mb-4",
      title: "6. Foundational Patterns",
    },
    {
      cards: [
        <VizCard key="skyline" tags={["Height"]} title="Skyline">
          <SkylineBar data={data} />
        </VizCard>,
        <VizCard key="cascade-steps" tags={["Waterfall"]} title="Cascade Steps">
          <CascadeSteps data={data} />
        </VizCard>,
        <VizCard key="ranked-lanes" tags={["Ladder"]} title="Ranked Lanes">
          <RankedLanes data={data} />
        </VizCard>,
        <VizCard key="lollipop" tags={["Dots"]} title="Lollipop">
          <LollipopSkyline data={data} />
        </VizCard>,
        <VizCard
          key="variable-ribbon"
          tags={["Thickness"]}
          title="Variable Ribbon"
        >
          <VariableRibbon data={data} />
        </VizCard>,
        <VizCard key="faded-pyramid" tags={["Gradient"]} title="Faded Pyramid">
          <FadedPyramid data={data} />
        </VizCard>,
      ],
      columns: { base: 1, lg: 3, sm: 2 },
      description: "Emphasize ranking and dominance structure",
      gridClassName: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
      key: "hierarchy",
      rowGapClass: "mb-4",
      title: "7. Hierarchy-First",
    },
    {
      cards: [
        <VizCard key="pipeline" tags={["Clip-Path"]} title="Pipeline">
          <PipelineBar data={data} />
        </VizCard>,
        <VizCard key="chevron" tags={["Overlap"]} title="Chevron">
          <ChevronSegments data={data} />
        </VizCard>,
        <VizCard key="tapered" tags={["Clip-Path"]} title="Tapered">
          <TaperedBar data={data} />
        </VizCard>,
        <VizCard key="interlocking" tags={["Clip-Path"]} title="Interlocking">
          <InterlockingBlocks data={data} />
        </VizCard>,
        <VizCard key="dna-helix" tags={["Alternating"]} title="DNA Helix">
          <DNAHelix data={data} />
        </VizCard>,
      ],
      columns: { base: 1, lg: 3, sm: 2 },
      description: "Imply workflow, progression, or dependencies",
      gridClassName: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
      key: "flow",
      rowGapClass: "mb-4",
      title: "8. Flow & Direction",
    },
    {
      cards: [
        <VizCard key="matryoshka" tags={["Z-Stack"]} title="Matryoshka">
          <MatryoshkaBar data={data} />
        </VizCard>,
        <VizCard key="layered-waves" tags={["Overlap"]} title="Layered Waves">
          <LayeredWaves data={data} />
        </VizCard>,
        <VizCard key="hand-of-cards" tags={["Shadow"]} title="Hand of Cards">
          <HandOfCards data={data} />
        </VizCard>,
        <VizCard key="shadow-depth" tags={["Box-Shadow"]} title="Shadow Depth">
          <ShadowDepth data={data} />
        </VizCard>,
        <VizCard key="stepped-area" tags={["Absolute"]} title="Stepped Area">
          <SteppedArea data={data} />
        </VizCard>,
      ],
      columns: { base: 1, lg: 3, sm: 2 },
      description: "Use Z-axis and stacking to manage space",
      gridClassName: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
      key: "depth",
      rowGapClass: "mb-4",
      title: "9. Depth & Layering",
    },
    {
      cards: [
        <VizCard key="pareto" tags={["Cumulative"]} title="Pareto">
          <ParetoBar data={data} />
        </VizCard>,
        <VizCard key="bullet-gauge" tags={["Midpoint"]} title="Bullet Gauge">
          <BulletGauge data={data} />
        </VizCard>,
        <VizCard key="two-tier" tags={["Redundant"]} title="Two-Tier">
          <TwoTierBar data={data} />
        </VizCard>,
        <VizCard key="split-pareto" tags={["80/20"]} title="Split-Pareto">
          <SplitPareto data={data} />
        </VizCard>,
      ],
      columns: { base: 1, lg: 4, sm: 2 },
      description: "Show cumulative impact and comparisons",
      gridClassName: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
      key: "analytical",
      rowGapClass: "mb-4",
      title: "10. Analytical Patterns",
    },
  ];

  const sectionBlocks = buildSectionBlocks(sections, viewportWidth);

  return (
    <DemoContent>
      {/* Header */}
      <div className="mb-4">
        <h2 className="mb-1 text-2xl font-bold text-slate-900 dark:text-white">
          Micro-Visualization Patterns
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          46 patterns: 38 CSS distribution + 7 SVG micro-charts + 1 SVG filter
          fixture. Real MobX data from your CV.
        </p>
      </div>

      {/* Sticky controls + legend */}
      <div className="sticky top-0 z-20 -mx-1 sm:-mx-2">
        <div className="border-y border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm">
          <div className="overflow-x-auto">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2 sm:flex-nowrap sm:gap-4 sm:min-w-max">
              {/* Max Slices */}
              <div className="flex items-center gap-2 shrink-0">
                <label
                  className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap"
                  htmlFor="maxSlices"
                >
                  Slices:
                </label>
                <input
                  className="w-16 accent-blue-500"
                  id="maxSlices"
                  max={6}
                  min={3}
                  onChange={(e) => setMaxSlices(Number(e.target.value))}
                  title={`Slices: ${maxSlices}`}
                  type="range"
                  value={maxSlices}
                />
                <span className="w-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                  {maxSlices}
                </span>
              </div>

              {/* Divider */}
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-600 shrink-0" />

              {/* Granularity */}
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  Granularity:
                </span>
                <label className="flex cursor-pointer items-center gap-1.5">
                  <input
                    checked={timeGranularity === "months"}
                    className="text-blue-500"
                    name="granularity"
                    onChange={(e) =>
                      setTimeGranularity(e.target.value as "months" | "years")
                    }
                    title="Months"
                    type="radio"
                    value="months"
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Months
                  </span>
                </label>
                <label className="flex cursor-pointer items-center gap-1.5">
                  <input
                    checked={timeGranularity === "years"}
                    className="text-blue-500"
                    name="granularity"
                    onChange={(e) =>
                      setTimeGranularity(e.target.value as "months" | "years")
                    }
                    title="Years"
                    type="radio"
                    value="years"
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Years
                  </span>
                </label>
              </div>

              {/* Divider */}
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-600 shrink-0" />

              {/* Skip Empty */}
              <label className="flex cursor-pointer items-center gap-1.5 shrink-0">
                <input
                  checked={skipEmpty}
                  className="rounded text-blue-500"
                  onChange={(e) => setSkipEmpty(e.target.checked)}
                  title="Skip empty"
                  type="checkbox"
                />
                <span className="text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                  Skip empty
                </span>
              </label>

              {/* Fade Light */}
              <label className="flex cursor-pointer items-center gap-1.5 shrink-0">
                <input
                  checked={fadeLight}
                  className="rounded text-blue-500"
                  onChange={(e) => setFadeLight(e.target.checked)}
                  title="Fade light"
                  type="checkbox"
                />
                <span className="text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                  Fade light
                </span>
              </label>

              {/* Threshold Slider */}
              <div className="flex items-center gap-2 shrink-0">
                <label
                  className="text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap"
                  htmlFor="threshold"
                >
                  Threshold:
                </label>
                <input
                  className="w-24 accent-blue-500"
                  disabled={!fadeLight}
                  id="threshold"
                  max={50}
                  min={5}
                  onChange={(e) => setLightThreshold(Number(e.target.value))}
                  title={`Threshold: ${lightThreshold}%`}
                  type="range"
                  value={lightThreshold}
                />
                <span className="w-8 font-mono text-xs text-slate-500 dark:text-slate-400">
                  {lightThreshold}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4 border-b border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm">
          <div className="px-3 py-2">
            <Legend data={data} />
          </div>
        </div>
      </div>

      <VirtualizedStack
        blocks={sectionBlocks}
        getScrollElement={getScrollElement}
      />
    </DemoContent>
  );
};
