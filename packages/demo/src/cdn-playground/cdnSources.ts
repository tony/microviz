/**
 * CDN source configuration for the playground.
 * Supports local builds, major CDNs, and custom URLs.
 */

export type CdnSourceType =
  | "cdn-dev"
  | "local"
  | "jsdelivr"
  | "unpkg"
  | "esm-sh"
  | "esm-sh-gh"
  | "custom";

export type CdnSource =
  | { type: "cdn-dev" }
  | { type: "local" }
  | { type: "jsdelivr" }
  | { type: "unpkg" }
  | { type: "esm-sh" }
  | { type: "esm-sh-gh" }
  | { type: "custom"; url: string };

export const CDN_SOURCE_LABELS: Record<CdnSourceType, string> = {
  "cdn-dev": "cdn-dev.microviz.org",
  custom: "Custom URL",
  "esm-sh": "esm.sh (npm)",
  "esm-sh-gh": "esm.sh (GitHub)",
  jsdelivr: "jsDelivr",
  local: "Local Build",
  unpkg: "unpkg",
};

export const CDN_SOURCE_DESCRIPTIONS: Record<CdnSourceType, string> = {
  "cdn-dev": "Preview CDN (canary/next/latest)",
  custom: "Enter a custom URL",
  "esm-sh": "esm.sh from npm (requires publish)",
  "esm-sh-gh": `esm.sh from GitHub (branch: ${__GIT_BRANCH__})`,
  jsdelivr: "cdn.jsdelivr.net (popular, fast)",
  local: "Serve from demo's public/cdn/ folder",
  unpkg: "unpkg.com (npm-based)",
};

/**
 * Get the CDN URL for a given source.
 */
export function getCdnUrl(source: CdnSource): string {
  switch (source.type) {
    case "cdn-dev":
      return "https://cdn-dev.microviz.org/canary/next/latest/@microviz/elements/cdn/microviz.js";
    case "local":
      return "/cdn/microviz.js";
    case "jsdelivr":
      return "https://cdn.jsdelivr.net/npm/@microviz/elements/cdn/microviz.js";
    case "unpkg":
      return "https://unpkg.com/@microviz/elements/cdn/microviz.js";
    case "esm-sh":
      return "https://esm.sh/@microviz/elements";
    case "esm-sh-gh": {
      // Use ?alias to redirect bare @microviz/* imports to GitHub paths
      const base = `gh/tony/microviz@${__GIT_BRANCH__}/packages`;
      const aliases = [
        `@microviz/core:${base}/core/src/index.ts`,
        `@microviz/renderers:${base}/renderers/src/index.ts`,
      ].join(",");
      return `https://esm.sh/${base}/elements/src/index.ts?alias=${aliases}`;
    }
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
    value === "cdn-dev" ||
    value === "local" ||
    value === "jsdelivr" ||
    value === "unpkg" ||
    value === "esm-sh" ||
    value === "esm-sh-gh"
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

export const DEFAULT_CDN_SOURCE: CdnSource = { type: "cdn-dev" };
