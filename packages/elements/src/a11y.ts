import type { A11yItem, A11ySummary, RenderModel } from "@microviz/core";
import {
  getHtmlUnsupportedDefTypes,
  getHtmlUnsupportedMarkEffects,
  getHtmlUnsupportedMarkTypes,
} from "@microviz/renderers";

const WARNINGS_ID = "mv-a11y-warnings";
const ITEMS_ID = "mv-a11y-items";
const FOCUS_ID = "mv-a11y-focus";
const SUMMARY_ID = "mv-a11y-summary";
const MAX_A11Y_ITEMS = 60;
const SR_ONLY_CLASS = "mv-sr-only";

export type HtmlRendererWarnings = {
  unsupportedMarkTypes: ReturnType<typeof getHtmlUnsupportedMarkTypes>;
  unsupportedDefs: ReturnType<typeof getHtmlUnsupportedDefTypes>;
  unsupportedMarkEffects: ReturnType<typeof getHtmlUnsupportedMarkEffects>;
};

export function getHtmlRendererWarnings(
  model: RenderModel,
): HtmlRendererWarnings | null {
  const unsupportedMarkTypes = getHtmlUnsupportedMarkTypes(model);
  const unsupportedDefs = getHtmlUnsupportedDefTypes(model);
  const unsupportedMarkEffects = getHtmlUnsupportedMarkEffects(model);
  if (
    unsupportedMarkTypes.length === 0 &&
    unsupportedDefs.length === 0 &&
    unsupportedMarkEffects.length === 0
  ) {
    return null;
  }
  return { unsupportedDefs, unsupportedMarkEffects, unsupportedMarkTypes };
}

function ensureSrOnlyElement(
  root: ShadowRoot,
  id: string,
  tag = "div",
): HTMLElement {
  const existing = root.querySelector<HTMLElement>(`#${id}`);
  if (existing) return existing;
  const el = document.createElement(tag);
  el.id = id;
  el.className = SR_ONLY_CLASS;
  root.append(el);
  return el;
}

function formatSummary(summary: A11ySummary): string {
  if (summary.kind === "series") {
    const parts = [`Series of ${summary.count} values`];
    if (summary.min !== undefined && summary.max !== undefined) {
      parts.push(`min ${summary.min}`, `max ${summary.max}`);
    }
    if (summary.last !== undefined) parts.push(`last ${summary.last}`);
    if (summary.trend) parts.push(`trend ${summary.trend}`);
    return parts.join(", ");
  }

  const parts = [`${summary.count} segments`];
  if (summary.largestPct !== undefined) {
    const pct = Math.round(summary.largestPct);
    const name = summary.largestName?.trim();
    parts.push(name ? `largest ${name} ${pct}%` : `largest ${pct}%`);
  }
  return parts.join(", ");
}

function formatItem(item: A11yItem): string {
  const parts = [item.label];
  if (item.valueText) parts.push(item.valueText);
  else if (item.value !== undefined) parts.push(String(item.value));
  if (item.series) parts.push(item.series);
  if (item.rank !== undefined) parts.push(`rank ${item.rank}`);
  return parts.join(", ");
}

function labelForMark(mark: RenderModel["marks"][number]): string {
  if (mark.type === "text" && mark.text.trim().length > 0) return mark.text;
  if ("className" in mark && mark.className?.trim())
    return mark.className.trim();
  return mark.id;
}

export function getA11yItems(model: RenderModel | null): A11yItem[] {
  if (!model) return [];
  const explicit = model.a11y?.items ?? [];
  if (explicit.length > 0) return explicit.slice(0, MAX_A11Y_ITEMS);

  if (model.marks.length === 0 || model.marks.length > MAX_A11Y_ITEMS)
    return [];

  return model.marks.map((mark) => ({
    id: mark.id,
    label: labelForMark(mark),
  }));
}

