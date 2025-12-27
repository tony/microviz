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

export function renderSvgIntoShadowRoot(root: ShadowRoot, svg: string): void {
  const next = parseSvgRoot(svg);
  if (!next) return;

  const existing = root.querySelector("svg");
  if (existing) {
    existing.replaceWith(next);
    return;
  }

  root.append(next);
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
        // Recursively patch nested children (for defs, patterns, etc.)
        if (
          sourceChild.children.length > 0 ||
          targetChild.children.length > 0
        ) {
          patchChildren(targetChild, sourceChild);
        }
        // Handle text content for text elements
        if (sourceChild.tagName === "text" || sourceChild.tagName === "title") {
          if (targetChild.textContent !== sourceChild.textContent) {
            targetChild.textContent = sourceChild.textContent;
          }
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
export function patchSvgIntoShadowRoot(root: ShadowRoot, svg: string): void {
  const next = parseSvgRoot(svg);
  if (!next) return;

  const existing = root.querySelector("svg");
  if (!existing) {
    // No existing SVG - just append
    root.append(next);
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
}

export function clearSvgFromShadowRoot(root: ShadowRoot): void {
  root.querySelector("svg")?.remove();
}

export function renderHtmlIntoShadowRoot(root: ShadowRoot, html: string): void {
  const next = parseHtmlRoot(html);
  if (!next) return;

  const existing = root.querySelector(".mv-chart");
  if (existing) {
    existing.replaceWith(next);
    return;
  }

  root.append(next);
}

export function clearHtmlFromShadowRoot(root: ShadowRoot): void {
  root.querySelector(".mv-chart")?.remove();
}
