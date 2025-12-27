import type { RenderModel } from "@microviz/core";
import { renderSvgString } from "@microviz/renderers";
import {
  createTelemetry,
  modelTelemetryStats,
  type TelemetryHandle,
  toTelemetryError,
} from "./telemetry";

function parseSvgRoot(svg: string): Element | null {
  const template = document.createElement("template");
  template.innerHTML = svg;
  return template.content.firstElementChild;
}

function parseHtmlRoot(html: string): Element | null {
  const template = document.createElement("template");
  template.innerHTML = html;
  return template.content.firstElementChild;
}

export type RenderDomOptions = {
  telemetry?: TelemetryHandle;
  specType?: string;
  reason?: string;
};

export function renderSvgIntoShadowRoot(
  root: ShadowRoot,
  svg: string,
  options: RenderDomOptions = {},
): void {
  const telemetry = options.telemetry ?? createTelemetry(root);
  const start = telemetry.enabled ? performance.now() : 0;
  const next = parseSvgRoot(svg);
  if (!next) {
    telemetry.emit({
      phase: "error",
      reason: "parse-svg",
      renderer: "svg",
      specType: options.specType,
    });
    return;
  }

  const existing = root.querySelector("svg");
  if (existing) {
    existing.replaceWith(next);
    if (telemetry.enabled) {
      telemetry.emit({
        bytes: svg.length,
        durationMs: performance.now() - start,
        nodeCount: next.querySelectorAll("*").length,
        operation: "replace",
        phase: "dom",
        reason: options.reason,
        renderer: "svg",
        specType: options.specType,
      });
    }
    return;
  }

  root.append(next);
  if (telemetry.enabled) {
    telemetry.emit({
      bytes: svg.length,
      durationMs: performance.now() - start,
      nodeCount: next.querySelectorAll("*").length,
      operation: "append",
      phase: "dom",
      reason: options.reason,
      renderer: "svg",
      specType: options.specType,
    });
  }
}

/**
 * Patch attributes from source element onto target element.
 * Only updates attributes that have changed.
 */
function patchAttributes(target: Element, source: Element): void {
  // Remove attributes not in source
  for (const attr of [...target.attributes]) {
    if (!source.hasAttribute(attr.name)) {
      target.removeAttribute(attr.name);
    }
  }
  // Copy attributes from source (only if different)
  for (const attr of source.attributes) {
    if (target.getAttribute(attr.name) !== attr.value) {
      target.setAttribute(attr.name, attr.value);
    }
  }
}

/**
 * Recursively patch children of target to match source.
 * Used for patching defs and other container elements.
 */
function patchChildren(target: Element, source: Element): void {
  const targetChildren = [...target.children];
  const sourceChildren = [...source.children];

  // Remove extra children from target
  for (let i = sourceChildren.length; i < targetChildren.length; i++) {
    targetChildren[i].remove();
  }

  // Patch or add children
  for (let i = 0; i < sourceChildren.length; i++) {
    const sourceChild = sourceChildren[i];
    const targetChild = targetChildren[i];

    if (targetChild) {
      // Patch existing child
      if (targetChild.tagName === sourceChild.tagName) {
        patchAttributes(targetChild, sourceChild);
        const hasElementChildren =
          sourceChild.children.length > 0 || targetChild.children.length > 0;
        // Recursively patch nested children (for defs, patterns, etc.)
        if (hasElementChildren) {
          patchChildren(targetChild, sourceChild);
        } else if (targetChild.textContent !== sourceChild.textContent) {
          // Update text-only nodes (SVG <text>, HTML divs, etc.)
          targetChild.textContent = sourceChild.textContent;
        }
      } else {
        // Tag mismatch - replace
        targetChild.replaceWith(sourceChild.cloneNode(true));
      }
    } else {
      // Add new child
      target.append(sourceChild.cloneNode(true));
    }
  }
}

/**
 * Patch SVG into shadow root without replacing the entire element.
 * This preserves DOM nodes and enables smooth CSS transitions.
 */
