import { describe, expect, it } from "vitest";
import { csvToNumberSeries, csvToRecords, parseCsv } from "./csv";

describe("parseCsv", () => {
  it("detects headers and returns rows", () => {
    const table = parseCsv("name,value\nA,10\nB,20");
    expect(table.headers).toEqual(["name", "value"]);
    expect(table.rows).toEqual([
      ["A", "10"],
      ["B", "20"],
    ]);
  });

  it("handles quoted cells with delimiters", () => {
    const table = parseCsv('label,value\n"North, East",42');
    expect(table.headers).toEqual(["label", "value"]);
    expect(table.rows[0]).toEqual(["North, East", "42"]);
  });
});

describe("csv helpers", () => {
  it("coerces numeric fields when requested", () => {
    const table = parseCsv("name,value\nA,10\nB,20");
    const records = csvToRecords(table, { coerceNumbers: true });
    expect(records[0]).toEqual({ name: "A", value: 10 });
    expect(records[1]).toEqual({ name: "B", value: 20 });
  });

  it("extracts a numeric series from a single row", () => {
    const table = parseCsv("1,2,3", { header: false });
    const series = csvToNumberSeries(table);
    expect(series?.orientation).toBe("row");
    expect(series?.series).toEqual([1, 2, 3]);
  });

  it("extracts a numeric series from a single column", () => {
    const table = parseCsv("value\n1\n2\n3");
    const series = csvToNumberSeries(table);
    expect(series?.orientation).toBe("column");
    expect(series?.header).toBe("value");
    expect(series?.series).toEqual([1, 2, 3]);
  });

  it("selects the first numeric column in multi-column data", () => {
    const table = parseCsv("a,b\n1,2\n3,4", { header: true });
    const series = csvToNumberSeries(table);
    expect(series?.columnIndex).toBe(0);
    expect(series?.series).toEqual([1, 3]);
  });
});
