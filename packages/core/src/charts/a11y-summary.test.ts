import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";

describe("a11y summary", () => {
  test("infers series summaries", () => {
    const model = computeModel({
      data: [1, 2, 3, 2],
      size: { height: 80, width: 160 },
      spec: { type: "sparkline" },
    });

    expect(model.a11y?.summary).toMatchObject({
      count: 4,
      kind: "series",
      last: 2,
      max: 3,
      min: 1,
      trend: "up",
    });
    expect(model.a11y?.items?.[0]?.label).toBe("Point 1");
  });

  test("infers segment summaries", () => {
    const model = computeModel({
      data: [
        { color: "#2563eb", name: "A", pct: 50 },
        { color: "#f97316", name: "B", pct: 30 },
      ],
      size: { height: 80, width: 160 },
      spec: { type: "stacked-bar" },
    });

    const summary = model.a11y?.summary;
    expect(summary?.kind).toBe("segments");
    if (summary?.kind === "segments") {
      expect(summary.count).toBe(2);
      expect(summary.largestName).toBe("A");
      expect(summary.largestPct).toBeCloseTo(62.5, 1);
    }
    expect(model.a11y?.items?.[0]?.label).toBe("A");
    expect(model.a11y?.items?.[0]?.valueText).toContain("%");
  });
});
