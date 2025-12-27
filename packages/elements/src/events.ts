import type { DiagnosticWarning, HitResult, Point } from "@microviz/core";
import type { HtmlRendererWarnings } from "./a11y";
import type { TelemetryModelStats } from "./telemetry";

export type MicrovizClientPoint = { x: number; y: number };

export type MicrovizHitDetail = {
  hit: HitResult | null;
  client?: MicrovizClientPoint;
  point?: Point;
};

export type MicrovizHitEvent = CustomEvent<MicrovizHitDetail>;

export type MicrovizWarningDetail = {
  element: string;
  warnings: ReadonlyArray<DiagnosticWarning>;
  renderer?: "svg" | "html";
  rendererWarnings?: HtmlRendererWarnings;
  specType?: string;
  modelHash?: string;
  size?: { width: number; height: number };
  stats?: TelemetryModelStats;
};

export type MicrovizWarningEvent = CustomEvent<MicrovizWarningDetail>;
