import { describe, expect, test } from "vitest";
import type { PathMark } from "../../model";
import {
  arePathsCompatible,
  interpolatePath,
  interpolatePathMark,
  parsePath,
  serializePath,
} from "../pathMorph";

describe("parsePath", () => {
  test("parses simple move and line commands", () => {
    const cmds = parsePath("M 0 0 L 10 20");
    expect(cmds).toEqual([
      { args: [0, 0], type: "M" },
      { args: [10, 20], type: "L" },
    ]);
  });

  test("parses commands without spaces", () => {
    const cmds = parsePath("M0,0L10,20");
    expect(cmds).toEqual([
      { args: [0, 0], type: "M" },
      { args: [10, 20], type: "L" },
    ]);
  });

  test("parses close path command", () => {
    const cmds = parsePath("M0,0L10,10L10,0Z");
    expect(cmds).toEqual([
      { args: [0, 0], type: "M" },
      { args: [10, 10], type: "L" },
      { args: [10, 0], type: "L" },
      { args: [], type: "Z" },
    ]);
  });

  test("parses arc commands", () => {
    const cmds = parsePath("M 10 10 A 5 5 0 0 1 15 15");
    expect(cmds).toEqual([
      { args: [10, 10], type: "M" },
      { args: [5, 5, 0, 0, 1, 15, 15], type: "A" },
    ]);
  });

  test("parses cubic bezier commands", () => {
    const cmds = parsePath("M0,0C10,10,20,10,30,0");
    expect(cmds).toEqual([
      { args: [0, 0], type: "M" },
      { args: [10, 10, 20, 10, 30, 0], type: "C" },
    ]);
  });

  test("parses negative numbers", () => {
    const cmds = parsePath("M-10,-20L10,20");
    expect(cmds).toEqual([
      { args: [-10, -20], type: "M" },
      { args: [10, 20], type: "L" },
    ]);
  });

  test("parses decimal numbers", () => {
    const cmds = parsePath("M0.5,1.5L2.25,3.75");
    expect(cmds).toEqual([
      { args: [0.5, 1.5], type: "M" },
      { args: [2.25, 3.75], type: "L" },
    ]);
  });

  test("returns empty array for empty string", () => {
    expect(parsePath("")).toEqual([]);
  });
});

describe("serializePath", () => {
  test("serializes simple commands", () => {
    const cmds = [
      { args: [0, 0], type: "M" },
      { args: [10, 20], type: "L" },
    ];
    expect(serializePath(cmds)).toBe("M0,0L10,20");
  });

  test("serializes close path command", () => {
    const cmds = [
      { args: [0, 0], type: "M" },
      { args: [10, 10], type: "L" },
      { args: [], type: "Z" },
    ];
    expect(serializePath(cmds)).toBe("M0,0L10,10Z");
  });

  test("rounds to 4 decimal places", () => {
    const cmds = [{ args: [0.123456789, 0.987654321], type: "M" }];
    expect(serializePath(cmds)).toBe("M0.1235,0.9877");
  });
});

describe("arePathsCompatible", () => {
  test("returns true for identical structure", () => {
    const a = [
      { args: [0, 0], type: "M" },
      { args: [10, 20], type: "L" },
    ];
    const b = [
      { args: [5, 5], type: "M" },
      { args: [15, 25], type: "L" },
    ];
    expect(arePathsCompatible(a, b)).toBe(true);
  });

  test("returns false for different lengths", () => {
    const a = [{ args: [0, 0], type: "M" }];
    const b = [
      { args: [0, 0], type: "M" },
      { args: [10, 10], type: "L" },
    ];
    expect(arePathsCompatible(a, b)).toBe(false);
  });

  test("returns false for different command types", () => {
    const a = [
      { args: [0, 0], type: "M" },
      { args: [10, 10], type: "L" },
    ];
    const b = [
      { args: [0, 0], type: "M" },
      { args: [5, 5, 10, 5, 10, 10], type: "C" },
    ];
    expect(arePathsCompatible(a, b)).toBe(false);
  });

  test("returns false for different argument counts", () => {
    const a = [{ args: [10, 10, 20, 10, 30, 0], type: "C" }];
    const b = [{ args: [10, 10, 30, 0], type: "C" }]; // Wrong arg count
    expect(arePathsCompatible(a, b)).toBe(false);
  });
});

describe("interpolatePath", () => {
  test("interpolates compatible paths", () => {
    const from = [
      { args: [0, 0], type: "M" },
      { args: [10, 20], type: "L" },
    ];
    const to = [
      { args: [10, 10], type: "M" },
      { args: [30, 40], type: "L" },
    ];

    const mid = interpolatePath(from, to, 0.5);
    expect(mid).toEqual([
      { args: [5, 5], type: "M" },
      { args: [20, 30], type: "L" },
    ]);
  });

  test("snaps to target for incompatible paths", () => {
    const from = [{ args: [0, 0], type: "M" }];
    const to = [
      { args: [0, 0], type: "M" },
      { args: [10, 10], type: "L" },
    ];

    expect(interpolatePath(from, to, 0.5)).toEqual(to);
  });

  test("interpolates arc commands", () => {
    const from = [
      { args: [0, 0], type: "M" },
      { args: [5, 5, 0, 0, 1, 10, 10], type: "A" },
    ];
    const to = [
      { args: [10, 10], type: "M" },
      { args: [10, 10, 0, 0, 1, 30, 30], type: "A" },
    ];

    const mid = interpolatePath(from, to, 0.5);
    expect(mid[0].args).toEqual([5, 5]);
    expect(mid[1].args).toEqual([7.5, 7.5, 0, 0, 1, 20, 20]);
  });
});

describe("interpolatePathMark", () => {
  test("interpolates compatible path marks", () => {
    const from: PathMark = {
      d: "M0,0L10,20",
      id: "p1",
      type: "path",
    };
    const to: PathMark = {
      d: "M10,10L30,40",
      id: "p1",
      type: "path",
    };

    const mid = interpolatePathMark(from, to, 0.5);
    expect(mid.type).toBe("path");
    expect(mid.id).toBe("p1");
    // The d attribute should be interpolated
    const parsed = parsePath(mid.d);
    expect(parsed[0].args).toEqual([5, 5]);
    expect(parsed[1].args).toEqual([20, 30]);
  });

  test("snaps to target for incompatible paths at t<1", () => {
    const from: PathMark = {
      d: "M0,0L10,10",
      id: "p1",
      type: "path",
    };
    const to: PathMark = {
      d: "M0,0L10,10L20,0Z",
      id: "p1",
      type: "path",
    };

    // Incompatible: different command count
    const mid = interpolatePathMark(from, to, 0.5);
    expect(mid).toBe(from); // Should stay at from until t=1
  });

  test("snaps to target for incompatible paths at t=1", () => {
    const from: PathMark = {
      d: "M0,0L10,10",
      id: "p1",
      type: "path",
    };
    const to: PathMark = {
      d: "M0,0L10,10L20,0Z",
      id: "p1",
      type: "path",
    };

    const end = interpolatePathMark(from, to, 1);
    expect(end).toBe(to);
  });

  test("interpolates opacity values", () => {
    const from: PathMark = {
      d: "M0,0L10,10",
      id: "p1",
      opacity: 0,
      strokeWidth: 1,
      type: "path",
    };
    const to: PathMark = {
      d: "M10,10L20,20",
      id: "p1",
      opacity: 1,
      strokeWidth: 5,
      type: "path",
    };

    const mid = interpolatePathMark(from, to, 0.5);
    expect(mid.opacity).toBe(0.5);
    expect(mid.strokeWidth).toBe(3);
  });
});
