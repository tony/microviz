/**
 * URL state serialization for the playground.
 * Uses flat query params for minimal URLs.
 */

import {
  type CdnSource,
  DEFAULT_CDN_SOURCE,
  parseCdnSource,
  serializeCdnSource,
} from "./cdnSources";
import type { OutputFormat } from "./generators/types";
import { applySeededData } from "./presetData";
import { DEFAULT_PRESET, PRESETS } from "./presets";

export type CspMode = "off" | "claude-artifacts";

export type CdnPlaygroundState = {
  code: string;
  cdnSource: CdnSource;
  cspMode: CspMode;
  /** Output format for code generation */
  format: OutputFormat;
  presetId: string | null;
  seed: string;
};

export const DEFAULT_CDN_PLAYGROUND_STATE: CdnPlaygroundState = {
  cdnSource: DEFAULT_CDN_SOURCE,
  code: DEFAULT_PRESET.code,
  cspMode: "off",
  format: "html",
  presetId: DEFAULT_PRESET.id,
  seed: "mv-1",
};

/**
 * Search params for playground URL.
 * All fields optional - omitted = default.
 */
export type PlaygroundSearchParams = {
  c?: string; // code (base64, only for custom code)
  cdn?: string; // CDN source type
  csp?: string; // CSP mode
  f?: string; // format (html | jsx)
  p?: string; // preset ID
  s?: string; // seed
  state?: string; // legacy format (for backward compat)
};

function utf8ToBase64(str: string): string {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(Number.parseInt(p1, 16)),
    ),
  );
}

function base64ToUtf8(str: string): string {
  return decodeURIComponent(
    atob(str)
      .split("")
      .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, "0")}`)
      .join(""),
  );
}

/**
 * Encode state to flat search params.
 * Only includes non-default values.
 */
export function encodePlaygroundSearch(
  state: CdnPlaygroundState,
): PlaygroundSearchParams {
  const params: PlaygroundSearchParams = {};

  // Custom code (presetId is null)
  if (state.presetId === null) {
    params.c = utf8ToBase64(state.code);
  } else if (state.presetId !== DEFAULT_PRESET.id) {
    // Non-default preset
    params.p = state.presetId;
  }
  // Default preset → no code/preset params needed

  if (state.cdnSource.type !== DEFAULT_CDN_SOURCE.type) {
    params.cdn = serializeCdnSource(state.cdnSource);
  }

  if (state.cspMode !== "off") {
    params.csp = state.cspMode;
  }

  if (state.format !== "html") {
    params.f = state.format;
  }

  if (state.seed !== "mv-1") {
    params.s = state.seed;
  }

  return params;
}

/**
 * Parse format from search params.
 */
function parseFormat(f: string | undefined): OutputFormat {
  if (f === "jsx") return "jsx";
  return "html";
}

/**
 * Decode state from search params.
 */
export function decodePlaygroundSearch(
  search: PlaygroundSearchParams,
): CdnPlaygroundState {
  // Legacy format support - decode old ?state= format
  if (search.state) {
    const legacy = decodeLegacyState(search.state);
    if (legacy) return legacy;
  }

  // Custom code takes precedence
  if (search.c) {
    return {
      cdnSource: search.cdn ? parseCdnSource(search.cdn) : DEFAULT_CDN_SOURCE,
      code: base64ToUtf8(search.c),
      cspMode: (search.csp as CspMode) ?? "off",
      format: parseFormat(search.f),
      presetId: null,
      seed: search.s ?? "mv-1",
    };
  }

  // Preset-based
  const presetId = search.p ?? DEFAULT_PRESET.id;
  const preset = PRESETS.find((p) => p.id === presetId) ?? DEFAULT_PRESET;
  const seed = search.s ?? "mv-1";

  return {
    cdnSource: search.cdn ? parseCdnSource(search.cdn) : DEFAULT_CDN_SOURCE,
    code: applySeededData(presetId, preset.code, seed),
    cspMode: (search.csp as CspMode) ?? "off",
    format: parseFormat(search.f),
    presetId: preset.id,
    seed,
  };
}

/**
 * Decode legacy ?state= format for backward compatibility.
 */
function decodeLegacyState(encoded: string): CdnPlaygroundState | null {
  try {
    const json = base64ToUtf8(encoded);
    const serialized = JSON.parse(json) as {
      c?: string;
      cdn?: string;
      csp?: CspMode;
      f?: string;
      p?: string;
      s?: string;
    };

    const presetId = serialized.p ?? DEFAULT_PRESET.id;
    const preset = PRESETS.find((p) => p.id === presetId);

    const code = serialized.c
      ? base64ToUtf8(serialized.c)
      : (preset?.code ?? DEFAULT_PRESET.code);

    // If custom code was encoded, show "Custom"
    const effectivePresetId = serialized.c ? null : preset ? presetId : null;

    return {
      cdnSource: serialized.cdn
        ? parseCdnSource(serialized.cdn)
        : DEFAULT_CDN_SOURCE,
      code,
      cspMode: serialized.csp ?? "off",
      format: parseFormat(serialized.f),
      presetId: effectivePresetId,
      seed: serialized.s ?? "mv-1",
    };
  } catch {
    return null;
  }
}

// Re-export base64 helper for use in MicrovizBrowse
export { utf8ToBase64 };
