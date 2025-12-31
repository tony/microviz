import type {
  Def,
  FilterPrimitive,
  Mark,
  PatternMark,
  RenderModel,
} from "@microviz/core";
import {
  getCanvasUnsupportedFilterPrimitiveTypes,
  type RenderCanvasOptions,
  renderCanvas,
  renderSvgString,
} from "@microviz/renderers";
import {
  type Component,
  createEffect,
  createMemo,
  type JSX,
  onMount,
  splitProps,
} from "solid-js";
import { For, Show } from "solid-js/web";

function urlRef(id: string | undefined): string | undefined {
  return id ? `url(#${id})` : undefined;
}

function renderPatternMark(mark: PatternMark): JSX.Element {
  switch (mark.type) {
    case "rect":
      return (
        <rect
          class={mark.className}
          fill={mark.fill}
          fill-opacity={mark.fillOpacity}
          filter={urlRef(mark.filter)}
          height={mark.h}
          mask={urlRef(mark.mask)}
          opacity={mark.opacity}
          rx={mark.rx}
          ry={mark.ry}
          stroke={mark.stroke}
          stroke-opacity={mark.strokeOpacity}
          stroke-width={mark.strokeWidth}
          width={mark.w}
          x={mark.x}
          y={mark.y}
        />
      );

    case "path":
      return (
        <path
          class={mark.className}
          d={mark.d}
          fill={mark.fill}
          fill-opacity={mark.fillOpacity}
          filter={urlRef(mark.filter)}
          mask={urlRef(mark.mask)}
          opacity={mark.opacity}
          stroke={mark.stroke}
          stroke-linecap={mark.strokeLinecap}
          stroke-linejoin={mark.strokeLinejoin}
          stroke-opacity={mark.strokeOpacity}
          stroke-width={mark.strokeWidth}
        />
      );

    case "text":
      return (
        <text
          class={mark.className}
          dominant-baseline={mark.baseline}
          fill={mark.fill}
          fill-opacity={mark.fillOpacity}
          filter={urlRef(mark.filter)}
          mask={urlRef(mark.mask)}
          opacity={mark.opacity}
          text-anchor={mark.anchor}
          x={mark.x}
          y={mark.y}
        >
          {mark.text}
        </text>
      );

    case "circle":
      return (
        <circle
          class={mark.className}
          cx={mark.cx}
          cy={mark.cy}
          fill={mark.fill}
          fill-opacity={mark.fillOpacity}
          filter={urlRef(mark.filter)}
          mask={urlRef(mark.mask)}
          opacity={mark.opacity}
          r={mark.r}
          stroke={mark.stroke}
          stroke-dasharray={mark.strokeDasharray}
          stroke-dashoffset={mark.strokeDashoffset}
          stroke-linecap={mark.strokeLinecap}
          stroke-opacity={mark.strokeOpacity}
          stroke-width={mark.strokeWidth}
        />
      );

    case "line":
      return (
        <line
          class={mark.className}
          filter={urlRef(mark.filter)}
          mask={urlRef(mark.mask)}
          opacity={mark.opacity}
          stroke={mark.stroke}
          stroke-linecap={mark.strokeLinecap}
          stroke-linejoin={mark.strokeLinejoin}
          stroke-opacity={mark.strokeOpacity}
          stroke-width={mark.strokeWidth}
          x1={mark.x1}
          x2={mark.x2}
          y1={mark.y1}
          y2={mark.y2}
        />
      );
    default:
      return null as unknown as JSX.Element;
  }
}

function renderFilterPrimitive(primitive: FilterPrimitive): JSX.Element {
  switch (primitive.type) {
    case "dropShadow":
      return (
        <feDropShadow
          dx={primitive.dx}
          dy={primitive.dy}
          flood-color={primitive.floodColor}
          flood-opacity={primitive.floodOpacity}
          result={primitive.result}
          stdDeviation={primitive.stdDeviation}
          {...{ in: primitive.in }}
        />
      );
    case "gaussianBlur":
      return (
        <feGaussianBlur
          result={primitive.result}
          stdDeviation={primitive.stdDeviation}
          {...{ in: primitive.in }}
        />
      );
    case "turbulence":
      return (
        <feTurbulence
          baseFrequency={primitive.baseFrequency}
          numOctaves={primitive.numOctaves}
          result={primitive.result}
          seed={primitive.seed}
          stitchTiles={primitive.stitchTiles}
          type={primitive.noiseType}
        />
      );
    case "displacementMap":
      return (
        <feDisplacementMap
          in2={primitive.in2}
          result={primitive.result}
          scale={primitive.scale}
          xChannelSelector={primitive.xChannelSelector}
          yChannelSelector={primitive.yChannelSelector}
          {...{ in: primitive.in }}
        />
      );
    default:
      return null as unknown as JSX.Element;
  }
}

