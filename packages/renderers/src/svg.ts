import type {
  Def,
  FilterPrimitive,
  Mark,
  PatternMark,
  RenderModel,
} from "@microviz/core";

function escapeXmlText(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeXmlAttr(value: string): string {
  return escapeXmlText(value)
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function attr(name: string, value: string | number | undefined): string {
  if (value === undefined) return "";
  return ` ${name}="${escapeXmlAttr(String(value))}"`;
}

function urlRefAttr(name: string, id: string | undefined): string {
  return id ? attr(name, `url(#${id})`) : "";
}

function renderPatternMark(mark: PatternMark): string {
  switch (mark.type) {
    case "rect":
      return `<rect${attr("x", mark.x)}${attr("y", mark.y)}${attr("width", mark.w)}${attr("height", mark.h)}${attr("rx", mark.rx)}${attr("ry", mark.ry)}${attr("opacity", mark.opacity)}${attr("fill", mark.fill)}${attr("fill-opacity", mark.fillOpacity)}${attr("stroke", mark.stroke)}${attr("stroke-opacity", mark.strokeOpacity)}${attr("stroke-width", mark.strokeWidth)}${urlRefAttr("mask", mark.mask)}${urlRefAttr("filter", mark.filter)}${attr("class", mark.className)} />`;
    case "path":
      return `<path${attr("d", mark.d)}${attr("opacity", mark.opacity)}${attr("fill", mark.fill)}${attr("fill-opacity", mark.fillOpacity)}${attr("stroke", mark.stroke)}${attr("stroke-opacity", mark.strokeOpacity)}${attr("stroke-width", mark.strokeWidth)}${attr("stroke-linecap", mark.strokeLinecap)}${attr("stroke-linejoin", mark.strokeLinejoin)}${urlRefAttr("mask", mark.mask)}${urlRefAttr("filter", mark.filter)}${attr("class", mark.className)} />`;
    case "text":
      return `<text${attr("x", mark.x)}${attr("y", mark.y)}${attr("text-anchor", mark.anchor)}${attr("dominant-baseline", mark.baseline)}${attr("opacity", mark.opacity)}${attr("fill", mark.fill)}${attr("fill-opacity", mark.fillOpacity)}${urlRefAttr("mask", mark.mask)}${urlRefAttr("filter", mark.filter)}${attr("class", mark.className)}>${escapeXmlText(mark.text)}</text>`;
    case "circle":
      return `<circle${attr("cx", mark.cx)}${attr("cy", mark.cy)}${attr("r", mark.r)}${attr("opacity", mark.opacity)}${attr("fill", mark.fill)}${attr("fill-opacity", mark.fillOpacity)}${attr("stroke", mark.stroke)}${attr("stroke-opacity", mark.strokeOpacity)}${attr("stroke-width", mark.strokeWidth)}${attr("stroke-dasharray", mark.strokeDasharray)}${attr("stroke-dashoffset", mark.strokeDashoffset)}${attr("stroke-linecap", mark.strokeLinecap)}${urlRefAttr("mask", mark.mask)}${urlRefAttr("filter", mark.filter)}${attr("class", mark.className)} />`;
    case "line":
      return `<line${attr("x1", mark.x1)}${attr("y1", mark.y1)}${attr("x2", mark.x2)}${attr("y2", mark.y2)}${attr("opacity", mark.opacity)}${attr("stroke", mark.stroke)}${attr("stroke-opacity", mark.strokeOpacity)}${attr("stroke-width", mark.strokeWidth)}${attr("stroke-linecap", mark.strokeLinecap)}${attr("stroke-linejoin", mark.strokeLinejoin)}${urlRefAttr("mask", mark.mask)}${urlRefAttr("filter", mark.filter)}${attr("class", mark.className)} />`;
  }
}

function renderFilterPrimitive(primitive: FilterPrimitive): string {
  switch (primitive.type) {
    case "dropShadow":
      return `<feDropShadow${attr("in", primitive.in)}${attr("dx", primitive.dx)}${attr("dy", primitive.dy)}${attr("stdDeviation", primitive.stdDeviation)}${attr("flood-color", primitive.floodColor)}${attr("flood-opacity", primitive.floodOpacity)}${attr("result", primitive.result)} />`;
    case "gaussianBlur":
      return `<feGaussianBlur${attr("in", primitive.in)}${attr("stdDeviation", primitive.stdDeviation)}${attr("result", primitive.result)} />`;
    case "turbulence":
      return `<feTurbulence${attr("type", primitive.noiseType)}${attr("baseFrequency", primitive.baseFrequency)}${attr("numOctaves", primitive.numOctaves)}${attr("seed", primitive.seed)}${attr("stitchTiles", primitive.stitchTiles)}${attr("result", primitive.result)} />`;
    case "displacementMap":
      return `<feDisplacementMap${attr("in", primitive.in)}${attr("in2", primitive.in2)}${attr("scale", primitive.scale)}${attr("xChannelSelector", primitive.xChannelSelector)}${attr("yChannelSelector", primitive.yChannelSelector)}${attr("result", primitive.result)} />`;
  }
}

function renderDefs(defs: readonly Def[]): string {
  const inner = defs
    .map((def) => {
      if (def.type === "linearGradient") {
        const stops = def.stops
          .map((stop) => {
            const offset = `${Math.round(stop.offset * 10000) / 100}%`;
            return `<stop${attr("offset", offset)}${attr("stop-color", stop.color)}${attr("stop-opacity", stop.opacity)} />`;
          })
          .join("");
        return `<linearGradient${attr("id", def.id)}${attr("x1", def.x1)}${attr("y1", def.y1)}${attr("x2", def.x2)}${attr("y2", def.y2)}>${stops}</linearGradient>`;
      }

      if (def.type === "pattern") {
        const marks = def.marks.map(renderPatternMark).join("");
        return `<pattern${attr("id", def.id)}${attr("x", def.x)}${attr("y", def.y)}${attr("width", def.width)}${attr("height", def.height)}${attr("patternUnits", def.patternUnits)}${attr("patternContentUnits", def.patternContentUnits)}${attr("patternTransform", def.patternTransform)}>${marks}</pattern>`;
      }

      if (def.type === "mask") {
        const marks = def.marks.map(renderPatternMark).join("");
        return `<mask${attr("id", def.id)}${attr("x", def.x)}${attr("y", def.y)}${attr("width", def.width)}${attr("height", def.height)}${attr("maskUnits", def.maskUnits)}${attr("maskContentUnits", def.maskContentUnits)}>${marks}</mask>`;
      }

      if (def.type === "filter") {
        const primitives = def.primitives.map(renderFilterPrimitive).join("");
        return `<filter${attr("id", def.id)}${attr("x", def.x)}${attr("y", def.y)}${attr("width", def.width)}${attr("height", def.height)}${attr("filterUnits", def.filterUnits)}>${primitives}</filter>`;
      }

      return `<clipPath${attr("id", def.id)}><rect${attr("x", def.x)}${attr("y", def.y)}${attr("width", def.w)}${attr("height", def.h)}${attr("rx", def.rx)}${attr("ry", def.ry)} /></clipPath>`;
    })
    .join("");

  return inner ? `<defs>${inner}</defs>` : "";
}

function clipPathAttr(clipPath: string | undefined): string {
  return clipPath ? attr("clip-path", `url(#${clipPath})`) : "";
}

function renderMark(mark: Mark): string {
  switch (mark.type) {
    case "rect":
      return `<rect${attr("id", mark.id)}${attr("x", mark.x)}${attr("y", mark.y)}${attr("width", mark.w)}${attr("height", mark.h)}${attr("rx", mark.rx)}${attr("ry", mark.ry)}${attr("opacity", mark.opacity)}${attr("fill", mark.fill)}${attr("fill-opacity", mark.fillOpacity)}${attr("stroke", mark.stroke)}${attr("stroke-opacity", mark.strokeOpacity)}${attr("stroke-width", mark.strokeWidth)}${clipPathAttr(mark.clipPath)}${urlRefAttr("mask", mark.mask)}${urlRefAttr("filter", mark.filter)}${attr("class", mark.className)} />`;
    case "path":
      return `<path${attr("id", mark.id)}${attr("d", mark.d)}${attr("opacity", mark.opacity)}${attr("fill", mark.fill)}${attr("fill-opacity", mark.fillOpacity)}${attr("stroke", mark.stroke)}${attr("stroke-opacity", mark.strokeOpacity)}${attr("stroke-width", mark.strokeWidth)}${attr("stroke-linecap", mark.strokeLinecap)}${attr("stroke-linejoin", mark.strokeLinejoin)}${clipPathAttr(mark.clipPath)}${urlRefAttr("mask", mark.mask)}${urlRefAttr("filter", mark.filter)}${attr("class", mark.className)} />`;
    case "text":
      return `<text${attr("id", mark.id)}${attr("x", mark.x)}${attr("y", mark.y)}${attr("text-anchor", mark.anchor)}${attr("dominant-baseline", mark.baseline)}${attr("opacity", mark.opacity)}${attr("fill", mark.fill)}${attr("fill-opacity", mark.fillOpacity)}${urlRefAttr("mask", mark.mask)}${urlRefAttr("filter", mark.filter)}${attr("class", mark.className)}>${escapeXmlText(mark.text)}</text>`;
    case "circle":
      return `<circle${attr("id", mark.id)}${attr("cx", mark.cx)}${attr("cy", mark.cy)}${attr("r", mark.r)}${attr("opacity", mark.opacity)}${attr("fill", mark.fill)}${attr("fill-opacity", mark.fillOpacity)}${attr("stroke", mark.stroke)}${attr("stroke-opacity", mark.strokeOpacity)}${attr("stroke-width", mark.strokeWidth)}${attr("stroke-dasharray", mark.strokeDasharray)}${attr("stroke-dashoffset", mark.strokeDashoffset)}${attr("stroke-linecap", mark.strokeLinecap)}${urlRefAttr("mask", mark.mask)}${urlRefAttr("filter", mark.filter)}${attr("class", mark.className)} />`;
    case "line":
      return `<line${attr("id", mark.id)}${attr("x1", mark.x1)}${attr("y1", mark.y1)}${attr("x2", mark.x2)}${attr("y2", mark.y2)}${attr("opacity", mark.opacity)}${attr("stroke", mark.stroke)}${attr("stroke-opacity", mark.strokeOpacity)}${attr("stroke-width", mark.strokeWidth)}${attr("stroke-linecap", mark.strokeLinecap)}${attr("stroke-linejoin", mark.strokeLinejoin)}${urlRefAttr("mask", mark.mask)}${urlRefAttr("filter", mark.filter)}${attr("class", mark.className)} />`;
  }
}

export function renderSvgString(
  model: RenderModel,
  options?: { title?: string },
): string {
  const title = options?.title ?? model.a11y?.label;
  const defs = model.defs ? renderDefs(model.defs) : "";
  const marks = model.marks.map(renderMark).join("");
  const titleEl = title ? `<title>${escapeXmlText(title)}</title>` : "";

  return `<svg xmlns="http://www.w3.org/2000/svg"${attr("width", model.width)}${attr("height", model.height)}${attr("viewBox", `0 0 ${model.width} ${model.height}`)}>${titleEl}${defs}${marks}</svg>`;
}
