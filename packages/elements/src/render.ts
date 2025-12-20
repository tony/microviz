function parseSvgRoot(svg: string): Element | null {
  const template = document.createElement("template");
  template.innerHTML = svg;
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

export function clearSvgFromShadowRoot(root: ShadowRoot): void {
  root.querySelector("svg")?.remove();
}
