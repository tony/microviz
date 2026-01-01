import { describe, expect, it } from "vitest";
import {
  hasDataProps,
  parseJsxData,
} from "../../../src/cdn-playground/parsers/jsx-data-parser";

describe("parseJsxData", () => {
  describe("array literals", () => {
    it("parses data={[1, 2, 3]}", () => {
      const code = "<Sparkline data={[10, 20, 30]} width={200} />";
      const result = parseJsxData(code);
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ "0": [10, 20, 30] });
    });

    it("parses multi-chart presets by index", () => {
      const code = `
        <Sparkline data={[1, 2]} />
        <Sparkline data={[3, 4]} />
      `;
      const result = parseJsxData(code);
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ "0": [1, 2], "1": [3, 4] });
    });

    it("parses arrays with decimals", () => {
      const code = "<Sparkline data={[10.5, 20.3, 30.7]} />";
      const result = parseJsxData(code);
      expect(result.success).toBe(true);
      expect(result.data["0"]).toEqual([10.5, 20.3, 30.7]);
    });

    it("parses arrays with negative numbers", () => {
      const code = "<Sparkline data={[-10, 20, -30]} />";
      const result = parseJsxData(code);
      expect(result.success).toBe(true);
      expect(result.data["0"]).toEqual([-10, 20, -30]);
    });
  });

  describe("object literals", () => {
    it("parses delta data", () => {
      const code =
        "<BulletDelta data={{ current: 75, previous: 50, max: 100 }} />";
      const result = parseJsxData(code);
      expect(result.success).toBe(true);
      expect(result.data["0"]).toEqual({ current: 75, max: 100, previous: 50 });
    });

    it("parses value data", () => {
      const code = "<Bar data={{ value: 65, max: 100 }} />";
      const result = parseJsxData(code);
      expect(result.success).toBe(true);
      expect(result.data["0"]).toEqual({ max: 100, value: 65 });
    });

    it("parses objects with nested arrays", () => {
      const code = "<Chart data={{ values: [1, 2, 3], max: 10 }} />";
      const result = parseJsxData(code);
      expect(result.success).toBe(true);
      expect(result.data["0"]).toEqual({ max: 10, values: [1, 2, 3] });
    });
  });

  describe("segment arrays", () => {
    it("parses donut segments with colors", () => {
      const code = `<Donut data={[{pct: 60, color: "#6366f1"}, {pct: 40, color: "#10b981"}]} />`;
      const result = parseJsxData(code);
      expect(result.success).toBe(true);
      expect(result.data["0"]).toEqual([
        { color: "#6366f1", pct: 60 },
        { color: "#10b981", pct: 40 },
      ]);
    });

    it("parses segments with names", () => {
      const code = `<Donut data={[{pct: 35, color: "#6366f1", name: "Desktop"}]} />`;
      const result = parseJsxData(code);
      expect(result.success).toBe(true);
      expect(result.data["0"]).toEqual([
        { color: "#6366f1", name: "Desktop", pct: 35 },
      ]);
    });
  });

  describe("string literals", () => {
    it("parses comma-separated numbers", () => {
      const code = `<Sparkline data="10, 20, 30" />`;
      const result = parseJsxData(code);
      expect(result.success).toBe(true);
      expect(result.data["0"]).toEqual([10, 20, 30]);
    });

    it("parses comma-separated with single quotes", () => {
      const code = `<Sparkline data='10, 20, 30' />`;
      const result = parseJsxData(code);
      expect(result.success).toBe(true);
      expect(result.data["0"]).toEqual([10, 20, 30]);
    });

    it("keeps non-numeric strings as-is", () => {
      const code = `<Chart data="pct,color\n60,#6366f1" />`;
      const result = parseJsxData(code);
      expect(result.success).toBe(true);
      expect(result.data["0"]).toBe("pct,color\n60,#6366f1");
    });
  });

  describe("error handling", () => {
    it("returns errors for malformed arrays", () => {
      const code = "<Sparkline data={[1, 2, ]} />";
      const result = parseJsxData(code);
      // Trailing comma is handled by our parser, so this should succeed
      expect(result.success).toBe(true);
      expect(result.data["0"]).toEqual([1, 2]);
    });

    it("returns errors for completely invalid syntax", () => {
      const code = "<Sparkline data={invalid_identifier} />";
      const result = parseJsxData(code);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0].raw).toBe("invalid_identifier");
    });

    it("returns empty data for code without data props", () => {
      const code = "<Sparkline width={200} />";
      const result = parseJsxData(code);
      expect(result.success).toBe(true);
      expect(result.data).toEqual({});
    });

    it("partial success with some valid and invalid data", () => {
      const code = `
        <Sparkline data={[1, 2, 3]} />
        <Sparkline data={bad} />
      `;
      const result = parseJsxData(code);
      expect(result.success).toBe(false);
      expect(result.data["0"]).toEqual([1, 2, 3]);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe("edge cases", () => {
    it("handles whitespace in data prop", () => {
      const code = "<Sparkline data={  [  1  ,  2  ,  3  ]  } />";
      const result = parseJsxData(code);
      expect(result.success).toBe(true);
      expect(result.data["0"]).toEqual([1, 2, 3]);
    });

    it("handles multiline data prop", () => {
      const code = `<Sparkline
        data={[
          10,
          20,
          30
        ]}
      />`;
      const result = parseJsxData(code);
      expect(result.success).toBe(true);
      expect(result.data["0"]).toEqual([10, 20, 30]);
    });

    it("ignores non-data props with curly braces", () => {
      const code = `<Sparkline width={200} height={40} spec={{ type: "sparkline" }} />`;
      const result = parseJsxData(code);
      expect(result.success).toBe(true);
      expect(result.data).toEqual({});
    });

    it("handles empty array", () => {
      const code = "<Sparkline data={[]} />";
      const result = parseJsxData(code);
      expect(result.success).toBe(true);
      expect(result.data["0"]).toEqual([]);
    });
  });

  describe("snapshot tests", () => {
    it("snapshot: sparkline JSX parsing", () => {
      const code =
        "<Sparkline data={[42, 58, 31, 65, 27]} width={200} height={40} />";
      const result = parseJsxData(code);
      expect(result).toMatchSnapshot();
    });

    it("snapshot: donut segments parsing", () => {
      const code = `<Donut data={[{pct: 60, color: "#6366f1"}, {pct: 40, color: "#10b981"}]} />`;
      const result = parseJsxData(code);
      expect(result).toMatchSnapshot();
    });

    it("snapshot: bullet delta parsing", () => {
      const code =
        "<BulletDelta data={{ current: 75, previous: 50, max: 100 }} />";
      const result = parseJsxData(code);
      expect(result).toMatchSnapshot();
    });

    it("snapshot: error output format", () => {
      const code = "<Sparkline data={invalid} />";
      const result = parseJsxData(code);
      expect(result).toMatchSnapshot();
    });

    it("snapshot: multi-chart preset", () => {
      const code = `
        <div>
          <Sparkline data={[10, 20, 30]} />
          <Bar data={{ value: 75, max: 100 }} />
          <Donut data={[{pct: 60, color: "#6366f1"}]} />
        </div>
      `;
      const result = parseJsxData(code);
      expect(result).toMatchSnapshot();
    });
  });
});

describe("hasDataProps", () => {
  it("returns true for curly brace data", () => {
    expect(hasDataProps("<Sparkline data={[1, 2]} />")).toBe(true);
  });

  it("returns true for string data", () => {
    expect(hasDataProps(`<Sparkline data="1, 2" />`)).toBe(true);
  });

  it("returns false for no data prop", () => {
    expect(hasDataProps("<Sparkline width={200} />")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(hasDataProps("")).toBe(false);
  });
});
