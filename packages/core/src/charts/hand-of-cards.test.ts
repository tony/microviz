import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";

describe("hand-of-cards", () => {
  test("produces a deterministic RenderModel", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 40 },
        { color: "#22c55e", name: "B", pct: 35 },
        { color: "#3b82f6", name: "C", pct: 25 },
      ],
      size: { height: 60, width: 100 },
      spec: { pad: 0, type: "hand-of-cards" as const },
    };

    const a = computeModel(input);
    const b = computeModel(input);

    expect(a).toEqual(b);
    // 3 segments = 3 cards
    expect(a.marks.length).toBe(3);
    expect(a.stats?.warnings).toBeUndefined();
  });

  test("creates overlapping rect marks", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 50 },
        { color: "#22c55e", name: "B", pct: 50 },
      ],
      size: { height: 60, width: 100 },
      spec: { overlap: 12, pad: 0, type: "hand-of-cards" as const },
    };

    const model = computeModel(input);
    const rects = model.marks.filter((m) => m.type === "rect");

    expect(rects.length).toBe(2);

    // All marks should be rect type with dimensions
    for (const rect of rects) {
      if (rect.type === "rect") {
        expect(rect.w).toBeGreaterThan(0);
        expect(rect.h).toBeGreaterThan(0);
        expect(rect.rx).toBe(4);
      }
    }
  });

  test("first segment renders on top (last in marks array)", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 50 },
        { color: "#22c55e", name: "B", pct: 50 },
      ],
      size: { height: 60, width: 100 },
      spec: { pad: 0, type: "hand-of-cards" as const },
    };

    const model = computeModel(input);

    // First segment (A) should be last in marks array (rendered on top)
    expect(model.marks[model.marks.length - 1]?.id).toBe(
      "hand-of-cards-card-0",
    );
    // Second segment (B) should be first (rendered below)
    expect(model.marks[0]?.id).toBe("hand-of-cards-card-1");
  });

  test("respects cardHeightPct", () => {
    const input = {
      data: [{ color: "#ef4444", name: "A", pct: 100 }],
      size: { height: 100, width: 100 },
      spec: {
        cardHeightPct: 50,
        pad: 0,
        type: "hand-of-cards" as const,
      },
    };

    const model = computeModel(input);
    expect(model.marks.length).toBe(1);

    const rect = model.marks[0];
    if (rect?.type === "rect") {
      // 50% of 100px height = 50px
      expect(rect.h).toBe(50);
    }
  });

  test("handles empty data gracefully", () => {
    const input = {
      data: [],
      size: { height: 60, width: 100 },
      spec: { type: "hand-of-cards" as const },
    };

    const model = computeModel(input);
    expect(model.marks.length).toBe(0);
  });

  test("cards overlap correctly", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 50 },
        { color: "#22c55e", name: "B", pct: 50 },
      ],
      size: { height: 60, width: 100 },
      spec: { overlap: 10, pad: 0, type: "hand-of-cards" as const },
    };

    const model = computeModel(input);
    const rects = model.marks.filter((m) => m.type === "rect");

    // With 2 equal segments and 10px overlap:
    // totalCardWidth = 100 + (2-1)*10 = 110
    // Each card is 50% of 110 = 55px
    // Second card starts at 55 - 10 = 45px
    expect(rects.length).toBe(2);

    if (rects[0]?.type === "rect" && rects[1]?.type === "rect") {
      const [first, second] = rects;
      // Cards should overlap (second card's x < first card's x + first card's width)
      expect(second.x).toBeLessThan(first.x + first.w);
    }
  });
});
