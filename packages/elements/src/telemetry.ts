import type { DiagnosticWarning, RenderModel } from "@microviz/core";

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
  hasDefs: boolean;
  warningCount: number;
  warningCodes?: string[];
  a11yItems?: number;
};

export type TelemetryPayload = {
  phase: TelemetryPhase;
  durationMs?: number;
  renderer?: "svg" | "html";
  operation?: "append" | "clear" | "patch" | "replace";
  size?: { width: number; height: number };
  specType?: string;
  stats?: TelemetryModelStats;
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
  error?: { name: string; message: string; stack?: string };
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

  return {
    a11yItems: model.a11y?.items?.length ?? 0,
    hasDefs: stats?.hasDefs ?? Boolean(model.defs?.length),
    markCount: stats?.markCount ?? model.marks.length,
    textCount,
    warningCodes: warningCodes.length > 0 ? warningCodes : undefined,
    warningCount: warningCodes.length,
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
