import { describe, expect, test } from "vitest";
import type { ChartSpec, NormalizedSparkline } from "./compute";
import { computeA11y, computeModel } from "./compute";
import { validateDefReferences } from "./diagnostics";
import type { Def, DiagnosticWarning, Mark } from "./model";

describe("computeModel pipeline", () => {
  test("defaults chart padding via registry", () => {
    const model = computeModel({
      data: { current: 70, max: 100, previous: 40 },
      size: { height: 32, width: 200 },
      spec: { type: "bullet-delta" as const },
    });

    const track = model.marks.find((m) => m.id === "bullet-delta-track");
    expect(track?.type).toBe("line");
    if (track?.type === "line") {
      expect(track.x1).toBe(4);
      expect(track.x2).toBe(196);
    }
  });

  test("emits EMPTY_DATA warnings using the registry", () => {
    const model = computeModel({
      data: [],
      size: { height: 32, width: 200 },
      spec: { type: "spark-area" as const },
    });

    expect(model.stats?.warnings?.some((w) => w.code === "EMPTY_DATA")).toBe(
      true,
    );
  });

  test("does not emit EMPTY_DATA when chart has no emptyDataWarningMessage", () => {
    const model = computeModel({
      data: { max: 100, value: 0 },
      size: { height: 32, width: 200 },
      spec: { type: "bar" as const },
    });

    const hasEmptyWarning =
      model.stats?.warnings?.some((w) => w.code === "EMPTY_DATA") ?? false;
    expect(hasEmptyWarning).toBe(false);
  });

  test("emits MARK_OUT_OF_BOUNDS when marks exceed the viewport", () => {
    const model = computeModel({
      data: { max: 100, value: 50 },
      size: { height: 10, width: 2 },
      spec: { type: "bar" as const },
    });

    expect(model.marks.length).toBeGreaterThan(0);
    expect(
      model.stats?.warnings?.some((w) => w.code === "MARK_OUT_OF_BOUNDS"),
    ).toBe(true);
  });

  test("emits NAN_COORDINATE when numeric inputs are non-finite", () => {
    const model = computeModel({
      data: { max: 100, value: 50 },
      size: { height: 10, width: Number.NaN },
      spec: { pad: Number.POSITIVE_INFINITY, type: "bar" as const },
    });

    expect(
      model.stats?.warnings?.some((w) => w.code === "NAN_COORDINATE"),
    ).toBe(true);
  });

  test("computeA11y uses a generic label when spec and normalized mismatch", () => {
    const spec: ChartSpec = { type: "bar" };
    const normalized: NormalizedSparkline = {
      max: 1,
      min: 0,
      series: [0, 1],
      type: "sparkline",
    };

    const a11y = computeA11y(spec, normalized, {
      height: 10,
      pad: 0,
      width: 10,
    });

    expect(a11y.label).toBe("Chart (bar)");
  });

  test("emits MISSING_DEF when marks reference missing defs", () => {
    const marks: Mark[] = [
      {
        clipPath: "clip-missing",
        h: 1,
        id: "a",
        type: "rect",
        w: 1,
        x: 0,
        y: 0,
      },
      { h: 1, id: "b", mask: "mask-missing", type: "rect", w: 1, x: 0, y: 0 },
      {
        filter: "filter-missing",
        h: 1,
        id: "c",
        type: "rect",
        w: 1,
        x: 0,
        y: 0,
      },
      {
        fill: "url(#pat-missing)",
        h: 1,
        id: "d",
        type: "rect",
        w: 1,
        x: 0,
        y: 0,
      },
      {
        fill: "url('#clip-ok')",
        h: 1,
        id: "e",
        type: "rect",
        w: 1,
        x: 0,
        y: 0,
      },
      {
        fill: "url(#pat-missing)",
        h: 1,
        id: "f",
        type: "rect",
        w: 1,
        x: 0,
        y: 0,
      },
    ];

    const defs: Def[] = [
      { h: 1, id: "clip-ok", type: "clipRect", w: 1, x: 0, y: 0 },
      {
        id: "grad-ok",
        stops: [{ color: "#000", offset: 0 }],
        type: "linearGradient",
      },
    ];

    const warnings: DiagnosticWarning[] = [];
    validateDefReferences(marks, defs, warnings);

    const missing = warnings.filter((w) => w.code === "MISSING_DEF");
    expect(missing).toHaveLength(5);
    expect(
      missing.filter((w) => w.message.includes("#pat-missing")),
    ).toHaveLength(1);
    expect(
      missing.some(
        (w) =>
          w.message.includes("clipPath") && w.message.includes("#clip-missing"),
      ),
    ).toBe(true);
    expect(
      missing.some(
        (w) =>
          w.message.includes("mask") && w.message.includes("#mask-missing"),
      ),
    ).toBe(true);
    expect(
      missing.some(
        (w) =>
          w.message.includes("filter") && w.message.includes("#filter-missing"),
      ),
    ).toBe(true);
    expect(
      missing.some(
        (w) => w.message.includes("fill") && w.message.includes("#clip-ok"),
      ),
    ).toBe(true);
  });
});
