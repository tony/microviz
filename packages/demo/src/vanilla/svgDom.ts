import type {
  Def,
  FilterPrimitive,
  Mark,
  PatternMark,
  RenderModel,
} from "@microviz/core";

const SVG_NS = "http://www.w3.org/2000/svg";

function setAttr(
  el: Element,
  name: string,
  value: string | number | undefined,
): void {
  if (value === undefined) return;
  el.setAttribute(name, String(value));
}

function renderDefs(defs: readonly Def[]): SVGDefsElement {
  const defsEl = document.createElementNS(SVG_NS, "defs");
  for (const def of defs) {
    if (def.type === "linearGradient") {
      const grad = document.createElementNS(SVG_NS, "linearGradient");
      setAttr(grad, "id", def.id);
      setAttr(grad, "x1", def.x1);
      setAttr(grad, "y1", def.y1);
      setAttr(grad, "x2", def.x2);
      setAttr(grad, "y2", def.y2);
      for (const stop of def.stops) {
        const stopEl = document.createElementNS(SVG_NS, "stop");
        setAttr(stopEl, "offset", `${Math.round(stop.offset * 10000) / 100}%`);
        setAttr(stopEl, "stop-color", stop.color);
        setAttr(stopEl, "stop-opacity", stop.opacity);
        grad.appendChild(stopEl);
      }
      defsEl.appendChild(grad);
      continue;
    }

    if (def.type === "pattern") {
      const pattern = document.createElementNS(SVG_NS, "pattern");
      setAttr(pattern, "id", def.id);
      setAttr(pattern, "x", def.x);
      setAttr(pattern, "y", def.y);
      setAttr(pattern, "width", def.width);
      setAttr(pattern, "height", def.height);
      setAttr(pattern, "patternUnits", def.patternUnits);
      setAttr(pattern, "patternContentUnits", def.patternContentUnits);
      setAttr(pattern, "patternTransform", def.patternTransform);

      for (const mark of def.marks)
        pattern.appendChild(renderPatternMark(mark));
      defsEl.appendChild(pattern);
      continue;
    }

    if (def.type === "mask") {
      const mask = document.createElementNS(SVG_NS, "mask");
      setAttr(mask, "id", def.id);
      setAttr(mask, "x", def.x);
      setAttr(mask, "y", def.y);
      setAttr(mask, "width", def.width);
      setAttr(mask, "height", def.height);
      setAttr(mask, "maskUnits", def.maskUnits);
      setAttr(mask, "maskContentUnits", def.maskContentUnits);

      for (const mark of def.marks) mask.appendChild(renderPatternMark(mark));
      defsEl.appendChild(mask);
      continue;
    }

    if (def.type === "filter") {
      const filter = document.createElementNS(SVG_NS, "filter");
      setAttr(filter, "id", def.id);
      setAttr(filter, "x", def.x);
      setAttr(filter, "y", def.y);
      setAttr(filter, "width", def.width);
      setAttr(filter, "height", def.height);
      setAttr(filter, "filterUnits", def.filterUnits);

      for (const primitive of def.primitives)
        filter.appendChild(renderFilterPrimitive(primitive));
      defsEl.appendChild(filter);
      continue;
    }

    const clip = document.createElementNS(SVG_NS, "clipPath");
    setAttr(clip, "id", def.id);
    const rect = document.createElementNS(SVG_NS, "rect");
    setAttr(rect, "x", def.x);
    setAttr(rect, "y", def.y);
    setAttr(rect, "width", def.w);
    setAttr(rect, "height", def.h);
    setAttr(rect, "rx", def.rx);
    setAttr(rect, "ry", def.ry);
    clip.appendChild(rect);
    defsEl.appendChild(clip);
  }

  return defsEl;
}

