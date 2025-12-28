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
  type CanvasHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
  type SVGProps,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";

const useLayoutEffectSafe =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

function urlRef(id: string | undefined): string | undefined {
  return id ? `url(#${id})` : undefined;
}

function renderPatternMark(mark: PatternMark, key: string): ReactNode {
  switch (mark.type) {
    case "rect":
      return (
        <rect
          className={mark.className}
          fill={mark.fill}
          fillOpacity={mark.fillOpacity}
          filter={urlRef(mark.filter)}
          height={mark.h}
          key={key}
          mask={urlRef(mark.mask)}
          opacity={mark.opacity}
          rx={mark.rx}
          ry={mark.ry}
          stroke={mark.stroke}
          strokeOpacity={mark.strokeOpacity}
          strokeWidth={mark.strokeWidth}
          width={mark.w}
          x={mark.x}
          y={mark.y}
        />
      );

    case "path":
      return (
        <path
          className={mark.className}
          d={mark.d}
          fill={mark.fill}
          fillOpacity={mark.fillOpacity}
          filter={urlRef(mark.filter)}
          key={key}
          mask={urlRef(mark.mask)}
          opacity={mark.opacity}
          stroke={mark.stroke}
          strokeLinecap={mark.strokeLinecap}
          strokeLinejoin={mark.strokeLinejoin}
          strokeOpacity={mark.strokeOpacity}
          strokeWidth={mark.strokeWidth}
        />
      );

    case "text":
      return (
        <text
          className={mark.className}
          dominantBaseline={mark.baseline}
          fill={mark.fill}
          fillOpacity={mark.fillOpacity}
          filter={urlRef(mark.filter)}
          key={key}
          mask={urlRef(mark.mask)}
          opacity={mark.opacity}
          textAnchor={mark.anchor}
          x={mark.x}
          y={mark.y}
        >
          {mark.text}
        </text>
      );

    case "circle":
      return (
        <circle
          className={mark.className}
          cx={mark.cx}
          cy={mark.cy}
          fill={mark.fill}
          fillOpacity={mark.fillOpacity}
          filter={urlRef(mark.filter)}
          key={key}
          mask={urlRef(mark.mask)}
          opacity={mark.opacity}
          r={mark.r}
          stroke={mark.stroke}
          strokeDasharray={mark.strokeDasharray}
          strokeDashoffset={mark.strokeDashoffset}
          strokeLinecap={mark.strokeLinecap}
          strokeOpacity={mark.strokeOpacity}
          strokeWidth={mark.strokeWidth}
        />
      );

    case "line":
      return (
        <line
          className={mark.className}
          filter={urlRef(mark.filter)}
          key={key}
          mask={urlRef(mark.mask)}
          opacity={mark.opacity}
          stroke={mark.stroke}
          strokeLinecap={mark.strokeLinecap}
          strokeLinejoin={mark.strokeLinejoin}
          strokeOpacity={mark.strokeOpacity}
          strokeWidth={mark.strokeWidth}
          x1={mark.x1}
          x2={mark.x2}
          y1={mark.y1}
          y2={mark.y2}
        />
      );
  }
}

function renderFilterPrimitive(
  primitive: FilterPrimitive,
  key: string,
): ReactNode {
  switch (primitive.type) {
    case "dropShadow":
      return (
        <feDropShadow
          dx={primitive.dx}
          dy={primitive.dy}
          floodColor={primitive.floodColor}
          floodOpacity={primitive.floodOpacity}
          in={primitive.in}
          key={key}
          result={primitive.result}
          stdDeviation={primitive.stdDeviation}
        />
      );
    case "gaussianBlur":
      return (
        <feGaussianBlur
          in={primitive.in}
          key={key}
          result={primitive.result}
          stdDeviation={primitive.stdDeviation}
        />
      );
    case "turbulence":
      return (
        <feTurbulence
          baseFrequency={primitive.baseFrequency}
          key={key}
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
          in={primitive.in}
          in2={primitive.in2}
          key={key}
          result={primitive.result}
          scale={primitive.scale}
          xChannelSelector={primitive.xChannelSelector}
          yChannelSelector={primitive.yChannelSelector}
        />
      );
  }
}

