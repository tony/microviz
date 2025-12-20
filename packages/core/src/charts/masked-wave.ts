import type { Def, Mark } from "../model";
import type { ChartDefinition } from "./chart-definition";
import { layoutSegmentsByPct, normalizeSegments } from "./shared";
import type {
  BitfieldData,
  MaskedWaveSpec,
  NormalizedMaskedWave,
} from "./types";

const MASK_ID = "mv-masked-wave-mask";
const WAVE_PATH = "M0 0.5 Q0.25 0 0.5 0.5 T1 0.5 L1 1 L0 1 Z";

export const maskedWaveChart = {
  a11y(_spec, _normalized, _layout) {
    return { label: "Masked wave chart", role: "img" };
  },
  category: "bars" as const,
  defaultPad: 0,
  defs(_spec, _normalized, _layout, _warnings): Def[] {
    return [
      {
        height: 1,
        id: MASK_ID,
        marks: [{ d: WAVE_PATH, fill: "white", type: "path" }],
        maskContentUnits: "objectBoundingBox",
        maskUnits: "objectBoundingBox",
        type: "mask",
        width: 1,
        x: 0,
        y: 0,
      },
    ];
  },
  displayName: "Masked wave",
  emptyDataWarningMessage: "No segments data.",
  isEmpty(normalized) {
    return normalized.segments.length === 0;
  },
  marks(spec, normalized, layout, _state, _theme, _warnings) {
    const segments = normalized.segments;
    if (segments.length === 0) return [];

    const usableW = Math.max(0, layout.width - layout.pad * 2);
    const usableH = Math.max(0, layout.height - layout.pad * 2);
    const x0 = layout.pad;
    const y0 = layout.pad;

    const runs = layoutSegmentsByPct(segments, usableW, 0);
    const classSuffix = spec.className ? ` ${spec.className}` : "";

    const marks: Mark[] = [];
    for (let i = 0; i < runs.length; i++) {
      const run = runs[i];
      if (!run) continue;
      marks.push({
        className: `mv-masked-wave-seg${classSuffix}`,
        fill: run.color,
        h: usableH,
        id: `masked-wave-seg-${i}`,
        mask: MASK_ID,
        type: "rect",
        w: run.w,
        x: x0 + run.x,
        y: y0,
      });
    }

    return marks;
  },
  normalize(_spec, data) {
    const segments = normalizeSegments(data);
    return { segments, type: "masked-wave" as const };
  },
  type: "masked-wave",
} satisfies ChartDefinition<
  "masked-wave",
  MaskedWaveSpec,
  BitfieldData,
  NormalizedMaskedWave
>;
