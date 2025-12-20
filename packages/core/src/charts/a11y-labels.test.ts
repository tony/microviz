import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";
import { chartRegistry } from "./registry";

const SERIES_SAMPLE: number[] = [0, 1, 2, 3, 4, 3, 2];
const SEGMENTS_SAMPLE = [
  { color: "#2563eb", name: "A", pct: 50 },
  { color: "#f97316", name: "B", pct: 30 },
  { color: "#22c55e", name: "C", pct: 20 },
];

function sampleData(type: string, def: unknown): unknown {
  if (type === "bar") return { max: 100, value: 72 };
  if (type === "bullet-delta") return { current: 70, max: 100, previous: 40 };
  if (type === "dumbbell") return { current: 40, max: 100, target: 80 };
  if (type === "dot-matrix") return { series: SERIES_SAMPLE };
  if (type === "heatgrid") return { series: SERIES_SAMPLE };
  if (type === "histogram") return { series: SERIES_SAMPLE };

  const emptyDataWarningMessage = (
    def as { emptyDataWarningMessage?: string } | null
  )?.emptyDataWarningMessage;
  if (emptyDataWarningMessage?.includes("series")) return SERIES_SAMPLE;

  return SEGMENTS_SAMPLE;
}

describe("a11y labels", () => {
  test("all charts produce data-driven labels", () => {
    for (const [type, def] of Object.entries(chartRegistry)) {
      const model = computeModel({
        data: sampleData(type, def) as never,
        size: { height: 80, width: 160 },
        spec: { type } as never,
      });

      expect(model.a11y?.label, `${type} missing a11y label`).toBeTruthy();
      expect(model.a11y?.label, `${type} label should include data`).toMatch(
        /\d/,
      );
    }
  });
});
