// Shared runtime types used by chart definitions and computeModel.
export type InteractionState = {
  hoveredMarkId?: string;
  selectedMarkIds?: ReadonlyArray<string>;
  focusedMarkId?: string;
};

export type ThemeTokens = {
  /**
   * Optional theme overrides for chart computation.
   *
   * Today, built-in charts are CSS-first and do not consume these tokens.
   * Prefer CSS variables (`--mv-*`) and renderer defaults (e.g. Canvas
   * `fillStyle`/`strokeStyle`) for styling.
   */
  series1?: string;
};

export type Layout = {
  width: number;
  height: number;
  pad: number;
};
