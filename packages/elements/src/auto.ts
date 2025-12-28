import {
  type ChartSpec,
  csvToNumberSeries,
  csvToRecords,
  type DiagnosticWarning,
  inferSpec,
  isChartType,
  parseCsv,
} from "@microviz/core";
import { parseNumber, parseNumberArray } from "./parse";
import { createTelemetry } from "./telemetry";

const AUTO_STYLE =
  ":host{display:inline-block;} :host([hidden]){display:none;} microviz-chart{display:block;width:100%;height:100%;}";

const FORWARDED_ATTRS = [
  "animate",
  "autosize",
  "height",
  "hit-slop",
  "interactive",
  "renderer",
  "skeleton",
  "telemetry",
  "width",
];

type Candidate = {
  source: string;
  value: unknown;
  dropped?: string[];
};

type InferenceResult = {
  data: unknown;
  reason: string;
  source: string;
  spec: ChartSpec;
};

type JsonParseResult =
  | { ok: true; value: unknown }
  | { ok: false; error: string };

function parseJson(value: string): JsonParseResult {
  try {
    return { ok: true, value: JSON.parse(value) };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Invalid JSON",
      ok: false,
    };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isUsableData(value: unknown): boolean {
  return Array.isArray(value) || isRecord(value);
}

function normalizeRecordKeys(
  record: Record<string, unknown>,
): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    const trimmed = key.trim();
    if (!trimmed) continue;
    normalized[trimmed.toLowerCase()] = value;
  }
  return normalized;
}

function recordHasSegmentFields(record: Record<string, unknown>): boolean {
  const normalized = normalizeRecordKeys(record);
  return (
    typeof normalized.pct === "number" && typeof normalized.color === "string"
  );
}

function normalizeRecords(
  records: Record<string, unknown>[],
): Record<string, unknown>[] {
  return records.map(normalizeRecordKeys);
}

function buildCandidates(
  raw: string | null,
  warnings: DiagnosticWarning[],
): {
  candidates: Candidate[];
  fallbackData: unknown | null;
} {
  const candidates: Candidate[] = [];
  let fallbackData: unknown | null = null;
  let text = raw?.trim() ?? "";

  if (text) {
    const looksJson =
      text.startsWith("{") || text.startsWith("[") || text.startsWith('"');
    if (looksJson) {
      const result = parseJson(text);
      if (!result.ok) {
        warnings.push({
          code: "INVALID_JSON",
          example: '<microviz-auto data="[1, 2, 3]"></microviz-auto>',
          hint: "Ensure valid JSON syntax for data",
          message: `Failed to parse data attribute: ${result.error}`,
          phase: "input",
        });
      } else if (typeof result.value === "string") {
        text = result.value;
      } else {
        if (Array.isArray(result.value) && result.value.length === 1) {
          const first = result.value[0];
          if (isRecord(first)) {
            candidates.push({ source: "json-record", value: first });
          }
        }
        candidates.push({ source: "json", value: result.value });
        if (isUsableData(result.value)) fallbackData ??= result.value;
      }
    }
  }

  if (text) {
    const table = parseCsv(text);
    const rawRecords = csvToRecords(table, { coerceNumbers: true });
    const records = normalizeRecords(rawRecords);
    const hasSegmentFields = records.some(recordHasSegmentFields);

    if (records.length === 1) {
      candidates.push({ source: "csv-record", value: records[0] });
      fallbackData ??= records[0];
    }

    if (hasSegmentFields && records.length > 0) {
      candidates.push({ source: "csv-segments", value: records });
      fallbackData ??= records;
    }

    const series = csvToNumberSeries(table);
    if (series) {
      candidates.push({ source: "csv-series", value: series.series });
      fallbackData ??= series.series;
    }

    if (!hasSegmentFields && records.length > 0) {
      candidates.push({ source: "csv-records", value: records });
      fallbackData ??= records;
    }
  }

  if (text) {
    const numberResult = parseNumberArray(text, true);
    if (numberResult.data.length > 0) {
      candidates.push({
        dropped: numberResult.dropped,
        source: "numbers",
        value: numberResult.data,
      });
      fallbackData ??= numberResult.data;
    }
  }

  return { candidates, fallbackData };
}

function inferFromCandidates(candidates: Candidate[]): InferenceResult | null {
  for (const candidate of candidates) {
    const inferred = inferSpec(candidate.value);
    if (!inferred) continue;
    return {
      data: inferred.data,
      reason: inferred.reason,
      source: candidate.source,
      spec: inferred.spec,
    };
  }
  return null;
}

function syncAttribute(
  source: HTMLElement,
  target: HTMLElement,
  name: string,
): void {
  const value = source.getAttribute(name);
  if (value === null) {
    if (target.hasAttribute(name)) target.removeAttribute(name);
    return;
  }
  if (target.getAttribute(name) !== value) target.setAttribute(name, value);
}

export class MicrovizAuto extends HTMLElement {
  static observedAttributes = ["data", "type", "pad", ...FORWARDED_ATTRS];