function renderFilterPrimitive(primitive: FilterPrimitive): SVGElement {
  switch (primitive.type) {
    case "dropShadow": {
      const el = document.createElementNS(SVG_NS, "feDropShadow");
      setAttr(el, "in", primitive.in);
      setAttr(el, "dx", primitive.dx);
      setAttr(el, "dy", primitive.dy);
      setAttr(el, "stdDeviation", primitive.stdDeviation);
      setAttr(el, "flood-color", primitive.floodColor);
      setAttr(el, "flood-opacity", primitive.floodOpacity);
      setAttr(el, "result", primitive.result);
      return el;
    }
    case "gaussianBlur": {
      const el = document.createElementNS(SVG_NS, "feGaussianBlur");
      setAttr(el, "in", primitive.in);
      setAttr(el, "stdDeviation", primitive.stdDeviation);
      setAttr(el, "result", primitive.result);
      return el;
    }
    case "turbulence": {
      const el = document.createElementNS(SVG_NS, "feTurbulence");
      setAttr(el, "type", primitive.noiseType);
      setAttr(el, "baseFrequency", primitive.baseFrequency);
      setAttr(el, "numOctaves", primitive.numOctaves);
      setAttr(el, "seed", primitive.seed);
      setAttr(el, "stitchTiles", primitive.stitchTiles);
      setAttr(el, "result", primitive.result);
      return el;
    }
    case "displacementMap": {
      const el = document.createElementNS(SVG_NS, "feDisplacementMap");
      setAttr(el, "in", primitive.in);
      setAttr(el, "in2", primitive.in2);
      setAttr(el, "scale", primitive.scale);
      setAttr(el, "xChannelSelector", primitive.xChannelSelector);
      setAttr(el, "yChannelSelector", primitive.yChannelSelector);
      setAttr(el, "result", primitive.result);
      return el;
    }
  }
}

function renderPatternMark(mark: PatternMark): SVGElement {
  switch (mark.type) {
    case "rect": {
      const el = document.createElementNS(SVG_NS, "rect");
      setAttr(el, "x", mark.x);
      setAttr(el, "y", mark.y);
      setAttr(el, "width", mark.w);
      setAttr(el, "height", mark.h);
      setAttr(el, "rx", mark.rx);
      setAttr(el, "ry", mark.ry);
      setAttr(el, "opacity", mark.opacity);
      setAttr(el, "fill", mark.fill);
      setAttr(el, "fill-opacity", mark.fillOpacity);
      setAttr(el, "stroke", mark.stroke);
      setAttr(el, "stroke-opacity", mark.strokeOpacity);
      setAttr(el, "stroke-width", mark.strokeWidth);
      if (mark.mask) setAttr(el, "mask", `url(#${mark.mask})`);
      if (mark.filter) setAttr(el, "filter", `url(#${mark.filter})`);
      setAttr(el, "class", mark.className);
      return el;
    }

    case "path": {
      const el = document.createElementNS(SVG_NS, "path");
      setAttr(el, "d", mark.d);
      setAttr(el, "opacity", mark.opacity);
      setAttr(el, "fill", mark.fill);
      setAttr(el, "fill-opacity", mark.fillOpacity);
      setAttr(el, "stroke", mark.stroke);
      setAttr(el, "stroke-opacity", mark.strokeOpacity);
      setAttr(el, "stroke-width", mark.strokeWidth);
      setAttr(el, "stroke-linecap", mark.strokeLinecap);
      setAttr(el, "stroke-linejoin", mark.strokeLinejoin);
      if (mark.mask) setAttr(el, "mask", `url(#${mark.mask})`);
      if (mark.filter) setAttr(el, "filter", `url(#${mark.filter})`);
      setAttr(el, "class", mark.className);
      return el;
    }

    case "text": {
      const el = document.createElementNS(SVG_NS, "text");
      setAttr(el, "x", mark.x);
      setAttr(el, "y", mark.y);
      setAttr(el, "text-anchor", mark.anchor);
      setAttr(el, "dominant-baseline", mark.baseline);
      setAttr(el, "opacity", mark.opacity);
      setAttr(el, "fill", mark.fill);
      setAttr(el, "fill-opacity", mark.fillOpacity);
      if (mark.mask) setAttr(el, "mask", `url(#${mark.mask})`);
      if (mark.filter) setAttr(el, "filter", `url(#${mark.filter})`);
      setAttr(el, "class", mark.className);
      el.textContent = mark.text;
      return el;
    }

    case "circle": {
      const el = document.createElementNS(SVG_NS, "circle");
      setAttr(el, "cx", mark.cx);
      setAttr(el, "cy", mark.cy);
      setAttr(el, "r", mark.r);
      setAttr(el, "opacity", mark.opacity);
      setAttr(el, "fill", mark.fill);
      setAttr(el, "fill-opacity", mark.fillOpacity);
      setAttr(el, "stroke", mark.stroke);
      setAttr(el, "stroke-opacity", mark.strokeOpacity);
      setAttr(el, "stroke-width", mark.strokeWidth);
      setAttr(el, "stroke-dasharray", mark.strokeDasharray);
      setAttr(el, "stroke-dashoffset", mark.strokeDashoffset);
      setAttr(el, "stroke-linecap", mark.strokeLinecap);
      if (mark.mask) setAttr(el, "mask", `url(#${mark.mask})`);
      if (mark.filter) setAttr(el, "filter", `url(#${mark.filter})`);
      setAttr(el, "class", mark.className);
      return el;
    }

    case "line": {
      const el = document.createElementNS(SVG_NS, "line");
      setAttr(el, "x1", mark.x1);
      setAttr(el, "y1", mark.y1);
      setAttr(el, "x2", mark.x2);
      setAttr(el, "y2", mark.y2);
      setAttr(el, "opacity", mark.opacity);
      setAttr(el, "stroke", mark.stroke);
      setAttr(el, "stroke-opacity", mark.strokeOpacity);
      setAttr(el, "stroke-width", mark.strokeWidth);
      setAttr(el, "stroke-linecap", mark.strokeLinecap);
      setAttr(el, "stroke-linejoin", mark.strokeLinejoin);
      if (mark.mask) setAttr(el, "mask", `url(#${mark.mask})`);
      if (mark.filter) setAttr(el, "filter", `url(#${mark.filter})`);
      setAttr(el, "class", mark.className);
      return el;
    }
  }
}

