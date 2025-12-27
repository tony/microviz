import type { Def, DiagnosticWarning, Mark, RenderModel } from "@microviz/core";
import type { HtmlUnsupportedMarkEffect } from "@microviz/renderers";

export type TelemetryLevel = "off" | "basic" | "verbose";

export type TelemetryPhase =
  | "animation"
  | "compute"
  | "dom"
  | "error"
  | "interaction"
  | "parse"
  | "render"
  | "warning";

export type TelemetryModelStats = {
  markCount: number;
  textCount: number;
  defCount: number;
  layerCount: number;
  hasDefs: boolean;
  hasLayers: boolean;
  warningCount: number;
  warningCodes?: string[];
  a11yItems?: number;
  hasA11ySummary: boolean;
};

export type TelemetryPayload = {
  phase: TelemetryPhase;
  durationMs?: number;
  renderer?: "svg" | "html";
  operation?: "append" | "clear" | "patch" | "replace";
  size?: { width: number; height: number };
  specType?: string;
  stats?: TelemetryModelStats;
  modelHash?: string;
  modelPrevHash?: string;
  warnings?: ReadonlyArray<DiagnosticWarning>;
  warningCodes?: string[];
  frame?: number;
  frameCount?: number;
  cancelled?: boolean;
  reason?: string;
  action?: "focus" | "hit" | "leave";
  hit?: { markId: string; markType: string };
  point?: { x: number; y: number };
  client?: { x: number; y: number };
  focus?: { index: number; id: string; label?: string };
  bytes?: number;
  nodeCount?: number;
  unsupportedMarkTypes?: Mark["type"][];
  unsupportedDefs?: Def["type"][];
  unsupportedMarkEffects?: HtmlUnsupportedMarkEffect[];
  error?: { name: string; message: string; stack?: string };
};

export type TelemetryModelMeta = {
  hash: string;
  size: { width: number; height: number };
  stats: TelemetryModelStats;
};

export type TelemetryDetail = TelemetryPayload & {
  element: string;
  elementId: string | null;
  at: number;
  level: TelemetryLevel;
};

export type TelemetryHandle = {
  enabled: boolean;
  level: TelemetryLevel;
  emit: (payload: TelemetryPayload) => void;
};

type TelemetryGlobalFlag = boolean | "basic" | "verbose";

const DEFAULT_LEVEL: TelemetryLevel = "basic";

function resolveTelemetryLevel(host: HTMLElement): TelemetryLevel {
  const attr = host.getAttribute("telemetry");
  if (attr !== null) {
    if (attr === "" || attr === "true" || attr === "basic") return "basic";
    if (attr === "verbose" || attr === "frames") return "verbose";
    if (attr === "false" || attr === "off") return "off";
    return DEFAULT_LEVEL;
  }

  const globalFlag = (
    globalThis as {
      __MICROVIZ_TELEMETRY__?: TelemetryGlobalFlag;
    }
  ).__MICROVIZ_TELEMETRY__;

  if (globalFlag === "verbose") return "verbose";
  if (globalFlag === true || globalFlag === "basic") return "basic";
  return "off";
}

function resolveHost(target: Element | ShadowRoot): HTMLElement | null {
  if (target instanceof ShadowRoot) {
    return target.host instanceof HTMLElement ? target.host : null;
  }
  return target instanceof HTMLElement ? target : null;
}

export function createTelemetry(target: Element | ShadowRoot): TelemetryHandle {
  const host = resolveHost(target);
  const level = host ? resolveTelemetryLevel(host) : "off";
  const enabled = level !== "off";

  const emit = (payload: TelemetryPayload): void => {
    if (!enabled || !host) return;
    host.dispatchEvent(
      new CustomEvent("microviz-telemetry", {
        bubbles: true,
        composed: true,
        detail: {
          ...payload,
          at: performance.now(),
          element: host.tagName.toLowerCase(),
          elementId: host.id || null,
          level,
        },
      }),
    );
  };

  return { emit, enabled, level };
}

export function modelTelemetryStats(
  model: RenderModel | null,
): TelemetryModelStats | null {
  if (!model) return null;
  const stats = model.stats;
  const warnings = stats?.warnings ?? [];
  const warningCodes = warnings.map((warning) => warning.code);
  const textCount =
    stats?.textCount ??
    model.marks.reduce(
      (total, mark) => total + (mark.type === "text" ? 1 : 0),
      0,
    );

  const defCount = model.defs?.length ?? 0;
  const layerCount = model.layers?.length ?? 0;
  const hasDefs = stats?.hasDefs ?? defCount > 0;
  const hasLayers = layerCount > 0;

  return {
    a11yItems: model.a11y?.items?.length ?? 0,
    defCount,
    hasA11ySummary: Boolean(model.a11y?.summary),
    hasDefs,
    hasLayers,
    layerCount,
    markCount: stats?.markCount ?? model.marks.length,
    textCount,
    warningCodes: warningCodes.length > 0 ? warningCodes : undefined,
    warningCount: warningCodes.length,
  };
}

function hashTelemetryString(value: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function hashRenderModel(model: RenderModel): string {
  const payload = {
    a11y: model.a11y ?? null,
    defs: model.defs ?? null,
    height: model.height,
    layers: model.layers ?? null,
    marks: model.marks,
    width: model.width,
  };
  return hashTelemetryString(JSON.stringify(payload));
}

export function modelTelemetryMeta(
  model: RenderModel | null,
): TelemetryModelMeta | null {
  if (!model) return null;
  const stats = modelTelemetryStats(model);
  if (!stats) return null;
  return {
    hash: hashRenderModel(model),
    size: { height: model.height, width: model.width },
    stats,
  };
}

export function toTelemetryError(error: unknown): {
  name: string;
  message: string;
  stack?: string;
} {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name || "Error",
      stack: error.stack,
    };
  }
  return {
    message: String(error),
    name: "Error",
  };
}
