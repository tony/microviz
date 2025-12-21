import {
  createModelIdAllocator,
  type Def,
  patchRenderModel,
  type RenderModel,
} from "@microviz/core";

// Demo-only diagnostic overlay: apply a deterministic `turbulence → displacementMap`
// filter to stress renderer parity (filter handling, transforms, clipping, compositing).
export function applyNoiseDisplacementOverlay(model: RenderModel): RenderModel {
  const needsOverlay = model.marks.some((mark) => mark.filter === undefined);
  if (!needsOverlay) return model;

  const { defId } = createModelIdAllocator(model);
  const filterId = defId("mv-overlay-noise-displacement");

  const overlayDef: Def = {
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
  };

  const nextMarks = model.marks.map((mark) =>
    mark.filter === undefined ? { ...mark, filter: filterId } : mark,
  );

  return patchRenderModel(
    model,
    { defs: [overlayDef], marks: nextMarks },
    { marksMode: "replace" },
  );
}
