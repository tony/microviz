export type MarkId = string;

export type TextAnchor = "start" | "middle" | "end";
export type TextBaseline = "alphabetic" | "central" | "hanging" | "middle";

export type StrokeLinecap = "butt" | "round" | "square";
export type StrokeLinejoin = "bevel" | "miter" | "round";

export type RectMark = {
  type: "rect";
  id: MarkId;
  x: number;
  y: number;
  w: number;
  h: number;
  rx?: number;
  ry?: number;
  fill?: string;
  fillOpacity?: number;
  opacity?: number;
  stroke?: string;
  strokeOpacity?: number;
  strokeWidth?: number;
  clipPath?: string;
  mask?: string;
  filter?: string;
  className?: string;
};

export type PathMark = {
  type: "path";
  id: MarkId;
  d: string;
  opacity?: number;
  fill?: string;
  fillOpacity?: number;
  stroke?: string;
  strokeOpacity?: number;
  strokeWidth?: number;
  strokeLinecap?: StrokeLinecap;
  strokeLinejoin?: StrokeLinejoin;
  clipPath?: string;
  mask?: string;
  filter?: string;
  className?: string;
};

export type TextMark = {
  type: "text";
  id: MarkId;
  x: number;
  y: number;
  text: string;
  anchor?: TextAnchor;
  baseline?: TextBaseline;
  opacity?: number;
  fill?: string;
  fillOpacity?: number;
  mask?: string;
  filter?: string;
  className?: string;
};

export type CircleMark = {
  type: "circle";
  id: MarkId;
  cx: number;
  cy: number;
  r: number;
  opacity?: number;
  fill?: string;
  fillOpacity?: number;
  stroke?: string;
  strokeOpacity?: number;
  strokeWidth?: number;
  strokeDasharray?: string;
  strokeDashoffset?: string;
  strokeLinecap?: StrokeLinecap;
  mask?: string;
  filter?: string;
  className?: string;
};

export type LineMark = {
  type: "line";
  id: MarkId;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  opacity?: number;
  stroke?: string;
  strokeOpacity?: number;
  strokeWidth?: number;
  strokeLinecap?: StrokeLinecap;
  strokeLinejoin?: StrokeLinejoin;
  mask?: string;
  filter?: string;
  className?: string;
};

export type Mark = RectMark | PathMark | TextMark | CircleMark | LineMark;

export type PatternRectMark = Omit<RectMark, "clipPath" | "id">;
export type PatternPathMark = Omit<PathMark, "clipPath" | "id">;
export type PatternTextMark = Omit<TextMark, "id">;
export type PatternCircleMark = Omit<CircleMark, "id">;
export type PatternLineMark = Omit<LineMark, "id">;

export type PatternMark =
  | PatternRectMark
  | PatternPathMark
  | PatternTextMark
  | PatternCircleMark
  | PatternLineMark;

export type LinearGradientDef = {
  type: "linearGradient";
  id: string;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  stops: ReadonlyArray<{
    offset: number;
    color: string;
    opacity?: number;
  }>;
};

export type ClipRectDef = {
  type: "clipRect";
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rx?: number;
  ry?: number;
};

export type PatternDef = {
  type: "pattern";
  id: string;
  x?: number;
  y?: number;
  width: number;
  height: number;
  patternUnits?: "userSpaceOnUse" | "objectBoundingBox";
  patternContentUnits?: "userSpaceOnUse" | "objectBoundingBox";
  patternTransform?: string;
  marks: ReadonlyArray<PatternMark>;
};

export type MaskDef = {
  type: "mask";
  id: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  maskUnits?: "userSpaceOnUse" | "objectBoundingBox";
  maskContentUnits?: "userSpaceOnUse" | "objectBoundingBox";
  marks: ReadonlyArray<PatternMark>;
};

