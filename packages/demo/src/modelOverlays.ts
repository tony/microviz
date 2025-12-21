import type { Def, RenderModel } from "@microviz/core";

// Demo-only diagnostic overlay: apply a deterministic `turbulence → displacementMap`
// filter to stress renderer parity (filter handling, transforms, clipping, compositing).
function uniqueDefId(base: string, defs: readonly Def[] | undefined): string {
  const used = new Set((defs ?? []).map((d) => d.id));
  if (!used.has(base)) return base;

  let i = 2;
  for (;;) {
    const id = `${base}-${i}`;
    if (!used.has(id)) return id;
    i++;
  }
}

export function applyNoiseDisplacementOverlay(model: RenderModel): RenderModel {
  const needsOverlay = model.marks.some((mark) => mark.filter === undefined);
  if (!needsOverlay) return model;

  const filterId = uniqueDefId("mv-overlay-noise-displacement", model.defs);

  const nextDefs: Def[] = [
    ...(model.defs ?? []),
    {
      filterUnits: "objectBoundingBox",
      height: 2,
      id: filterId,
      primitives: [
        {
          baseFrequency: "0.02 0.08",
          noiseType: "fractalNoise",
          numOctaves: 2,
          result: "noise",
          seed: 7,
          stitchTiles: "stitch",
          type: "turbulence",
        },
        {
          in: "SourceGraphic",
          in2: "noise",
          scale: 12,
          type: "displacementMap",
          xChannelSelector: "R",
          yChannelSelector: "G",
        },
      ],
      type: "filter",
      width: 1.4,
      x: -0.2,
      y: -0.5,
    },
  ];

  const nextMarks = model.marks.map((mark) =>
    mark.filter === undefined ? { ...mark, filter: filterId } : mark,
  );

  return {
    ...model,
    defs: nextDefs,
    marks: nextMarks,
    stats: model.stats ? { ...model.stats, hasDefs: true } : model.stats,
  };
}
