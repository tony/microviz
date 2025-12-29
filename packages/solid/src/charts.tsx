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
import { type Component, splitProps } from "solid-js";
import { Switch, Match } from "solid-js/web";
import {
  MicrovizCanvas,
  type MicrovizCanvasProps,
  MicrovizSvg,
  type MicrovizSvgProps,
  MicrovizSvgString,
  type MicrovizSvgStringProps,
} from "./model";

export type MicrovizRenderer = "svg" | "svg-string" | "canvas";
export type MicrovizFallbackRenderer = Exclude<MicrovizRenderer, "canvas">;

export type MicrovizChartProps = {
  input: ComputeModelInput;
  renderer?: MicrovizRenderer;
  /**
   * If the Canvas renderer can't represent the model (e.g. unsupported filter
   * primitives), fall back to an SVG renderer instead of silently ignoring
   * unsupported features.
   */
  fallbackSvgWhenCanvasUnsupported?: boolean;
  /**
   * Which SVG surface to use when falling back from Canvas.
   */
  fallbackRenderer?: MicrovizFallbackRenderer;
  canvasOptions?: RenderCanvasOptions;
  svgProps?: Omit<MicrovizSvgProps, "model">;
  svgStringProps?: Omit<MicrovizSvgStringProps, "model">;
  canvasProps?: Omit<MicrovizCanvasProps, "model">;
};

export const MicrovizChart: Component<MicrovizChartProps> = (props) => {
  const model = () => computeModel(props.input);
  const renderer = () => props.renderer ?? "svg";
  const fallbackRenderer = () => props.fallbackRenderer ?? "svg";
  const fallbackSvgWhenCanvasUnsupported = () =>
    props.fallbackSvgWhenCanvasUnsupported ?? true;

  return (
    <Switch>
      <Match when={renderer() === "svg"}>
        <MicrovizSvg model={model()} {...props.svgProps} />
      </Match>
      <Match when={renderer() === "svg-string"}>
        <MicrovizSvgString model={model()} {...props.svgStringProps} />
      </Match>
      <Match when={renderer() === "canvas"}>
        <MicrovizCanvas
          fallbackRenderer={fallbackRenderer()}
          fallbackSvgWhenCanvasUnsupported={fallbackSvgWhenCanvasUnsupported()}
          model={model()}
          options={props.canvasOptions}
          {...props.canvasProps}
        />
      </Match>
    </Switch>
  );
};

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

export const Sparkline: Component<SparklineProps> = (props) => {
  const [local, rest] = splitProps(props, [
    "data",
    "dotRadius",
    "height",
    "markClassName",
    "pad",
    "showDot",
    "size",
    "width",
  ]);

  const spec = (): SparklineSpec => ({
    className: local.markClassName,
    dotRadius: local.dotRadius,
    pad: local.pad,
    showDot: local.showDot,
    type: "sparkline",
  });

  const resolvedSize = (): Size =>
    local.size ?? {
      height: local.height ?? 32,
      width: local.width ?? 200,
    };

  const input = (): ComputeModelInput<SparklineSpec> => ({
    data: local.data,
    size: resolvedSize(),
    spec: spec(),
  });

  return <MicrovizChart input={input()} {...rest} />;
};

export type BarProps = {
  data: BarData;
  size?: Size;
  width?: number;
  height?: number;
  pad?: BarSpec["pad"];
  markClassName?: BarSpec["className"];
} & Omit<MicrovizChartProps, "input">;

export const Bar: Component<BarProps> = (props) => {
  const [local, rest] = splitProps(props, [
    "data",
    "height",
    "markClassName",
    "pad",
    "size",
    "width",
  ]);

  const spec = (): BarSpec => ({
    className: local.markClassName,
    pad: local.pad,
    type: "bar",
  });

  const resolvedSize = (): Size =>
    local.size ?? {
      height: local.height ?? 32,
      width: local.width ?? 200,
    };

  const input = (): ComputeModelInput<BarSpec> => ({
    data: local.data,
    size: resolvedSize(),
    spec: spec(),
  });

  return <MicrovizChart input={input()} {...rest} />;
};

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

export const MiniHistogram: Component<MiniHistogramProps> = (props) => {
  const [local, rest] = splitProps(props, [
    "barRadius",
    "bins",
    "data",
    "height",
    "markClassName",
    "pad",
    "size",
    "width",
  ]);

  const spec = (): HistogramSpec => ({
    barRadius: local.barRadius,
    bins: local.bins,
    className: local.markClassName,
    pad: local.pad,
    type: "histogram",
  });

  const resolvedSize = (): Size =>
    local.size ?? {
      height: local.height ?? 32,
      width: local.width ?? 200,
    };

  const input = (): ComputeModelInput<HistogramSpec> => ({
    data: local.data,
    size: resolvedSize(),
    spec: spec(),
  });

  return <MicrovizChart input={input()} {...rest} />;
};

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

export const Heatgrid: Component<HeatgridProps> = (props) => {
  const [local, rest] = splitProps(props, [
    "cols",
    "data",
    "height",
    "markClassName",
    "pad",
    "rows",
    "size",
    "width",
  ]);

  const spec = (): HeatgridSpec => ({
    className: local.markClassName,
    cols: local.cols,
    pad: local.pad,
    rows: local.rows,
    type: "heatgrid",
  });

  const resolvedSize = (): Size =>
    local.size ?? {
      height: local.height ?? 32,
      width: local.width ?? 200,
    };

  const input = (): ComputeModelInput<HeatgridSpec> => ({
    data: local.data,
    size: resolvedSize(),
    spec: spec(),
  });

  return <MicrovizChart input={input()} {...rest} />;
};

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

export const Bitfield: Component<BitfieldProps> = (props) => {
  const [local, rest] = splitProps(props, [
    "cellSize",
    "data",
    "dotRadius",
    "height",
    "markClassName",
    "pad",
    "size",
    "width",
  ]);

  const spec = (): BitfieldSpec => ({
    cellSize: local.cellSize,
    className: local.markClassName,
    dotRadius: local.dotRadius,
    pad: local.pad,
    type: "bitfield",
  });

  const resolvedSize = (): Size =>
    local.size ?? {
      height: local.height ?? 32,
      width: local.width ?? 200,
    };

  const input = (): ComputeModelInput<BitfieldSpec> => ({
    data: local.data,
    size: resolvedSize(),
    spec: spec(),
  });

  return <MicrovizChart input={input()} {...rest} />;
};

export type { RenderModel };
