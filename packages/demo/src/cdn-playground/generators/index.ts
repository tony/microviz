/**
 * Multi-format code generator system.
 * Generates HTML, JSX, and future formats from unified presets.
 */

import type { UnifiedPreset } from "../unified-presets";
import { generateHtml } from "./html-generator";
import { generateJsx } from "./jsx-generator";
import type {
  CodeGenerator,
  GeneratedCode,
  GeneratorContext,
  OutputFormat,
} from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Generator Registry
// ─────────────────────────────────────────────────────────────────────────────

const generators: Record<OutputFormat, CodeGenerator<UnifiedPreset>> = {
  html: generateHtml,
  jsx: generateJsx,
};

// ─────────────────────────────────────────────────────────────────────────────
// Main API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate code for a preset in the specified format.
 */
export function generateCode(
  preset: UnifiedPreset,
  format: OutputFormat,
  context: GeneratorContext,
): GeneratedCode {
  const generator = generators[format];
  if (!generator) {
    throw new Error(`Unknown format: ${format}`);
  }
  return generator(preset, context);
}

/**
 * Get available formats for a preset.
 */
export function getAvailableFormats(preset: UnifiedPreset): OutputFormat[] {
  return preset.formats;
}

/**
 * Check if a preset supports a given format.
 */
export function supportsFormat(
  preset: UnifiedPreset,
  format: OutputFormat,
): boolean {
  return preset.formats.includes(format);
}

// ─────────────────────────────────────────────────────────────────────────────
// Re-exports
// ─────────────────────────────────────────────────────────────────────────────

export type { GeneratedCode, GeneratorContext, OutputFormat };
export {
  generateArrayData,
  generateDataForShape,
  generateFormattedData,
} from "./data-generator";
export { generateHtml } from "./html-generator";
export { generateJsx } from "./jsx-generator";