function renderDef(def: Def): JSX.Element {
  if (def.type === "linearGradient") {
    return (
      <linearGradient
        id={def.id}
        x1={def.x1}
        x2={def.x2}
        y1={def.y1}
        y2={def.y2}
      >
        <For each={def.stops}>
          {(stop) => {
            const offset = `${Math.round(stop.offset * 10000) / 100}%`;
            return (
              <stop
                offset={offset}
                stop-color={stop.color}
                stop-opacity={stop.opacity}
              />
            );
          }}
        </For>
      </linearGradient>
    );
  }

  if (def.type === "pattern") {
    return (
      <pattern
        height={def.height}
        id={def.id}
        patternContentUnits={def.patternContentUnits}
        patternTransform={def.patternTransform}
        patternUnits={def.patternUnits}
        width={def.width}
        x={def.x}
        y={def.y}
      >
        <For each={def.marks}>{(mark) => renderPatternMark(mark)}</For>
      </pattern>
    );
  }

  if (def.type === "mask") {
    return (
      <mask
        height={def.height}
        id={def.id}
        maskContentUnits={def.maskContentUnits}
        maskUnits={def.maskUnits}
        width={def.width}
        x={def.x}
        y={def.y}
      >
        <For each={def.marks}>{(mark) => renderPatternMark(mark)}</For>
      </mask>
    );
  }

  if (def.type === "filter") {
    return (
      <filter
        filterUnits={def.filterUnits}
        height={def.height}
        id={def.id}
        width={def.width}
        x={def.x}
        y={def.y}
      >
        <For each={def.primitives}>
          {(primitive) => renderFilterPrimitive(primitive)}
        </For>
      </filter>
    );
  }

  return (
    <clipPath id={def.id}>
      <rect
        height={def.h}
        rx={def.rx}
        ry={def.ry}
        width={def.w}
        x={def.x}
        y={def.y}
      />
    </clipPath>
  );
}

function renderMark(mark: Mark): JSX.Element {
  switch (mark.type) {
    case "rect":
      return (
        <rect
          class={mark.className}
          clip-path={urlRef(mark.clipPath)}
          fill={mark.fill}
          fill-opacity={mark.fillOpacity}
          filter={urlRef(mark.filter)}
          height={mark.h}
          id={mark.id}
          mask={urlRef(mark.mask)}
          opacity={mark.opacity}
          rx={mark.rx}
          ry={mark.ry}
          stroke={mark.stroke}
          stroke-opacity={mark.strokeOpacity}
          stroke-width={mark.strokeWidth}
          width={mark.w}
          x={mark.x}
          y={mark.y}
        />
      );

    case "path":
      return (
        <path
          class={mark.className}
          clip-path={urlRef(mark.clipPath)}
          d={mark.d}
          fill={mark.fill}
          fill-opacity={mark.fillOpacity}
          filter={urlRef(mark.filter)}
          id={mark.id}
          mask={urlRef(mark.mask)}
          opacity={mark.opacity}
          stroke={mark.stroke}
          stroke-linecap={mark.strokeLinecap}
          stroke-linejoin={mark.strokeLinejoin}
          stroke-opacity={mark.strokeOpacity}
          stroke-width={mark.strokeWidth}
        />
      );

    case "text":
      return (
        <text
          class={mark.className}
          dominant-baseline={mark.baseline}
          fill={mark.fill}
          fill-opacity={mark.fillOpacity}
          filter={urlRef(mark.filter)}
          id={mark.id}
          mask={urlRef(mark.mask)}
          opacity={mark.opacity}
          text-anchor={mark.anchor}
          x={mark.x}
          y={mark.y}
        >
          {mark.text}
        </text>
      );

    case "circle":
      return (
        <circle
          class={mark.className}
          cx={mark.cx}
          cy={mark.cy}
          fill={mark.fill}
          fill-opacity={mark.fillOpacity}
          filter={urlRef(mark.filter)}
          id={mark.id}
          mask={urlRef(mark.mask)}
          opacity={mark.opacity}
          r={mark.r}
          stroke={mark.stroke}
          stroke-dasharray={mark.strokeDasharray}
          stroke-dashoffset={mark.strokeDashoffset}
          stroke-linecap={mark.strokeLinecap}
          stroke-opacity={mark.strokeOpacity}
          stroke-width={mark.strokeWidth}
        />
      );

    case "line":
      return (
        <line
          class={mark.className}
          filter={urlRef(mark.filter)}
          id={mark.id}
          mask={urlRef(mark.mask)}
          opacity={mark.opacity}
          stroke={mark.stroke}
          stroke-linecap={mark.strokeLinecap}
          stroke-linejoin={mark.strokeLinejoin}
          stroke-opacity={mark.strokeOpacity}
          stroke-width={mark.strokeWidth}
          x1={mark.x1}
          x2={mark.x2}
          y1={mark.y1}
          y2={mark.y2}
        />
      );
    default:
      return null as unknown as JSX.Element;
  }
}

