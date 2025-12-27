import type { RenderModel } from "@microviz/core";
import { describe, expect, it } from "vitest";
import {
  clearHtmlFromShadowRoot,
  clearSvgFromShadowRoot,
  patchHtmlIntoShadowRoot,
  renderSvgIntoShadowRoot,
  renderSvgModelIntoShadowRoot,
} from "../src/render";

function createShadowRoot(): ShadowRoot {
  const host = document.createElement("div");
  return host.attachShadow({ mode: "open" });
}

describe("renderSvgIntoShadowRoot", () => {
  it("preserves non-svg nodes when appending and updating", () => {
    const root = createShadowRoot();
    const style = document.createElement("style");
    style.textContent = "svg { display: block; }";
    root.append(style);

    renderSvgIntoShadowRoot(
      root,
      '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect id="a" x="0" y="0" width="10" height="10" /></svg>',
    );
    expect(root.querySelector("style")).toBe(style);
    expect(root.querySelectorAll("svg")).toHaveLength(1);

    const firstSvg = root.querySelector("svg");
    expect(firstSvg).not.toBeNull();

    renderSvgIntoShadowRoot(
      root,
      '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><circle id="b" cx="5" cy="5" r="5" /></svg>',
    );
    expect(root.querySelector("style")).toBe(style);
    expect(root.querySelectorAll("svg")).toHaveLength(1);
    expect(root.querySelector("svg")).not.toBe(firstSvg);
    expect(root.querySelector("circle#b")).not.toBeNull();
  });

  it("clears only the svg node", () => {
    const root = createShadowRoot();
    const style = document.createElement("style");
    root.append(style);

    renderSvgIntoShadowRoot(
      root,
      '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>',
    );
    expect(root.querySelector("svg")).not.toBeNull();

    clearSvgFromShadowRoot(root);
    expect(root.querySelector("svg")).toBeNull();
    expect(root.querySelector("style")).toBe(style);
  });
});

describe("patchHtmlIntoShadowRoot", () => {
  it("preserves non-chart nodes and patches marks in place", () => {
    const root = createShadowRoot();
    const style = document.createElement("style");
    root.append(style);

    const html1 =
      '<div class="mv-chart"><div data-mark-id="a" class="mv-html-mark" style="left:0px"></div></div>';
    patchHtmlIntoShadowRoot(root, html1);

    const firstMark = root.querySelector('[data-mark-id="a"]');
    expect(firstMark).not.toBeNull();
    expect(root.querySelector("style")).toBe(style);

    const html2 =
      '<div class="mv-chart"><div data-mark-id="a" class="mv-html-mark" style="left:10px"></div></div>';
    patchHtmlIntoShadowRoot(root, html2);

    const nextMark = root.querySelector('[data-mark-id="a"]');
    expect(nextMark).toBe(firstMark);
    expect(nextMark?.getAttribute("style")).toContain("left:10px");
  });

  it("patches nested html marks (clip wrappers)", () => {
    const root = createShadowRoot();

    const html1 =
      '<div class="mv-chart"><div data-mark-id="a" class="mv-html-mark" style="overflow:hidden"><div class="mv-html-mark" style="left:0px"></div></div></div>';
    patchHtmlIntoShadowRoot(root, html1);

    const inner = root.querySelector('[data-mark-id="a"] > div');
    expect(inner).not.toBeNull();

    const html2 =
      '<div class="mv-chart"><div data-mark-id="a" class="mv-html-mark" style="overflow:hidden"><div class="mv-html-mark" style="left:6px"></div></div></div>';
    patchHtmlIntoShadowRoot(root, html2);

    const updatedInner = root.querySelector('[data-mark-id="a"] > div');
    expect(updatedInner).toBe(inner);
    expect(updatedInner?.getAttribute("style")).toContain("left:6px");
  });

  it("clears only the html chart node", () => {
    const root = createShadowRoot();
    const style = document.createElement("style");
    root.append(style);

    const html = '<div class="mv-chart"><div data-mark-id="a"></div></div>';
    patchHtmlIntoShadowRoot(root, html);
    expect(root.querySelector(".mv-chart")).not.toBeNull();

    clearHtmlFromShadowRoot(root);
    expect(root.querySelector(".mv-chart")).toBeNull();
    expect(root.querySelector("style")).toBe(style);
  });
});

describe("renderSvgModelIntoShadowRoot", () => {
  it("emits warning telemetry when model has diagnostics", () => {
    const host = document.createElement("div");
    host.setAttribute("telemetry", "basic");
    const root = host.attachShadow({ mode: "open" });

    const events: Array<{ phase?: string; warningCodes?: string[] }> = [];
    host.addEventListener("microviz-telemetry", (event) => {
      events.push((event as CustomEvent).detail);
    });

    const model: RenderModel = {
      height: 10,
      marks: [],
      stats: {
        hasDefs: false,
        markCount: 0,
        textCount: 0,
        warnings: [
          {
            code: "EMPTY_DATA",
            message: "No data",
            phase: "normalized",
          },
        ],
      },
      width: 10,
    };

    renderSvgModelIntoShadowRoot(root, model);

    const phases = new Set(events.map((detail) => detail.phase));
    expect(phases.has("render")).toBe(true);
    expect(phases.has("warning")).toBe(true);
    expect(phases.has("dom")).toBe(true);

    const warningEvent = events.find((detail) => detail.phase === "warning");
    expect(warningEvent?.warningCodes).toContain("EMPTY_DATA");
  });
});
