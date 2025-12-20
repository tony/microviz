import { MAX_DIAGNOSTIC_WARNINGS, pushWarning } from "./charts/shared";
import type { Def, DiagnosticWarning, Mark } from "./model";

function parseUrlRef(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed.startsWith("url(")) return null;

  const unquoted = /^url\(\s*#([^)]+?)\s*\)$/.exec(trimmed);
  if (unquoted) return unquoted[1]?.trim() ?? null;

  const quoted = /^url\(\s*['"]#([^'"]+?)['"]\s*\)$/.exec(trimmed);
  return quoted ? (quoted[1]?.trim() ?? null) : null;
}

/**
 * Validates that marks only reference defs that actually exist in the model.
 *
 * This is intentionally "high-signal": missing `clipPath`/`mask` refs can make
 * a chart render blank or diverge across renderers.
 */
export function validateDefReferences(
  marks: readonly Mark[],
  defs: readonly Def[],
  warnings: DiagnosticWarning[],
): void {
  if (marks.length === 0) return;
  if (warnings.length >= MAX_DIAGNOSTIC_WARNINGS) return;

  const defsById = new Map<string, Def["type"]>();
  for (const def of defs) defsById.set(def.id, def.type);

  const seen = new Set<string>();

  const expectDef = (
    mark: Mark,
    refKind: "clipPath" | "mask" | "filter" | "fill" | "stroke",
    defId: string,
    expected: ReadonlyArray<Def["type"]>,
  ) => {
    if (warnings.length >= MAX_DIAGNOSTIC_WARNINGS) return;

    const key = `${refKind}:${defId}`;
    if (seen.has(key)) return;
    seen.add(key);

    const actual = defsById.get(defId);
    const expectedText = expected.join(" | ");

    if (!actual) {
      pushWarning(warnings, {
        code: "MISSING_DEF",
        markId: mark.id,
        message: `Missing def '#${defId}' referenced by ${refKind} on mark (${mark.type}); expected ${expectedText}.`,
      });
      return;
    }

    if (!expected.includes(actual)) {
      pushWarning(warnings, {
        code: "MISSING_DEF",
        markId: mark.id,
        message: `Def '#${defId}' referenced by ${refKind} on mark (${mark.type}) is ${actual}; expected ${expectedText}.`,
      });
    }
  };

  for (const mark of marks) {
    if ("clipPath" in mark && mark.clipPath)
      expectDef(mark, "clipPath", mark.clipPath, ["clipRect"]);

    if ("mask" in mark && mark.mask)
      expectDef(mark, "mask", mark.mask, ["mask"]);
    if ("filter" in mark && mark.filter)
      expectDef(mark, "filter", mark.filter, ["filter"]);

    if ("fill" in mark && typeof mark.fill === "string") {
      const id = parseUrlRef(mark.fill);
      if (id) expectDef(mark, "fill", id, ["linearGradient", "pattern"]);
    }

    if ("stroke" in mark && typeof mark.stroke === "string") {
      const id = parseUrlRef(mark.stroke);
      if (id) expectDef(mark, "stroke", id, ["linearGradient", "pattern"]);
    }
  }
}
