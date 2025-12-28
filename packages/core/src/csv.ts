export type CsvParseOptions = {
  delimiter?: string;
  header?: boolean | "auto";
  trim?: boolean;
};

export type CsvTable = {
  headers: string[] | null;
  rows: string[][];
};

const DEFAULT_DELIMITER = ",";
const DEFAULT_HEADER: CsvParseOptions["header"] = "auto";
const DEFAULT_TRIM = true;

function isNumericCell(value: string): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  return Number.isFinite(Number(trimmed));
}

function normalizeHeaders(headers: string[]): string[] {
  return headers.map((header, index) =>
    header.trim() ? header.trim() : `column${index + 1}`,
  );
}

function dropEmptyRows(rows: string[][]): string[][] {
  return rows.filter((row) => row.some((cell) => cell.trim() !== ""));
}

function parseCsvRows(
  text: string,
  delimiter: string,
  trim: boolean,
): string[][] {
  if (!text) return [];
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  const pushField = () => {
    row.push(trim ? field.trim() : field);
    field = "";
  };

  const pushRow = () => {
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        field += '"';
        i += 1;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }

    if (!inQuotes && char === delimiter) {
      pushField();
      continue;
    }

    if (!inQuotes && (char === "\n" || char === "\r")) {
      pushField();
      pushRow();
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      continue;
    }

    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    pushField();
    pushRow();
  }

  return dropEmptyRows(rows);
}

function resolveHeaders(
  rows: string[][],
  headerMode: CsvParseOptions["header"],
): { headers: string[] | null; rows: string[][] } {
  if (rows.length === 0) return { headers: null, rows };

  if (headerMode === true) {
    return {
      headers: normalizeHeaders(rows[0] ?? []),
      rows: rows.slice(1),
    };
  }

  if (headerMode === "auto" && rows.length >= 2) {
    const first = rows[0] ?? [];
    const second = rows[1] ?? [];
    const firstNumeric = first.filter(isNumericCell).length;
    const secondNumeric = second.filter(isNumericCell).length;
    if (firstNumeric === 0 && secondNumeric > 0) {
      return {
        headers: normalizeHeaders(first),
        rows: rows.slice(1),
      };
    }
  }

  return { headers: null, rows };
}

export function parseCsv(
  text: string,
  options: CsvParseOptions = {},
): CsvTable {
  const delimiter = options.delimiter ?? DEFAULT_DELIMITER;
  const headerMode = options.header ?? DEFAULT_HEADER;
  const trim = options.trim ?? DEFAULT_TRIM;

  const rows = parseCsvRows(text, delimiter, trim);
  const resolved = resolveHeaders(rows, headerMode);
  return resolved;
}

export type CsvRecord = Record<string, string | number>;

export type CsvRecordOptions = {
  coerceNumbers?: boolean;
};

function coerceValue(value: string, coerceNumbers: boolean): string | number {
  if (!coerceNumbers) return value;
  const trimmed = value.trim();
  if (!trimmed) return value;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : value;
}

export function csvToRecords(
  table: CsvTable,
  options: CsvRecordOptions = {},
): CsvRecord[] {
  const headers =
    table.headers ??
    Array.from(
      { length: table.rows[0]?.length ?? 0 },
      (_, i) => `column${i + 1}`,
    );
  const maxColumns = Math.max(
    headers.length,
    ...table.rows.map((r) => r.length),
  );
  const resolvedHeaders = Array.from(
    { length: maxColumns },
    (_, i) => headers[i] ?? `column${i + 1}`,
  );

  const coerceNumbers = options.coerceNumbers ?? false;
  return table.rows.map((row) => {
    const record: CsvRecord = {};
    for (let i = 0; i < resolvedHeaders.length; i += 1) {
      const header = resolvedHeaders[i];
      const value = row[i] ?? "";
      record[header] = coerceValue(value, coerceNumbers);
    }
    return record;
  });
}

export type CsvNumberSeries = {
  series: number[];
  columnIndex: number;
  header?: string;
  orientation: "row" | "column";
};

function coerceNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function rowToSeries(row: string[]): number[] | null {
  const series: number[] = [];
  for (const cell of row) {
    const num = coerceNumber(cell);
    if (num === null) return null;
    series.push(num);
  }
  return series;
}

function columnToSeries(
  rows: string[][],
  columnIndex: number,
): number[] | null {
  const series: number[] = [];
  for (const row of rows) {
    const cell = row[columnIndex];
    if (cell === undefined) return null;
    const num = coerceNumber(cell);
    if (num === null) return null;
    series.push(num);
  }
  return series;
}

export function csvToNumberSeries(table: CsvTable): CsvNumberSeries | null {
  const rows = table.rows;
  if (rows.length === 0) return null;

  const columnCount = Math.max(...rows.map((row) => row.length));
  if (columnCount === 0) return null;

  if (rows.length === 1 && columnCount > 1) {
    const series = rowToSeries(rows[0] ?? []);
    if (!series) return null;
    return { columnIndex: 0, orientation: "row", series };
  }

  if (columnCount === 1) {
    const series = columnToSeries(rows, 0);
    if (!series) return null;
    return {
      columnIndex: 0,
      header: table.headers?.[0],
      orientation: "column",
      series,
    };
  }

  for (let col = 0; col < columnCount; col += 1) {
    const series = columnToSeries(rows, col);
    if (series) {
      return {
        columnIndex: col,
        header: table.headers?.[col],
        orientation: "column",
        series,
      };
    }
  }

  return null;
}
