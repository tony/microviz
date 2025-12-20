import type { Def, LayerHint, Mark, ModelStats, RenderModel } from "./model";

export type ModelMergeMode = "append" | "prepend" | "replace";

export type RenderModelPatch = {
  defs?: ReadonlyArray<Def>;
  marks?: ReadonlyArray<Mark>;
  layers?: ReadonlyArray<LayerHint>;
};

export type RenderModelPatchOptions = {
  defsMode?: ModelMergeMode;
  marksMode?: ModelMergeMode;
  layersMode?: ModelMergeMode;
  /**
   * When true (default), updates `model.stats.{markCount,textCount,hasDefs}`
   * to match the returned model. Existing warning data is preserved.
   */
  updateStats?: boolean;
};

function mergeArray<T>(
  prev: readonly T[] | undefined,
  next: readonly T[],
  mode: ModelMergeMode,
): T[] {
  switch (mode) {
    case "replace":
      return [...next];
    case "prepend":
      return [...next, ...(prev ?? [])];
    case "append":
      return [...(prev ?? []), ...next];
  }
}

function computeStats(model: RenderModel, prev?: ModelStats): ModelStats {
  const warnings = prev?.warnings;
  return {
    hasDefs: (model.defs?.length ?? 0) > 0,
    markCount: model.marks.length,
    textCount: model.marks.filter((m) => m.type === "text").length,
    ...(warnings ? { warnings } : {}),
  };
}

export function patchRenderModel(
  model: RenderModel,
  patch: RenderModelPatch,
  options?: RenderModelPatchOptions,
): RenderModel {
  const defsMode = options?.defsMode ?? "append";
  const marksMode = options?.marksMode ?? "append";
  const layersMode = options?.layersMode ?? "append";
  const updateStats = options?.updateStats ?? true;

  const nextMarks = patch.marks
    ? mergeArray(model.marks, patch.marks, marksMode)
    : [...model.marks];

  const nextDefs = patch.defs
    ? mergeArray(model.defs, patch.defs, defsMode)
    : model.defs
      ? [...model.defs]
      : undefined;

  const nextLayers = patch.layers
    ? mergeArray(model.layers, patch.layers, layersMode)
    : model.layers
      ? [...model.layers]
      : undefined;

  const next: RenderModel = {
    ...model,
    ...(nextDefs && nextDefs.length > 0 ? { defs: nextDefs } : {}),
    ...(nextLayers && nextLayers.length > 0 ? { layers: nextLayers } : {}),
    marks: nextMarks,
  };

  if (updateStats) next.stats = computeStats(next, model.stats);
  return next;
}

function allocateUniqueId(base: string, used: Set<string>): string {
  if (!used.has(base)) {
    used.add(base);
    return base;
  }

  let i = 2;
  for (;;) {
    const id = `${base}-${i}`;
    if (!used.has(id)) {
      used.add(id);
      return id;
    }
    i++;
  }
}

export type ModelIdAllocator = {
  defId: (base: string) => string;
  markId: (base: string) => string;
};

/**
 * Creates deterministic ID allocators scoped to a single model.
 *
 * This is helpful when building overlays that need to add defs/marks without
 * colliding with existing IDs.
 */
export function createModelIdAllocator(model: RenderModel): ModelIdAllocator {
  const usedDefs = new Set((model.defs ?? []).map((d) => d.id));
  const usedMarks = new Set(model.marks.map((m) => m.id));
  return {
    defId: (base) => allocateUniqueId(base, usedDefs),
    markId: (base) => allocateUniqueId(base, usedMarks),
  };
}
