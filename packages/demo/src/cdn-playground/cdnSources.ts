/**
 * CDN source configuration for the playground.
 * Supports local builds, major CDNs, and custom URLs.
 */

export type CdnSourceType =
  | "local"
  | "jsdelivr"
  | "unpkg"
  | "esm-sh"
  | "custom";

export type CdnSource =
  | { type: "local" }
  | { type: "jsdelivr" }
  | { type: "unpkg" }
  | { type: "esm-sh" }
  | { type: "custom"; url: string };

export const CDN_SOURCE_LABELS: Record<CdnSourceType, string> = {
  custom: "Custom URL",
  "esm-sh": "esm.sh",
  jsdelivr: "jsDelivr",
  local: "Local Build",
  unpkg: "unpkg",
};

export const CDN_SOURCE_DESCRIPTIONS: Record<CdnSourceType, string> = {
  custom: "Enter a custom URL",
  "esm-sh": "esm.sh (on-demand ESM)",
  jsdelivr: "cdn.jsdelivr.net (popular, fast)",
  local: "Serve from demo's public/cdn/ folder",
  unpkg: "unpkg.com (npm-based)",
};

/**
 * Get the CDN URL for a given source.
 */
export function getCdnUrl(source: CdnSource): string {
  switch (source.type) {
    case "local":
      return "/cdn/microviz.js";
    case "jsdelivr":
      return "https://cdn.jsdelivr.net/npm/@microviz/elements/cdn/microviz.js";
    case "unpkg":
      return "https://unpkg.com/@microviz/elements/cdn/microviz.js";
    case "esm-sh":
      return "https://esm.sh/@microviz/elements";
    case "custom":
      return source.url;
  }
}

/**
 * Parse a CdnSource from serialized format.
 */
export function parseCdnSource(value: string): CdnSource {
  if (value.startsWith("custom:")) {
    return { type: "custom", url: value.slice(7) };
  }
  if (
    value === "local" ||
    value === "jsdelivr" ||
    value === "unpkg" ||
    value === "esm-sh"
  ) {
    return { type: value };
  }
  return { type: "local" };
}

/**
 * Serialize a CdnSource for URL storage.
 */
export function serializeCdnSource(source: CdnSource): string {
  if (source.type === "custom") {
    return `custom:${source.url}`;
  }
  return source.type;
}

export const DEFAULT_CDN_SOURCE: CdnSource = { type: "local" };
