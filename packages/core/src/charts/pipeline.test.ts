import { describe, expect, test } from "vitest";
import { computeModel } from "../compute";

describe("pipeline", () => {
  test("produces a deterministic RenderModel", () => {
    const input = {
      data: [
        { color: "#ef4444", name: "A", pct: 50 },
        { color: "#22c55e", name: "B", pct: 30 },
        { color: "#3b82f6", name: "C", pct: 20 },
      ],
      size: { height: 10, width: 100 },
      spec: { overlap: 8, pad: 0, type: "pipeline" as const },
    };

    const a = computeModel(input);
    const b = computeModel(input);

    expect(a).toEqual(b);
    expect(a.marks.length).toBe(3);
    expect(a.stats?.warnings).toBeUndefined();
    expect(a.marks.every((m) => m.type === "path")).toBe(true);

    const first = a.marks.find((m) => m.id === "pipeline-seg-0");
    const middle = a.marks.find((m) => m.id === "pipeline-seg-1");
    const last = a.marks.find((m) => m.id === "pipeline-seg-2");

    expect(first?.type).toBe("path");
    expect(middle?.type).toBe("path");
    expect(last?.type).toBe("path");

    if (first?.type === "path") {
      expect(first.d).toBe(
        "M 0.00 0.00 L 50.00 0.00 L 58.00 5.00 L 50.00 10.00 L 0.00 10.00 Z",
      );
      expect(first.fill).toBe("#ef4444");
    }

    if (middle?.type === "path") {
      expect(middle.d).toBe(
        "M 50.00 0.00 L 80.00 0.00 L 88.00 5.00 L 80.00 10.00 L 50.00 10.00 L 58.00 5.00 Z",
      );
      expect(middle.fill).toBe("#22c55e");
    }

    if (last?.type === "path") {
      expect(last.d).toBe(
        "M 80.00 0.00 L 100.00 0.00 L 100.00 10.00 L 80.00 10.00 L 88.00 5.00 Z",
      );
      expect(last.fill).toBe("#3b82f6");
    }
  });
});