export type FilterPrimitive =
  | {
      type: "dropShadow";
      in?: string;
      result?: string;
      dx?: number;
      dy?: number;
      stdDeviation?: number;
      floodColor?: string;
      floodOpacity?: number;
    }
  | {
      type: "gaussianBlur";
      in?: string;
      result?: string;
      stdDeviation?: number;
    }
  | {
      type: "turbulence";
      result?: string;
      /**
       * Maps to `feTurbulence[type]` ("turbulence" | "fractalNoise").
       */
      noiseType?: "turbulence" | "fractalNoise";
      baseFrequency?: number | string;
      numOctaves?: number;
      seed?: number;
      stitchTiles?: "stitch" | "noStitch";
    }
  | {
      type: "displacementMap";
      in?: string;
      in2?: string;
      result?: string;
      scale?: number;
      xChannelSelector?: "R" | "G" | "B" | "A";
      yChannelSelector?: "R" | "G" | "B" | "A";
    };

export type FilterDef = {
  type: "filter";
  id: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  filterUnits?: "userSpaceOnUse" | "objectBoundingBox";
  primitives: ReadonlyArray<FilterPrimitive>;
};

export type Def =
  | LinearGradientDef
  | ClipRectDef
  | PatternDef
  | MaskDef
  | FilterDef;

export type LayerHint = {
  id: string;
  markIds: ReadonlyArray<MarkId>;
};

export type A11yNode = {
  id: string;
  label: string;
  valueText?: string;
  children?: ReadonlyArray<A11yNode>;
};

export type A11ySeriesSummary = {
  kind: "series";
  count: number;
  min?: number;
  max?: number;
  last?: number;
  trend?: "up" | "down" | "flat";
};

export type A11ySegmentsSummary = {
  kind: "segments";
  count: number;
  largestPct?: number;
  largestName?: string;
};

export type A11ySummary = A11ySeriesSummary | A11ySegmentsSummary;

export type A11yItem = {
  id: MarkId;
  label: string;
  value?: number;
  valueText?: string;
  series?: string;
  rank?: number;
};

export type A11yTree = {
  role: "img" | "graphics-document";
  label: string;
  summary?: A11ySummary;
  nodes?: ReadonlyArray<A11yNode>;
  items?: ReadonlyArray<A11yItem>;
};

export type DiagnosticWarningCode =
  | "BLANK_RENDER"
  | "EMPTY_DATA"
  | "MISSING_DEF"
  | "MARK_OUT_OF_BOUNDS"
  | "NAN_COORDINATE"
  // Validation codes (from validation module)
  | "INVALID_TYPE"
  | "INVALID_VALUE"
  | "INVALID_DATA_SHAPE"
  | "MISSING_VALUE"
  | "MISSING_FIELD"
  | "MISSING_DATA"
  | "OUT_OF_RANGE"
  | "UNKNOWN_CHART_TYPE"
  | "DROPPED_VALUES"; // Values were dropped during parsing (strict mode)

/**
 * Lifecycle phase where the warning occurred:
 * - input: Data validation before computation
 * - normalized: After data normalization (e.g., EMPTY_DATA)
 * - compute: During mark generation (e.g., NAN_COORDINATE)
 * - render: Output validation (e.g., BLANK_RENDER, MISSING_DEF)
 */
export type DiagnosticPhase = "input" | "normalized" | "compute" | "render";

export type DiagnosticWarning = {
  code: DiagnosticWarningCode;
  /** Lifecycle phase where the warning occurred */
  phase: DiagnosticPhase;
  message: string;
  markId?: MarkId;
  /** Path to the error location (e.g., ["data", 0, "pct"]) */
  path?: (string | number)[];
  /** What was expected (for error messages) */
  expected?: string;
  /** What was received (stringified) */
  received?: string;
  /** Actionable fix suggestion (copy-pasteable when possible) */
  hint?: string;
  /** Copy-pasteable HTML example showing correct usage */
  example?: string;
  /** For BLANK_RENDER: the upstream warning code that caused it */
  cause?: DiagnosticWarningCode;
};

export type ModelStats = {
  markCount: number;
  textCount: number;
  hasDefs: boolean;
  warnings?: ReadonlyArray<DiagnosticWarning>;
};

export type RenderModel = {
  width: number;
  height: number;
  marks: ReadonlyArray<Mark>;
  defs?: ReadonlyArray<Def>;
  /**
   * Optional paint-order hints for consumers (e.g. debug UIs, hit-testing
   * overlays, and future renderer optimizations). Current built-in renderers
   * ignore this field and simply paint marks in array order.
   */
  layers?: ReadonlyArray<LayerHint>;
  a11y?: A11yTree;
  stats?: ModelStats;
};
