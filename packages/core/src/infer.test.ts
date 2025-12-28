import { describe, expect, it } from "vitest";
import { inferSeriesType, inferSpec, inferValueType } from "./infer";

describe("inferValueType", () => {
  it("classifies numeric values", () => {
    expect(inferValueType(42)).toBe("quantitative");
    expect(inferValueType("3.5")).toBe("quantitative");
  });

  it("classifies temporal values", () => {
    expect(inferValueType("2024-01-05")).toBe("temporal");
    expect(inferValueType(new Date("2024-01-05"))).toBe("temporal");
  });

  it("classifies nominal values", () => {
    expect(inferValueType("alpha")).toBe("nominal");
    expect(inferValueType(true)).toBe("nominal");
  });

  it("classifies unknown values", () => {
    expect(inferValueType("")).toBe("unknown");
    expect(inferValueType(null)).toBe("unknown");
  });
});

describe("inferSeriesType", () => {
  it("summarizes numeric series", () => {
    const summary = inferSeriesType([1, 2, 3]);
    expect(summary.kind).toBe("quantitative");
    expect(summary.numericCount).toBe(3);
  });

  it("summarizes temporal series", () => {
    const summary = inferSeriesType(["2024-01-01", "2024-01-02"]);
    expect(summary.kind).toBe("temporal");
    expect(summary.temporalCount).toBe(2);
  });

  it("summarizes nominal series", () => {
    const summary = inferSeriesType(["a", "b", "c"]);
    expect(summary.kind).toBe("nominal");
    expect(summary.nominalCount).toBe(3);
  });
});

describe("inferSpec", () => {
  it("infers sparkline from number arrays", () => {
    const result = inferSpec([1, 2, 3]);
    expect(result?.spec.type).toBe("sparkline");
    expect(result?.data).toEqual([1, 2, 3]);
  });

  it("infers donut from segment arrays", () => {
    const result = inferSpec([{ color: "#111", pct: 60 }]);
    expect(result?.spec.type).toBe("donut");
  });

  it("infers donut from segments field", () => {
    const result = inferSpec({
      segments: [
        { color: "#f00", pct: 40 },
        { color: "#0f0", pct: 60 },
      ],
    });
    expect(result?.spec.type).toBe("donut");
    expect(result?.reason).toBe("segments-field");
  });

  it("infers bullet-delta from current/previous data", () => {
    const result = inferSpec({ current: 8, max: 10, previous: 4 });
    expect(result?.spec.type).toBe("bullet-delta");
    expect(result?.data).toEqual({ current: 8, max: 10, previous: 4 });
  });

  it("infers dumbbell from current/target data", () => {
    const result = inferSpec({ current: 8, target: 10 });
    expect(result?.spec.type).toBe("dumbbell");
  });

  it("infers bar from value data", () => {
    const result = inferSpec({ max: 100, value: 45 });
    expect(result?.spec.type).toBe("bar");
  });

  it("infers histogram from series data", () => {
    const result = inferSpec({ series: [1, 2, 3] });
    expect(result?.spec.type).toBe("histogram");
    expect(result?.data).toEqual({ opacities: undefined, series: [1, 2, 3] });
  });

  it("uses fallback when inference fails", () => {
    const result = inferSpec({ foo: "bar" }, { fallbackType: "sparkline" });
    expect(result?.spec.type).toBe("sparkline");
    expect(result?.reason).toBe("fallback");
  });
});
