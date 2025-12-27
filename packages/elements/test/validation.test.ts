import { describe, expect, it } from "vitest";
import { parseNumberArray } from "../src/parse";

describe("parseNumberArray with validation modes", () => {
  describe("default mode (strict=false)", () => {
    it("silently drops invalid values", () => {
      const result = parseNumberArray("10, 25, 30,;;");
      expect(result.data).toEqual([10, 25, 30]);
      expect(result.dropped).toBeUndefined();
    });

    it("parses valid JSON arrays", () => {
      const result = parseNumberArray("[1, 2, 3]");
      expect(result.data).toEqual([1, 2, 3]);
      expect(result.dropped).toBeUndefined();
    });

    it("handles empty string", () => {
      const result = parseNumberArray("");
      expect(result.data).toEqual([]);
      expect(result.dropped).toBeUndefined();
    });

    it("handles null", () => {
      const result = parseNumberArray(null);
      expect(result.data).toEqual([]);
      expect(result.dropped).toBeUndefined();
    });
  });

  describe("strict mode", () => {
    it("tracks dropped invalid values", () => {
      const result = parseNumberArray("10, 25, 30,;;", true);
      expect(result.data).toEqual([10, 25, 30]);
      // Only ";;" is dropped - consecutive delimiters are consumed together
      expect(result.dropped).toEqual([";;"]);
    });

    it("does not report empty tokens (consecutive delimiters consumed)", () => {
      // "1, , 3" splits to ["1", "3"] - regex consumes consecutive delimiters
      const result = parseNumberArray("1, , 3", true);
      expect(result.data).toEqual([1, 3]);
      expect(result.dropped).toBeUndefined();
    });

    it("reports text values as dropped", () => {
      const result = parseNumberArray("1, foo, 3, bar", true);
      expect(result.data).toEqual([1, 3]);
      expect(result.dropped).toEqual(["foo", "bar"]);
    });

    it("omits dropped property when all values are valid", () => {
      const result = parseNumberArray("10, 25, 30", true);
      expect(result.data).toEqual([10, 25, 30]);
      // No dropped property when nothing was dropped
      expect(result.dropped).toBeUndefined();
    });

    it("handles JSON arrays with invalid values", () => {
      const result = parseNumberArray('[1, "invalid", 3]', true);
      expect(result.data).toEqual([1, 3]);
      expect(result.dropped).toEqual(["invalid"]);
    });

    it("omits dropped property for valid JSON arrays", () => {
      const result = parseNumberArray("[1, 2, 3]", true);
      expect(result.data).toEqual([1, 2, 3]);
      expect(result.dropped).toBeUndefined();
    });
  });
});
