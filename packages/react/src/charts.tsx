import type {
  BarData,
  BarSpec,
  BitfieldData,
  BitfieldSpec,
  ComputeModelInput,
  HeatgridData,
  HeatgridSpec,
  HistogramData,
  HistogramSpec,
  RenderModel,
  Size,
  SparklineData,
  SparklineSpec,
} from "@microviz/core";
import { computeModel } from "@microviz/core";
import type { RenderCanvasOptions } from "@microviz/renderers";
import type { ReactNode } from "react";
import {
  MicrovizCanvas,
  type MicrovizCanvasProps,
  MicrovizSvg,
  type MicrovizSvgProps,
  MicrovizSvgString,
  type MicrovizSvgStringProps,
} from "./model";

export type MicrovizRenderer = "svg" | "svg-string" | "canvas";

export type MicrovizChartProps = {
  input: ComputeModelInput;
  renderer?: MicrovizRenderer;
  canvasOptions?: RenderCanvasOptions;
  svgProps?: Omit<MicrovizSvgProps, "model">;
  svgStringProps?: Omit<MicrovizSvgStringProps, "model">;
  canvasProps?: Omit<MicrovizCanvasProps, "model">;
};

export function MicrovizChart({
  canvasOptions,
  canvasProps,
  input,
  renderer = "svg",
  svgProps,
  svgStringProps,
}: MicrovizChartProps): ReactNode {
  const model = computeModel(input);

  if (renderer === "svg") return <MicrovizSvg model={model} {...svgProps} />;
  if (renderer === "svg-string")
    return <MicrovizSvgString model={model} {...svgStringProps} />;
  return (
    <MicrovizCanvas model={model} options={canvasOptions} {...canvasProps} />
  );
}

export type SparklineProps = {
  data: SparklineData;
  size?: Size;
  width?: number;
  height?: number;
  pad?: SparklineSpec["pad"];
  showDot?: SparklineSpec["showDot"];
  dotRadius?: SparklineSpec["dotRadius"];
  markClassName?: SparklineSpec["className"];
} & Omit<MicrovizChartProps, "input">;

export function Sparkline({
  data,
  dotRadius,
  height,
  markClassName,
  pad,
  showDot,
  size,
  width,
  ...rest
}: SparklineProps): ReactNode {
  const spec: SparklineSpec = {
    className: markClassName,
    dotRadius,
    pad,
    showDot,
    type: "sparkline",
  };
  const resolvedSize: Size = size ?? {
    height: height ?? 32,
    width: width ?? 200,
  };
  const input: ComputeModelInput<SparklineSpec> = {
    data,
    size: resolvedSize,
    spec,
  };
  return <MicrovizChart input={input} {...rest} />;
}

export type BarProps = {
  data: BarData;
  size?: Size;
  width?: number;
  height?: number;
  pad?: BarSpec["pad"];
  markClassName?: BarSpec["className"];
} & Omit<MicrovizChartProps, "input">;

export function Bar({
  data,
  height,
  markClassName,
  pad,
  size,
  width,
  ...rest
}: BarProps): ReactNode {
  const spec: BarSpec = { className: markClassName, pad, type: "bar" };
  const resolvedSize: Size = size ?? {
    height: height ?? 32,
    width: width ?? 200,
  };
  const input: ComputeModelInput<BarSpec> = { data, size: resolvedSize, spec };
  return <MicrovizChart input={input} {...rest} />;
}

export type MiniHistogramProps = {
  data: HistogramData;
  size?: Size;
  width?: number;
  height?: number;
  pad?: HistogramSpec["pad"];
  bins?: HistogramSpec["bins"];
  barRadius?: HistogramSpec["barRadius"];
  markClassName?: HistogramSpec["className"];
} & Omit<MicrovizChartProps, "input">;

export function MiniHistogram({
  barRadius,
  bins,
  data,
  height,
  markClassName,
  pad,
  size,
  width,
  ...rest
}: MiniHistogramProps): ReactNode {
  const spec: HistogramSpec = {
    barRadius,
    bins,
    className: markClassName,
    pad,
    type: "histogram",
  };
  const resolvedSize: Size = size ?? {
    height: height ?? 32,
    width: width ?? 200,
  };
  const input: ComputeModelInput<HistogramSpec> = {
    data,
    size: resolvedSize,
    spec,
  };
  return <MicrovizChart input={input} {...rest} />;
}

export type HeatgridProps = {
  data: HeatgridData;
  size?: Size;
  width?: number;
  height?: number;
  pad?: HeatgridSpec["pad"];
  cols?: HeatgridSpec["cols"];
  rows?: HeatgridSpec["rows"];
  markClassName?: HeatgridSpec["className"];
} & Omit<MicrovizChartProps, "input">;

export function Heatgrid({
  cols,
  data,
  height,
  markClassName,
  pad,
  rows,
  size,
  width,
  ...rest
}: HeatgridProps): ReactNode {
  const spec: HeatgridSpec = {
    className: markClassName,
    cols,
    pad,
    rows,
    type: "heatgrid",
  };
  const resolvedSize: Size = size ?? {
    height: height ?? 32,
    width: width ?? 200,
  };
  const input: ComputeModelInput<HeatgridSpec> = {
    data,
    size: resolvedSize,
    spec,
  };
  return <MicrovizChart input={input} {...rest} />;
}

export type BitfieldProps = {
  data: BitfieldData;
  size?: Size;
  width?: number;
  height?: number;
  pad?: BitfieldSpec["pad"];
  cellSize?: BitfieldSpec["cellSize"];
  dotRadius?: BitfieldSpec["dotRadius"];
  markClassName?: BitfieldSpec["className"];
} & Omit<MicrovizChartProps, "input">;

export function Bitfield({
  cellSize,
  data,
  dotRadius,
  height,
  markClassName,
  pad,
  size,
  width,
  ...rest
}: BitfieldProps): ReactNode {
  const spec: BitfieldSpec = {
    cellSize,
    className: markClassName,
    dotRadius,
    pad,
    type: "bitfield",
  };
  const resolvedSize: Size = size ?? {
    height: height ?? 32,
    width: width ?? 200,
  };
  const input: ComputeModelInput<BitfieldSpec> = {
    data,
    size: resolvedSize,
    spec,
  };
  return <MicrovizChart input={input} {...rest} />;
}

export type { RenderModel };
