import type { RenderModel } from "@microviz/core";

export function applyMicrovizA11y(
  host: HTMLElement,
  internals: ElementInternals | null,
  model: RenderModel | null,
): void {
  const role =
    host.getAttribute("role") ?? model?.a11y?.role ?? "graphics-document";
  const label = host.getAttribute("aria-label") ?? model?.a11y?.label;

  if (!host.hasAttribute("role")) host.setAttribute("role", role);
  if (label) host.setAttribute("aria-label", label);
  else host.removeAttribute("aria-label");

  if (!internals) return;
  internals.role = role;
  internals.ariaLabel = label ?? "";
}
