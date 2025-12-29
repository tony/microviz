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
import { DEFAULT_PRESET, PRESETS } from "./presets";

export type CspMode = "off" | "claude-artifacts";

export type CdnPlaygroundState = {
  code: string;
  cdnSource: CdnSource;
  cspMode: CspMode;
  presetId: string | null;
  seed: string;
};

export const DEFAULT_CDN_PLAYGROUND_STATE: CdnPlaygroundState = {
  cdnSource: DEFAULT_CDN_SOURCE,
  code: DEFAULT_PRESET.code,
  cspMode: "off",
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

  if (state.seed !== "mv-1") {
    params.s = state.seed;
  }

  return params;
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
      presetId: null,
      seed: search.s ?? "mv-1",
    };
  }

  // Preset-based
  const presetId = search.p ?? DEFAULT_PRESET.id;
  const preset = PRESETS.find((p) => p.id === presetId) ?? DEFAULT_PRESET;

  return {
    cdnSource: search.cdn ? parseCdnSource(search.cdn) : DEFAULT_CDN_SOURCE,
    code: preset.code,
    cspMode: (search.csp as CspMode) ?? "off",
    presetId: preset.id,
    seed: search.s ?? "mv-1",
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
      presetId: effectivePresetId,
      seed: serialized.s ?? "mv-1",
    };
  } catch {
    return null;
  }
}

// Re-export base64 helper for use in MicrovizBrowse
export { utf8ToBase64 };