export function patchSvgIntoShadowRoot(
  root: ShadowRoot,
  svg: string,
  options: RenderDomOptions = {},
): void {
  const telemetry = options.telemetry ?? createTelemetry(root);
  const start = telemetry.enabled ? performance.now() : 0;
  const next = parseSvgRoot(svg);
  if (!next) {
    telemetry.emit({
      phase: "error",
      reason: "parse-svg",
      renderer: "svg",
      specType: options.specType,
    });
    return;
  }

  const existing = root.querySelector("svg");
  if (!existing) {
    // No existing SVG - just append
    root.append(next);
    if (telemetry.enabled) {
      telemetry.emit({
        bytes: svg.length,
        durationMs: performance.now() - start,
        nodeCount: next.querySelectorAll("*").length,
        operation: "append",
        phase: "dom",
        reason: options.reason,
        renderer: "svg",
        specType: options.specType,
      });
    }
    return;
  }

  // Patch SVG root attributes (viewBox, width, height, etc.)
  patchAttributes(existing, next);

  // Build maps of existing elements by ID for efficient lookup
  const existingById = new Map<string, Element>();
  for (const el of existing.querySelectorAll("[id]")) {
    const id = el.getAttribute("id");
    if (id) existingById.set(id, el);
  }

  const nextById = new Map<string, Element>();
  for (const el of next.querySelectorAll("[id]")) {
    const id = el.getAttribute("id");
    if (id) nextById.set(id, el);
  }

  // Handle defs section specially (gradients, patterns, filters, etc.)
  const existingDefs = existing.querySelector("defs");
  const nextDefs = next.querySelector("defs");
  if (nextDefs) {
    if (existingDefs) {
      patchChildren(existingDefs, nextDefs);
    } else {
      existing.prepend(nextDefs.cloneNode(true));
    }
  } else if (existingDefs) {
    existingDefs.remove();
  }

  // Handle title element
  const existingTitle = existing.querySelector("title");
  const nextTitle = next.querySelector("title");
  if (nextTitle) {
    if (existingTitle) {
      if (existingTitle.textContent !== nextTitle.textContent) {
        existingTitle.textContent = nextTitle.textContent;
      }
    } else {
      existing.prepend(nextTitle.cloneNode(true));
    }
  } else if (existingTitle) {
    existingTitle.remove();
  }

  // Get direct mark children (excluding defs and title)
  const existingMarks = [...existing.children].filter(
    (el) => el.tagName !== "defs" && el.tagName !== "title",
  );
  const nextMarks = [...next.children].filter(
    (el) => el.tagName !== "defs" && el.tagName !== "title",
  );

  // Track which existing marks we've processed
  const processedIds = new Set<string>();

  // Patch or add marks in order
  let insertionPoint: Element | null = null;
  for (const nextMark of nextMarks) {
    const id = nextMark.getAttribute("id");

    const existingMark = id ? existingById.get(id) : undefined;
    if (id && existingMark) {
      // Existing mark - patch it
      patchAttributes(existingMark, nextMark);
      processedIds.add(id);

      // Move to correct position if needed
      if (insertionPoint) {
        if (existingMark.previousElementSibling !== insertionPoint) {
          insertionPoint.after(existingMark);
        }
      }
      insertionPoint = existingMark;
    } else {
      // New mark - insert it
      const newMark = nextMark.cloneNode(true) as Element;
      if (insertionPoint) {
        insertionPoint.after(newMark);
      } else {
        // Insert after defs/title or at start
        const firstMark = existingMarks[0];
        if (firstMark) {
          firstMark.before(newMark);
        } else {
          existing.append(newMark);
        }
      }
      insertionPoint = newMark;
      if (id) processedIds.add(id);
    }
  }

  // Remove marks that no longer exist
  for (const existingMark of existingMarks) {
    const id = existingMark.getAttribute("id");
    if (id && !processedIds.has(id)) {
      existingMark.remove();
    } else if (!id) {
      // Element without ID - check if it's in the next set
      // For safety, remove orphaned elements
      const stillExists = nextMarks.some(
        (m) =>
          !m.getAttribute("id") &&
          m.tagName === existingMark.tagName &&
          m.outerHTML === existingMark.outerHTML,
      );
      if (!stillExists) {
        existingMark.remove();
      }
    }
  }

  if (telemetry.enabled) {
    telemetry.emit({
      bytes: svg.length,
      durationMs: performance.now() - start,
      nodeCount: next.querySelectorAll("*").length,
      operation: "patch",
      phase: "dom",
      reason: options.reason,
      renderer: "svg",
      specType: options.specType,
    });
  }
}

