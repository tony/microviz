import { describe, expect, it } from "vitest";
import type { Mark } from "../model";
import { applyFillRules, fillUrl } from "./defs";

describe("applyFillRules", () => {
  it("applies url(#id) fills using matchers", () => {
    const marks: Mark[] = [
      { h: 10, id: "a", type: "rect", w: 10, x: 0, y: 0 },
      { fill: "red", h: 10, id: "b", type: "rect", w: 10, x: 0, y: 0 },
      { className: "mv-line", d: "M 0 0 L 10 10", id: "c", type: "path" },
      { id: "d", type: "line", x1: 0, x2: 10, y1: 0, y2: 10 },
    ];

    const next = applyFillRules(marks, [
      { id: "pat-1", match: { id: "a", type: "rect" } },
      { id: "pat-2", match: { className: /mv-line/ } },
    ]);

    expect(next[0]).toMatchObject({ fill: fillUrl("pat-1"), id: "a" });
    expect(next[1]).toMatchObject({ fill: "red", id: "b" }); // no overwrite by default
    expect(next[2]).toMatchObject({ fill: fillUrl("pat-2"), id: "c" });
    expect(next[3]).toEqual(marks[3]); // lines don't have fill
  });

  it("can overwrite existing fills when requested", () => {
    const marks: Mark[] = [
      { fill: "red", h: 10, id: "a", type: "rect", w: 10, x: 0, y: 0 },
    ];

    const next = applyFillRules(marks, [{ id: "pat-1", match: { id: "a" } }], {
      overwrite: true,
    });

    expect(next[0]).toMatchObject({ fill: fillUrl("pat-1"), id: "a" });
  });
});
