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
