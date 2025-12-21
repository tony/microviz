import type { RenderModel } from "@microviz/core";

type Size = { width: number; height: number };

export function shouldRenderSkeleton(model: RenderModel): boolean {
  const warnings = model.stats?.warnings ?? [];
  return warnings.some(
    (w) => w.code === "EMPTY_DATA" || w.code === "BLANK_RENDER",
  );
}

function attr(name: string, value: string | number | undefined): string {
  if (value === undefined) return "";
  return ` ${name}="${String(value)}"`;
}

export function renderSkeletonSvg(size: Size): string {
  const width = Number.isFinite(size.width) ? Math.max(0, size.width) : 0;
  const height = Number.isFinite(size.height) ? Math.max(0, size.height) : 0;

  const pad = Math.max(1, Math.round(Math.min(width, height) * 0.12));
  const innerW = Math.max(0, width - pad * 2);
  const innerH = Math.max(0, height - pad * 2);

  const barCount = 6;
  const gap = innerW > 0 ? Math.max(1, Math.round(innerW * 0.03)) : 1;
  const barW =
    innerW > 0
      ? Math.max(1, Math.floor((innerW - gap * (barCount - 1)) / barCount))
      : 1;

  const heights = [0.4, 0.7, 0.55, 0.85, 0.5, 0.65];
  const bars = heights
    .slice(0, barCount)
    .map((t, i) => {
      const h = Math.max(1, Math.round(innerH * t));
      const x = pad + i * (barW + gap);
      const y = pad + Math.max(0, innerH - h);
      return `<rect class="mv-skeleton"${attr("x", x)}${attr("y", y)}${attr("width", barW)}${attr("height", h)}${attr("rx", Math.min(3, Math.round(barW * 0.2)))} />`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg"${attr("width", width)}${attr("height", height)}${attr("viewBox", `0 0 ${width} ${height}`)}>${bars}</svg>`;
}
