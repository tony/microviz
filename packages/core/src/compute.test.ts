import { describe, expect, test } from "vitest";
import { computeModel } from "./compute";

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
      data: [],
      size: { height: 32, width: 200 },
      spec: { type: "waveform" as const },
    });

    expect(model.stats?.warnings?.some((w) => w.code === "EMPTY_DATA")).toBe(
      false,
    );
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
});