export function clearSvgFromShadowRoot(
  root: ShadowRoot,
  options: RenderDomOptions = {},
): void {
  const telemetry = options.telemetry ?? createTelemetry(root);
  const existing = root.querySelector("svg");
  if (!existing) return;
  const start = telemetry.enabled ? performance.now() : 0;
  existing.remove();
  if (telemetry.enabled) {
    telemetry.emit({
      durationMs: performance.now() - start,
      operation: "clear",
      phase: "dom",
      reason: options.reason,
      renderer: "svg",
      specType: options.specType,
    });
  }
}

export type RenderSvgModelOptions = {
  telemetry?: TelemetryHandle;
  specType?: string;
  reason?: string;
  patch?: boolean;
};

export function renderSvgModelIntoShadowRoot(
  root: ShadowRoot,
  model: RenderModel,
  options: RenderSvgModelOptions = {},
): void {
  const telemetry = options.telemetry ?? createTelemetry(root);
  let svg: string;

  if (telemetry.enabled) {
    const renderStart = performance.now();
    const stats = modelTelemetryStats(model) ?? undefined;
    const warnings = model.stats?.warnings;
    const warningCodes = warnings?.map((warning) => warning.code);
    try {
      svg = renderSvgString(model);
    } catch (error) {
      telemetry.emit({
        error: toTelemetryError(error),
        phase: "error",
        reason: "render-svg",
        renderer: "svg",
        specType: options.specType,
      });
      throw error;
    }
    telemetry.emit({
      bytes: svg.length,
      durationMs: performance.now() - renderStart,
      phase: "render",
      reason: options.reason,
      renderer: "svg",
      size: { height: model.height, width: model.width },
      specType: options.specType,
      stats,
    });
    if (warnings && warnings.length > 0) {
      telemetry.emit({
        phase: "warning",
        reason: options.reason,
        renderer: "svg",
        size: { height: model.height, width: model.width },
        specType: options.specType,
        stats,
        warningCodes,
        warnings,
      });
    }
  } else {
    svg = renderSvgString(model);
  }

  const usePatch = options.patch ?? true;
  if (usePatch) {
    patchSvgIntoShadowRoot(root, svg, {
      reason: options.reason,
      specType: options.specType,
      telemetry,
    });
  } else {
    renderSvgIntoShadowRoot(root, svg, {
      reason: options.reason,
      specType: options.specType,
      telemetry,
    });
  }
}

/**
 * Patch HTML into shadow root without replacing the entire element.
 * Uses data-mark-id markers to keep DOM nodes stable for transitions.
 */
