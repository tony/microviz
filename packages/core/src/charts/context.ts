// Shared runtime types used by chart definitions and computeModel.
export type InteractionState = {
  hoveredMarkId?: string;
  selectedMarkIds?: ReadonlyArray<string>;
  focusedMarkId?: string;
};

export type ThemeTokens = {
  series1?: string;
};

export type Layout = {
  width: number;
  height: number;
  pad: number;
};
