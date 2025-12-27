import type { ChartDefinition } from "./chart-definition";
import { clamp, isFiniteNumber } from "./shared";
import type { BarData, BarSpec, NormalizedBar } from "./types";

export const barChart = {
  a11y(_spec, normalized, _layout) {
    const pct =
      normalized.max === 0
        ? 0
        : Math.round((normalized.value / normalized.max) * 100);
    return {
      items: [
        {
          id: "bar-fill",
          label: "Value",
          value: normalized.value,
          valueText: `${pct}%`,
        },
      ],
      label: `Bar chart (${pct}%)`,
      role: "img",
    };
  },
  category: "bars" as const,
  defaultPad: 3,
  displayName: "Bar",
  exampleHtml:
    '<microviz-bar data=\'{"value": 75, "max": 100}\'></microviz-bar>',
  isEmpty(_normalized) {
    return false;
  },
  marks(spec, normalized, layout, _state, _theme, _warnings) {
    const usableW = Math.max(0, layout.width - layout.pad * 2);
    const usableH = Math.max(0, layout.height - layout.pad * 2);
    const ratio =
      normalized.max === 0 ? 0 : clamp(normalized.value / normalized.max, 0, 1);
    return [
      {
        className: `mv-bar${spec.className ? ` ${spec.className}` : ""}`,
        h: usableH,
        id: "bar-fill",
        type: "rect",
        w: usableW * ratio,
        x: layout.pad,
        y: layout.pad,
      },
    ];
  },
  normalize(_spec, data) {
    const value = isFiniteNumber(data.value) ? data.value : 0;
    const max = isFiniteNumber(data.max ?? value) ? (data.max ?? value) : value;
    return { max: Math.max(max, 0), type: "bar", value: Math.max(value, 0) };
  },
  preferredAspectRatio: "wide" as const,
  type: "bar",
} satisfies ChartDefinition<"bar", BarSpec, BarData, NormalizedBar>;