export function patchHtmlIntoShadowRoot(
  root: ShadowRoot,
  html: string,
  options: RenderDomOptions = {},
): void {
  const telemetry = options.telemetry ?? createTelemetry(root);
  const start = telemetry.enabled ? performance.now() : 0;
  const next = parseHtmlRoot(html);
  if (!next) {
    telemetry.emit({
      phase: "error",
      reason: "parse-html",
      renderer: "html",
      specType: options.specType,
    });
    return;
  }

  const existing = root.querySelector(".mv-chart");
  if (!existing) {
    root.append(next);
    if (telemetry.enabled) {
      telemetry.emit({
        bytes: html.length,
        durationMs: performance.now() - start,
        nodeCount: next.querySelectorAll("*").length,
        operation: "append",
        phase: "dom",
        reason: options.reason,
        renderer: "html",
        specType: options.specType,
      });
    }
    return;
  }

  patchAttributes(existing, next);

  const existingMarks = [...existing.children];
  const nextMarks = [...next.children];

  const existingById = new Map<string, Element>();
  for (const mark of existingMarks) {
    const id = mark.getAttribute("data-mark-id");
    if (id) existingById.set(id, mark);
  }

  const processedIds = new Set<string>();
  let insertionPoint: Element | null = null;

  for (const nextMark of nextMarks) {
    const id = nextMark.getAttribute("data-mark-id");
    const existingMark = id ? existingById.get(id) : undefined;

    if (id && existingMark) {
      patchAttributes(existingMark, nextMark);
      patchChildren(existingMark, nextMark);
      if (
        nextMark.children.length === 0 &&
        existingMark.textContent !== nextMark.textContent
      ) {
        existingMark.textContent = nextMark.textContent;
      }
      processedIds.add(id);

      if (insertionPoint) {
        if (existingMark.previousElementSibling !== insertionPoint) {
          insertionPoint.after(existingMark);
        }
      }
      insertionPoint = existingMark;
    } else {
      const newMark = nextMark.cloneNode(true) as Element;
      if (insertionPoint) {
        insertionPoint.after(newMark);
      } else {
        const firstMark = existingMarks[0];
        if (firstMark) {
          firstMark.before(newMark);
        } else {
          existing.append(newMark);
        }
      }
      insertionPoint = newMark;
      if (id) processedIds.add(id);
    }
  }

  for (const existingMark of existingMarks) {
    const id = existingMark.getAttribute("data-mark-id");
    if (id && !processedIds.has(id)) {
      existingMark.remove();
    } else if (!id) {
      const stillExists = nextMarks.some(
        (m) =>
          !m.getAttribute("data-mark-id") &&
          m.tagName === existingMark.tagName &&
          m.outerHTML === existingMark.outerHTML,
      );
      if (!stillExists) {
        existingMark.remove();
      }
    }
  }

  if (telemetry.enabled) {
    telemetry.emit({
      bytes: html.length,
      durationMs: performance.now() - start,
      nodeCount: next.querySelectorAll("*").length,
      operation: "patch",
      phase: "dom",
      reason: options.reason,
      renderer: "html",
      specType: options.specType,
    });
  }
}

export function renderHtmlIntoShadowRoot(
  root: ShadowRoot,
  html: string,
  options: RenderDomOptions = {},
): void {
  const telemetry = options.telemetry ?? createTelemetry(root);
  const start = telemetry.enabled ? performance.now() : 0;
  const next = parseHtmlRoot(html);
  if (!next) {
    telemetry.emit({
      phase: "error",
      reason: "parse-html",
      renderer: "html",
      specType: options.specType,
    });
    return;
  }

  const existing = root.querySelector(".mv-chart");
  if (existing) {
    existing.replaceWith(next);
    if (telemetry.enabled) {
      telemetry.emit({
        bytes: html.length,
        durationMs: performance.now() - start,
        nodeCount: next.querySelectorAll("*").length,
        operation: "replace",
        phase: "dom",
        reason: options.reason,
        renderer: "html",
        specType: options.specType,
      });
    }
    return;
  }

  root.append(next);
  if (telemetry.enabled) {
    telemetry.emit({
      bytes: html.length,
      durationMs: performance.now() - start,
      nodeCount: next.querySelectorAll("*").length,
      operation: "append",
      phase: "dom",
      reason: options.reason,
      renderer: "html",
      specType: options.specType,
    });
  }
}

export function clearHtmlFromShadowRoot(
  root: ShadowRoot,
  options: RenderDomOptions = {},
): void {
  const telemetry = options.telemetry ?? createTelemetry(root);
  const existing = root.querySelector(".mv-chart");
  if (!existing) return;
  const start = telemetry.enabled ? performance.now() : 0;
  existing.remove();
  if (telemetry.enabled) {
    telemetry.emit({
      durationMs: performance.now() - start,
      operation: "clear",
      phase: "dom",
      reason: options.reason,
      renderer: "html",
      specType: options.specType,
    });
  }
}
