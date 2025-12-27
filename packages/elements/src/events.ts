import type { DiagnosticWarning, HitResult, Point } from "@microviz/core";

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
};

export type MicrovizWarningEvent = CustomEvent<MicrovizWarningDetail>;