export type MicrovizSvgProps = JSX.SvgSVGAttributes<SVGSVGElement> & {
  model: RenderModel;
  title?: string;
};

export const MicrovizSvg: Component<MicrovizSvgProps> = (props) => {
  const [local, others] = splitProps(props, ["model", "title"]);
  const label = () => local.title ?? local.model.a11y?.label;
  const role = () => local.model.a11y?.role ?? "img";

  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: title element is conditionally rendered based on label()
    <svg
      aria-label={label()}
      height={local.model.height}
      viewBox={`0 0 ${local.model.width} ${local.model.height}`}
      width={local.model.width}
      xmlns="http://www.w3.org/2000/svg"
      {...({ role: role() } as Record<string, string>)}
      {...others}
    >
      <Show when={label()}>
        <title>{label()}</title>
      </Show>
      <Show when={local.model.defs && local.model.defs.length > 0}>
        <defs>
          <For each={local.model.defs}>{(def) => renderDef(def)}</For>
        </defs>
      </Show>
      <For each={local.model.marks}>{(mark) => renderMark(mark)}</For>
    </svg>
  );
};

export type MicrovizSvgStringProps = JSX.HTMLAttributes<HTMLDivElement> & {
  model: RenderModel;
  title?: string;
};

export const MicrovizSvgString: Component<MicrovizSvgStringProps> = (props) => {
  const [local, others] = splitProps(props, ["model", "title"]);
  let hostRef: HTMLDivElement | undefined;

  const svg = createMemo(() =>
    renderSvgString(local.model, { title: local.title }),
  );

  onMount(() => {
    createEffect(() => {
      const host = hostRef;
      if (!host) return;
      const svgStr = svg();
      if (!svgStr) {
        host.replaceChildren();
        return;
      }
      if (typeof DOMParser === "undefined") return;

      const doc = new DOMParser().parseFromString(svgStr, "image/svg+xml");
      const el = doc.documentElement;
      if (!el) return;
      if (el.tagName.toLowerCase() !== "svg") return;

      host.replaceChildren(host.ownerDocument.importNode(el, true));
    });
  });

  return <div {...others} ref={hostRef} />;
};

export type MicrovizCanvasProps =
  JSX.CanvasHTMLAttributes<HTMLCanvasElement> & {
    model: RenderModel;
    options?: RenderCanvasOptions;
    /**
     * Canvas rendering currently ignores some SVG filter primitives.
     * If enabled, fall back to an SVG renderer to avoid silent incorrect output.
     */
    fallbackSvgWhenCanvasUnsupported?: boolean;
    /**
     * Which SVG surface to use when falling back from Canvas.
     */
    fallbackRenderer?: "svg" | "svg-string";
    svgProps?: Omit<MicrovizSvgProps, "model">;
    svgStringProps?: Omit<MicrovizSvgStringProps, "model">;
  };

export const MicrovizCanvas: Component<MicrovizCanvasProps> = (props) => {
  const [local, others] = splitProps(props, [
    "model",
    "options",
    "fallbackSvgWhenCanvasUnsupported",
    "fallbackRenderer",
    "svgProps",
    "svgStringProps",
    "class",
    "style",
  ]);

  const fallbackSvgWhenCanvasUnsupported = () =>
    local.fallbackSvgWhenCanvasUnsupported ?? true;
  const fallbackRenderer = () => local.fallbackRenderer ?? "svg";

  const shouldFallbackToSvg = () =>
    fallbackSvgWhenCanvasUnsupported() &&
    getCanvasUnsupportedFilterPrimitiveTypes(local.model).length > 0;

  let canvasRef: HTMLCanvasElement | undefined;

  onMount(() => {
    createEffect(() => {
      if (shouldFallbackToSvg()) return;
      const canvas = canvasRef;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      renderCanvas(ctx, local.model, local.options);
    });
  });

  return (
    <Show
      fallback={
        <Show
          fallback={
            <MicrovizSvg
              class={local.class}
              model={local.model}
              style={local.style}
              {...local.svgProps}
            />
          }
          when={fallbackRenderer() === "svg-string"}
        >
          <MicrovizSvgString
            class={local.class}
            model={local.model}
            style={local.style}
            {...local.svgStringProps}
          />
        </Show>
      }
      when={!shouldFallbackToSvg()}
    >
      <canvas
        class={local.class}
        height={local.model.height}
        ref={canvasRef}
        style={local.style}
        width={local.model.width}
        {...others}
      />
    </Show>
  );
};
