import type { A11yTree, Def, DiagnosticWarning, Mark } from "../model";
import type { InteractionState, Layout, ThemeTokens } from "./context";

/**
 * Aspect ratio hint for chart sizing and layout grouping.
 * - "square": Equal width and height (rings, donuts, pies)
 * - "wide": Width > height, horizontal orientation (sparklines, progress bars)
 * - "tall": Height > width, vertical orientation (vertical stacks, columns)
 */
export type PreferredAspectRatio = "square" | "wide" | "tall";

/**
 * Category for organizing charts in UI.
 */
export type ChartCategory = "lines" | "bars" | "grids" | "dots";

export type ChartDefinition<
  T extends string,
  Spec extends { type: T; pad?: number; className?: string },
  Data,
  Normalized extends { type: T },
> = {
  type: T;
  defaultPad: number;
  /** Human-readable display name for UI */
  displayName?: string;
  /** Category for organizing charts in UI */
  category?: ChartCategory;
  /** Hint for ideal aspect ratio; undefined means chart adapts to any size */
  preferredAspectRatio?: PreferredAspectRatio;
  /** Warning message when data is empty/invalid */
  emptyDataWarningMessage?: string;
  /** Hint for fixing empty data warning */
  emptyDataHint?: string;
  /** Copy-pasteable HTML example showing correct usage */
  exampleHtml?: string;
  normalize(spec: Spec, data: Data): Normalized;
  isEmpty(normalized: Normalized): boolean;
  marks(
    spec: Spec,
    normalized: Normalized,
    layout: Layout,
    state: InteractionState | undefined,
    theme: ThemeTokens | undefined,
    warnings: DiagnosticWarning[] | undefined,
  ): Mark[];
  defs?(
    spec: Spec,
    normalized: Normalized,
    layout: Layout,
    warnings: DiagnosticWarning[] | undefined,
  ): Def[];
  a11y(spec: Spec, normalized: Normalized, layout: Layout): A11yTree;
};

export type AnyChartDefinition = ChartDefinition<
  string,
  { type: string; pad?: number; className?: string },
  unknown,
  { type: string }
>;

type EnsureKeyMatchesType<R extends Record<string, AnyChartDefinition>> = {
  [K in keyof R]: R[K] & { type: K & string };
};

export function createChartRegistry<
  const R extends Record<string, AnyChartDefinition>,
>(registry: EnsureKeyMatchesType<R>): EnsureKeyMatchesType<R> {
  return registry;
}