function syncItemsList(root: ShadowRoot, items: A11yItem[]): void {
  const list = ensureSrOnlyElement(root, ITEMS_ID, "ul");
  list.setAttribute("role", "list");
  list.textContent = "";

  if (items.length === 0) {
    list.setAttribute("aria-hidden", "true");
    return;
  }

  list.removeAttribute("aria-hidden");
  for (const item of items) {
    const li = document.createElement("li");
    li.textContent = formatItem(item);
    list.append(li);
  }
}

function syncWarnings(
  root: ShadowRoot,
  model: RenderModel | null,
  renderer: string | null,
): void {
  const warningsEl = ensureSrOnlyElement(root, WARNINGS_ID);
  warningsEl.setAttribute("aria-live", "polite");
  warningsEl.setAttribute("aria-atomic", "true");

  const messages: string[] = [];
  if (model?.stats?.warnings) {
    messages.push(...model.stats.warnings.map((warning) => warning.message));
  }

  if (renderer === "html" && model) {
    const rendererWarnings = getHtmlRendererWarnings(model);
    if (rendererWarnings?.unsupportedMarkTypes.length) {
      messages.push(
        `HTML renderer ignores marks: ${rendererWarnings.unsupportedMarkTypes.join(", ")}.`,
      );
    }

    if (rendererWarnings?.unsupportedDefs.length) {
      messages.push(
        `HTML renderer ignores defs: ${rendererWarnings.unsupportedDefs.join(", ")}.`,
      );
    }

    if (rendererWarnings?.unsupportedMarkEffects.length) {
      messages.push(
        `HTML renderer ignores mark effects: ${rendererWarnings.unsupportedMarkEffects.join(", ")}.`,
      );
    }
  }

  if (messages.length === 0) {
    warningsEl.textContent = "";
    warningsEl.setAttribute("aria-hidden", "true");
    return;
  }

  warningsEl.textContent = messages.join(" ");
  warningsEl.removeAttribute("aria-hidden");
}

export function updateA11yFocus(
  root: ShadowRoot | null,
  item: A11yItem | null,
  index?: number,
): void {
  if (!root) return;
  const focusEl = ensureSrOnlyElement(root, FOCUS_ID);
  focusEl.setAttribute("aria-live", "polite");
  focusEl.setAttribute("aria-atomic", "true");
  if (!item) {
    focusEl.textContent = "";
    focusEl.setAttribute("aria-hidden", "true");
    return;
  }
  const label = formatItem(item);
  focusEl.textContent =
    index === undefined ? label : `Item ${index + 1}: ${label}`;
  focusEl.removeAttribute("aria-hidden");
}

export function applyMicrovizA11y(
  host: HTMLElement,
  internals: ElementInternals | null,
  model: RenderModel | null,
): void {
  const role =
    host.getAttribute("role") ?? model?.a11y?.role ?? "graphics-document";
  const label = host.getAttribute("aria-label") ?? model?.a11y?.label;
  const summaryText = model?.a11y?.summary
    ? formatSummary(model.a11y.summary)
    : undefined;

  if (!host.hasAttribute("role")) host.setAttribute("role", role);
  if (label) host.setAttribute("aria-label", label);
  else host.removeAttribute("aria-label");

  if (!host.hasAttribute("aria-describedby")) {
    if (summaryText) host.setAttribute("aria-describedby", SUMMARY_ID);
    else host.removeAttribute("aria-describedby");
  }

  if (host.shadowRoot) {
    const summaryEl = ensureSrOnlyElement(host.shadowRoot, SUMMARY_ID);
    if (summaryText) {
      summaryEl.textContent = summaryText;
      summaryEl.removeAttribute("aria-hidden");
    } else {
      summaryEl.textContent = "";
      summaryEl.setAttribute("aria-hidden", "true");
    }

    const items = getA11yItems(model);
    syncItemsList(host.shadowRoot, items);
    syncWarnings(host.shadowRoot, model, host.getAttribute("renderer"));
  }

  if (!internals) return;
  internals.role = role;
  internals.ariaLabel = label ?? "";
}