function renderDef(def: Def): ReactNode {
  if (def.type === "linearGradient") {
    return (
      <linearGradient
        id={def.id}
        key={def.id}
        x1={def.x1}
        x2={def.x2}
        y1={def.y1}
        y2={def.y2}
      >
        {def.stops.map((stop, idx) => {
          const offset = `${Math.round(stop.offset * 10000) / 100}%`;
          return (
            <stop
              key={`${def.id}:${idx}`}
              offset={offset}
              stopColor={stop.color}
              stopOpacity={stop.opacity}
            />
          );
        })}
      </linearGradient>
    );
  }

  if (def.type === "pattern") {
    return (
      <pattern
        height={def.height}
        id={def.id}
        key={def.id}
        patternContentUnits={def.patternContentUnits}
        patternTransform={def.patternTransform}
        patternUnits={def.patternUnits}
        width={def.width}
        x={def.x}
        y={def.y}
      >
        {def.marks.map((mark, idx) =>
          renderPatternMark(mark, `${def.id}:${idx}`),
        )}
      </pattern>
    );
  }

  if (def.type === "mask") {
    return (
      <mask
        height={def.height}
        id={def.id}
        key={def.id}
        maskContentUnits={def.maskContentUnits}
        maskUnits={def.maskUnits}
        width={def.width}
        x={def.x}
        y={def.y}
      >
        {def.marks.map((mark, idx) =>
          renderPatternMark(mark, `${def.id}:${idx}`),
        )}
      </mask>
    );
  }

  if (def.type === "filter") {
    return (
      <filter
        filterUnits={def.filterUnits}
        height={def.height}
        id={def.id}
        key={def.id}
        width={def.width}
        x={def.x}
        y={def.y}
      >
        {def.primitives.map((primitive, idx) =>
          renderFilterPrimitive(primitive, `${def.id}:${idx}`),
        )}
      </filter>
    );
  }

  return (
    <clipPath id={def.id} key={def.id}>
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

function renderMark(mark: Mark): ReactNode {
  switch (mark.type) {
    case "rect":
      return (
        <rect
          className={mark.className}
          clipPath={urlRef(mark.clipPath)}
          fill={mark.fill}
          fillOpacity={mark.fillOpacity}
          filter={urlRef(mark.filter)}
          height={mark.h}
          id={mark.id}
          key={mark.id}
          mask={urlRef(mark.mask)}
          opacity={mark.opacity}
          rx={mark.rx}
          ry={mark.ry}
          stroke={mark.stroke}
          strokeOpacity={mark.strokeOpacity}
          strokeWidth={mark.strokeWidth}
          width={mark.w}
          x={mark.x}
          y={mark.y}
        />
      );

    case "path":
      return (
        <path
          className={mark.className}
          clipPath={urlRef(mark.clipPath)}
          d={mark.d}
          fill={mark.fill}
          fillOpacity={mark.fillOpacity}
          filter={urlRef(mark.filter)}
          id={mark.id}
          key={mark.id}
          mask={urlRef(mark.mask)}
          opacity={mark.opacity}
          stroke={mark.stroke}
          strokeLinecap={mark.strokeLinecap}
          strokeLinejoin={mark.strokeLinejoin}
          strokeOpacity={mark.strokeOpacity}
          strokeWidth={mark.strokeWidth}
        />
      );

    case "text":
      return (
        <text
          className={mark.className}
          dominantBaseline={mark.baseline}
          fill={mark.fill}
          fillOpacity={mark.fillOpacity}
          filter={urlRef(mark.filter)}
          id={mark.id}
          key={mark.id}
          mask={urlRef(mark.mask)}
          opacity={mark.opacity}
          textAnchor={mark.anchor}
          x={mark.x}
          y={mark.y}
        >
          {mark.text}
        </text>
      );

    case "circle":
      return (
        <circle
          className={mark.className}
          cx={mark.cx}
          cy={mark.cy}
          fill={mark.fill}
          fillOpacity={mark.fillOpacity}
          filter={urlRef(mark.filter)}
          id={mark.id}
          key={mark.id}
          mask={urlRef(mark.mask)}
          opacity={mark.opacity}
          r={mark.r}
          stroke={mark.stroke}
          strokeDasharray={mark.strokeDasharray}
          strokeDashoffset={mark.strokeDashoffset}
          strokeLinecap={mark.strokeLinecap}
          strokeOpacity={mark.strokeOpacity}
          strokeWidth={mark.strokeWidth}
        />
      );

    case "line":
      return (
        <line
          className={mark.className}
          filter={urlRef(mark.filter)}
          id={mark.id}
          key={mark.id}
          mask={urlRef(mark.mask)}
          opacity={mark.opacity}
          stroke={mark.stroke}
          strokeLinecap={mark.strokeLinecap}
          strokeLinejoin={mark.strokeLinejoin}
          strokeOpacity={mark.strokeOpacity}
          strokeWidth={mark.strokeWidth}
          x1={mark.x1}
          x2={mark.x2}
          y1={mark.y1}
          y2={mark.y2}
        />
      );
  }
}

export type MicrovizSvgProps = Omit<
  SVGProps<SVGSVGElement>,
  "children" | "height" | "viewBox" | "width"
> & {
  model: RenderModel;
  title?: string;
};

export function MicrovizSvg({
  model,
  title,
  ...props
}: MicrovizSvgProps): ReactNode {
  const label = title ?? model.a11y?.label;
  const role = model.a11y?.role ?? "img";

  return (
    <svg
      aria-label={label}
      height={model.height}
      role={role}
      viewBox={`0 0 ${model.width} ${model.height}`}
      width={model.width}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {label ? <title>{label}</title> : null}
      {model.defs && model.defs.length > 0 ? (
        <defs>{model.defs.map(renderDef)}</defs>
      ) : null}
      {model.marks.map(renderMark)}
    </svg>
  );
}

export type MicrovizSvgStringProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> & {
  model: RenderModel;
  title?: string;
};

export function MicrovizSvgString({
  model,
  title,
  ...props
}: MicrovizSvgStringProps): ReactNode {
  const svg = useMemo(() => renderSvgString(model, { title }), [model, title]);
  const hostRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffectSafe(() => {
    const host = hostRef.current;
    if (!host) return;
    if (!svg) {
      host.replaceChildren();
      return;
    }
    if (typeof DOMParser === "undefined") return;

    const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
    const el = doc.documentElement;
    if (!el) return;
    if (el.tagName.toLowerCase() !== "svg") return;

    host.replaceChildren(host.ownerDocument.importNode(el, true));
  }, [svg]);

  return <div {...props} ref={hostRef} />;
}

export type MicrovizCanvasProps = Omit<
  CanvasHTMLAttributes<HTMLCanvasElement>,
  "children" | "height" | "width"
> & {
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

export function MicrovizCanvas({
  className,
  fallbackRenderer = "svg",
  fallbackSvgWhenCanvasUnsupported = true,
  model,
  options,
  style,
  svgProps,
  svgStringProps,
  ...props
}: MicrovizCanvasProps): ReactNode {
  const shouldFallbackToSvg =
    fallbackSvgWhenCanvasUnsupported &&
    getCanvasUnsupportedFilterPrimitiveTypes(model).length > 0;

  const ref = useRef<HTMLCanvasElement | null>(null);

  useLayoutEffectSafe(() => {
    if (shouldFallbackToSvg) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    renderCanvas(ctx, model, options);
  }, [model, options, shouldFallbackToSvg]);

  if (shouldFallbackToSvg) {
    if (fallbackRenderer === "svg-string")
      return (
        <MicrovizSvgString
          className={className}
          model={model}
          style={style}
          {...svgStringProps}
        />
      );
    return (
      <MicrovizSvg
        className={className}
        model={model}
        style={style}
        {...svgProps}
      />
    );
  }

  return (
    <canvas
      className={className}
      height={model.height}
      ref={ref}
      style={style}
      width={model.width}
      {...props}
    />
  );
}