function renderMark(mark: Mark): SVGElement {
  switch (mark.type) {
    case "rect": {
      const el = document.createElementNS(SVG_NS, "rect");
      setAttr(el, "id", mark.id);
      setAttr(el, "x", mark.x);
      setAttr(el, "y", mark.y);
      setAttr(el, "width", mark.w);
      setAttr(el, "height", mark.h);
      setAttr(el, "rx", mark.rx);
      setAttr(el, "ry", mark.ry);
      setAttr(el, "opacity", mark.opacity);
      setAttr(el, "fill", mark.fill);
      setAttr(el, "fill-opacity", mark.fillOpacity);
      setAttr(el, "stroke", mark.stroke);
      setAttr(el, "stroke-opacity", mark.strokeOpacity);
      setAttr(el, "stroke-width", mark.strokeWidth);
      if (mark.clipPath) setAttr(el, "clip-path", `url(#${mark.clipPath})`);
      if (mark.mask) setAttr(el, "mask", `url(#${mark.mask})`);
      if (mark.filter) setAttr(el, "filter", `url(#${mark.filter})`);
      setAttr(el, "class", mark.className);
      return el;
    }

    case "path": {
      const el = document.createElementNS(SVG_NS, "path");
      setAttr(el, "id", mark.id);
      setAttr(el, "d", mark.d);
      setAttr(el, "opacity", mark.opacity);
      setAttr(el, "fill", mark.fill);
      setAttr(el, "fill-opacity", mark.fillOpacity);
      setAttr(el, "stroke", mark.stroke);
      setAttr(el, "stroke-opacity", mark.strokeOpacity);
      setAttr(el, "stroke-width", mark.strokeWidth);
      setAttr(el, "stroke-linecap", mark.strokeLinecap);
      setAttr(el, "stroke-linejoin", mark.strokeLinejoin);
      if (mark.clipPath) setAttr(el, "clip-path", `url(#${mark.clipPath})`);
      if (mark.mask) setAttr(el, "mask", `url(#${mark.mask})`);
      if (mark.filter) setAttr(el, "filter", `url(#${mark.filter})`);
      setAttr(el, "class", mark.className);
      return el;
    }

    case "text": {
      const el = document.createElementNS(SVG_NS, "text");
      setAttr(el, "id", mark.id);
      setAttr(el, "x", mark.x);
      setAttr(el, "y", mark.y);
      setAttr(el, "text-anchor", mark.anchor);
      setAttr(el, "dominant-baseline", mark.baseline);
      setAttr(el, "opacity", mark.opacity);
      setAttr(el, "fill", mark.fill);
      setAttr(el, "fill-opacity", mark.fillOpacity);
      if (mark.mask) setAttr(el, "mask", `url(#${mark.mask})`);
      if (mark.filter) setAttr(el, "filter", `url(#${mark.filter})`);
      setAttr(el, "class", mark.className);
      el.textContent = mark.text;
      return el;
    }

    case "circle": {
      const el = document.createElementNS(SVG_NS, "circle");
      setAttr(el, "id", mark.id);
      setAttr(el, "cx", mark.cx);
      setAttr(el, "cy", mark.cy);
      setAttr(el, "r", mark.r);
      setAttr(el, "opacity", mark.opacity);
      setAttr(el, "fill", mark.fill);
      setAttr(el, "fill-opacity", mark.fillOpacity);
      setAttr(el, "stroke", mark.stroke);
      setAttr(el, "stroke-opacity", mark.strokeOpacity);
      setAttr(el, "stroke-width", mark.strokeWidth);
      setAttr(el, "stroke-dasharray", mark.strokeDasharray);
      setAttr(el, "stroke-dashoffset", mark.strokeDashoffset);
      setAttr(el, "stroke-linecap", mark.strokeLinecap);
      if (mark.mask) setAttr(el, "mask", `url(#${mark.mask})`);
      if (mark.filter) setAttr(el, "filter", `url(#${mark.filter})`);
      setAttr(el, "class", mark.className);
      return el;
    }

    case "line": {
      const el = document.createElementNS(SVG_NS, "line");
      setAttr(el, "id", mark.id);
      setAttr(el, "x1", mark.x1);
      setAttr(el, "y1", mark.y1);
      setAttr(el, "x2", mark.x2);
      setAttr(el, "y2", mark.y2);
      setAttr(el, "opacity", mark.opacity);
      setAttr(el, "stroke", mark.stroke);
      setAttr(el, "stroke-opacity", mark.strokeOpacity);
      setAttr(el, "stroke-width", mark.strokeWidth);
      setAttr(el, "stroke-linecap", mark.strokeLinecap);
      setAttr(el, "stroke-linejoin", mark.strokeLinejoin);
      if (mark.mask) setAttr(el, "mask", `url(#${mark.mask})`);
      if (mark.filter) setAttr(el, "filter", `url(#${mark.filter})`);
      setAttr(el, "class", mark.className);
      return el;
    }
  }
}

export function renderSvgElement(model: RenderModel): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("xmlns", SVG_NS);
  setAttr(svg, "width", model.width);
  setAttr(svg, "height", model.height);
  setAttr(svg, "viewBox", `0 0 ${model.width} ${model.height}`);

  if (model.a11y?.label) {
    const title = document.createElementNS(SVG_NS, "title");
    title.textContent = model.a11y.label;
    svg.appendChild(title);
  }

  if (model.defs && model.defs.length > 0) {
    svg.appendChild(renderDefs(model.defs));
  }

  for (const mark of model.marks) svg.appendChild(renderMark(mark));
  return svg;
}
