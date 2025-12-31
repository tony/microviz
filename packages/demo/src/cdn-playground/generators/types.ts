/**
 * Type definitions for the multi-format code generator system.
 */

import type { CdnSource } from "../cdnSources";

export type OutputFormat = "html" | "jsx" | "solid";

export type GeneratorContext = {
  /** Seed for deterministic random data generation */
  seed: string;
  /** CDN URL for microviz imports */
  cdnUrl: string;
  /** Full CDN source configuration (for branch-aware URL generation) */
  cdnSource: CdnSource;
  /** Current theme */
  theme: "light" | "dark";
};

export type GeneratedCode = {
  /** Display code (compact, for editor) */
  display: string;
  /** Full code with imports (for copy) */
  copyable: string;
  /** Language for syntax highlighting */
  language: "html" | "tsx";
};

export type CodeGenerator<T = unknown> = (
  preset: T,
  context: GeneratorContext,
) => GeneratedCode;
