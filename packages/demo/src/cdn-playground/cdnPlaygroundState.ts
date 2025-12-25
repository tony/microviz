/**
 * URL state serialization for the playground.
 * Follows the pattern from browse/browseUrlState.ts
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

// Compact keys for URL serialization
type SerializedState = {
  c?: string; // code (base64)
  cdn?: string; // cdnSource
  csp?: CspMode; // cspMode
  p?: string; // presetId
  s?: string; // seed
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

export function encodeCdnPlaygroundState(
  state: CdnPlaygroundState,
): string | null {
  const serialized: SerializedState = {};
  let hasChanges = false;

  // Only encode code if it differs from the preset's default
  const preset = state.presetId
    ? PRESETS.find((p) => p.id === state.presetId)
    : null;
  const defaultCode = preset?.code ?? DEFAULT_PRESET.code;

  if (state.code !== defaultCode) {
    serialized.c = utf8ToBase64(state.code);
    hasChanges = true;
  }

  if (
    state.cdnSource.type !== DEFAULT_CDN_SOURCE.type ||
    (state.cdnSource.type === "custom" && state.cdnSource.url)
  ) {
    serialized.cdn = serializeCdnSource(state.cdnSource);
    hasChanges = true;
  }

  if (state.cspMode !== "off") {
    serialized.csp = state.cspMode;
    hasChanges = true;
  }

  if (state.presetId !== DEFAULT_PRESET.id) {
    serialized.p = state.presetId ?? undefined;
    hasChanges = true;
  }

  if (state.seed !== "mv-1") {
    serialized.s = state.seed;
    hasChanges = true;
  }

  if (!hasChanges) {
    return null;
  }

  return utf8ToBase64(JSON.stringify(serialized));
}

export function decodeCdnPlaygroundState(
  encoded: string | undefined,
): CdnPlaygroundState | null {
  if (!encoded) {
    return null;
  }

  try {
    const json = base64ToUtf8(encoded);
    const serialized: SerializedState = JSON.parse(json);

    const presetId = serialized.p ?? DEFAULT_PRESET.id;
    const preset = PRESETS.find((p) => p.id === presetId);

    return {
      cdnSource: serialized.cdn
        ? parseCdnSource(serialized.cdn)
        : DEFAULT_CDN_SOURCE,
      code: serialized.c
        ? base64ToUtf8(serialized.c)
        : (preset?.code ?? DEFAULT_PRESET.code),
      cspMode: serialized.csp ?? "off",
      presetId,
      seed: serialized.s ?? "mv-1",
    };
  } catch {
    return null;
  }
}
