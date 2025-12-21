import type { A11ySummary, RenderModel } from "@microviz/core";

const SUMMARY_ID = "mv-a11y-summary";
const SR_ONLY_CLASS = "mv-sr-only";

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
  }

  if (!internals) return;
  internals.role = role;
  internals.ariaLabel = label ?? "";
}
