import type { Mark } from "../model";

export type MarkMatcher =
  | ((mark: Mark) => boolean)
  | {
      id?: string | RegExp;
      type?: Mark["type"];
      /**
       * Matches against `mark.className` (full string, not tokenized).
       */
      className?: string | RegExp;
    };

export type FillRule = {
  /**
   * The `Def.id` being applied (as `fill="url(#id)"`).
   */
  id: string;
  match: MarkMatcher;
};

export function fillUrl(defId: string): string {
  return `url(#${defId})`;
}

function matches(matcher: MarkMatcher, mark: Mark): boolean {
  if (typeof matcher === "function") return matcher(mark);

  if (matcher.type !== undefined && mark.type !== matcher.type) return false;

  if (matcher.id !== undefined) {
    if (typeof matcher.id === "string") {
      if (mark.id !== matcher.id) return false;
    } else if (!matcher.id.test(mark.id)) return false;
  }

  if (matcher.className !== undefined) {
    const cls = mark.className ?? "";
    if (typeof matcher.className === "string") {
      if (cls !== matcher.className) return false;
    } else if (!matcher.className.test(cls)) return false;
  }

  return true;
}

/**
 * Apply SVG def-backed fills (e.g. `pattern`, `linearGradient`) to marks using
 * a matcher list similar to nivo's `defs` + `fill` rules.
 *
 * By default, rules only apply when a mark has no explicit `fill` set.
 */
export function applyFillRules(
  marks: readonly Mark[],
  rules: readonly FillRule[],
  options?: { overwrite?: boolean },
): Mark[] {
  const overwrite = options?.overwrite ?? false;
  if (rules.length === 0) return [...marks];

  return marks.map((mark) => {
    if (!("fill" in mark)) return mark;
    if (!overwrite && mark.fill !== undefined) return mark;

    for (const rule of rules) {
      if (!matches(rule.match, mark)) continue;
      return { ...mark, fill: fillUrl(rule.id) };
    }

    return mark;
  });
}
