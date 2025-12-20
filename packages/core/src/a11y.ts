import type { A11yTree, RenderModel } from "./model";

export function computeA11ySummary(
  model: RenderModel,
  label = "Chart",
): A11yTree {
  const textCount = model.marks.filter((m) => m.type === "text").length;
  const markCount = model.marks.length;
  return {
    label: `${label} (${markCount} marks, ${textCount} text)`,
    role: "img",
  };
}