  readonly #root: ShadowRoot;
  #chart: HTMLElement | null = null;
  #lastWarningKey: string | null = null;

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = AUTO_STYLE;
    this.#root.append(style);
  }

  connectedCallback(): void {
    this.render();
  }

  attributeChangedCallback(): void {
    this.render();
  }

  render(): void {
    const telemetry = createTelemetry(this);
    const parseStart = telemetry.enabled ? performance.now() : 0;

    this.#ensureChart();
    this.#syncForwardedAttrs();

    const warnings: DiagnosticWarning[] = [];
    const rawData = this.getAttribute("data");
    const typeAttr = this.getAttribute("type");
    const type = typeAttr && isChartType(typeAttr) ? typeAttr : null;
    if (typeAttr && !type) {
      warnings.push({
        code: "UNKNOWN_CHART_TYPE",
        example:
          '<microviz-auto data="[1,2,3]" type="sparkline"></microviz-auto>',
        hint: "Use a supported chart type",
        message: `Unknown chart type: ${typeAttr}`,
        phase: "input",
      });
    }

    const { candidates, fallbackData } = buildCandidates(rawData, warnings);

    let inferred: InferenceResult | null = null;
    let selectedCandidate: Candidate | null = null;

    if (!type) {
      inferred = inferFromCandidates(candidates);
      if (inferred) {
        selectedCandidate =
          candidates.find(
            (candidate) => candidate.source === inferred?.source,
          ) ?? null;
      }
    }

    if (!inferred && type && fallbackData !== null) {
      inferred = {
        data: fallbackData,
        reason: "explicit",
        source: "explicit",
        spec: { type } as ChartSpec,
      };
    }

    const pad = this.hasAttribute("pad")
      ? parseNumber(this.getAttribute("pad"), 0)
      : undefined;

    let spec: ChartSpec | null = inferred?.spec ?? null;
    const data: unknown | null = inferred?.data ?? null;
    if (spec && pad !== undefined) {
      spec = { ...spec, pad } as ChartSpec;
    }

    if (!spec || data === null) {
      if (rawData?.trim()) {
        warnings.push({
          code: "INVALID_DATA_SHAPE",
          example: '<microviz-auto data="[1, 2, 3]"></microviz-auto>',
          hint: "Provide an array of numbers, segment objects (pct/color), or an object with current/previous",
          message: "Unable to infer a chart type from the provided data",
          phase: "input",
        });
      }
    }

    const numbersCandidate = candidates.find(
      (candidate) => candidate.source === "numbers",
    );
    const dropped =
      selectedCandidate?.source === "numbers"
        ? selectedCandidate.dropped
        : inferred?.data === numbersCandidate?.value
          ? numbersCandidate?.dropped
          : undefined;
    if (dropped) {
      if (dropped.length > 0) {
        warnings.push({
          code: "DROPPED_VALUES",
          hint: "Use valid numbers only",
          message: `Dropped ${dropped.length} invalid value(s): ${dropped
            .map((value) => `"${value}"`)
            .join(", ")}`,
          phase: "input",
        });
      }
    }

    const warningKey = warnings.length
      ? warnings
          .map((warning) => `${warning.code}:${warning.message}`)
          .join("|")
      : null;
    if (warningKey && warningKey !== this.#lastWarningKey) {
      this.#lastWarningKey = warningKey;
      this.dispatchEvent(
        new CustomEvent("microviz-warning", {
          bubbles: true,
          composed: true,
          detail: {
            element: this.tagName.toLowerCase(),
            renderer: this.getAttribute("renderer") === "html" ? "html" : "svg",
            specType: spec?.type,
            warnings,
          },
        }),
      );
    } else if (!warningKey) {
      this.#lastWarningKey = null;
    }

    if (telemetry.enabled) {
      telemetry.emit({
        durationMs: performance.now() - parseStart,
        phase: "parse",
        reason: inferred
          ? `infer:${inferred.reason}`
          : rawData?.trim()
            ? "infer:miss"
            : "infer:empty",
        specType: spec?.type,
        warningCodes: warnings.length
          ? warnings.map((warning) => warning.code)
          : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
      });
    }

    this.#syncInferenceAttributes(inferred);

    if (!spec || data === null) {
      this.#clearChartInputs();
      return;
    }

    const specValue = JSON.stringify(spec);
    const dataValue = JSON.stringify(data);
    if (this.#chart?.getAttribute("spec") !== specValue) {
      this.#chart?.setAttribute("spec", specValue);
    }
    if (this.#chart?.getAttribute("data") !== dataValue) {
      this.#chart?.setAttribute("data", dataValue);
    }
  }

  #ensureChart(): void {
    if (this.#chart) return;
    const chart = document.createElement("microviz-chart");
    this.#root.append(chart);
    this.#chart = chart;
  }

  #syncForwardedAttrs(): void {
    if (!this.#chart) return;
    for (const attr of FORWARDED_ATTRS) {
      syncAttribute(this, this.#chart, attr);
    }
  }

  #syncInferenceAttributes(inferred: InferenceResult | null): void {
    if (!inferred) {
      this.removeAttribute("data-inferred-type");
      this.removeAttribute("data-inferred-reason");
      this.removeAttribute("data-inferred-source");
      return;
    }

    this.setAttribute("data-inferred-type", inferred.spec.type);
    this.setAttribute("data-inferred-reason", inferred.reason);
    this.setAttribute("data-inferred-source", inferred.source);
  }

  #clearChartInputs(): void {
    if (!this.#chart) return;
    this.#chart.removeAttribute("spec");
    this.#chart.removeAttribute("data");
  }
}
