import { describe, expect, it } from "vitest";
import { clearSvgFromShadowRoot, renderSvgIntoShadowRoot } from "../src/render";

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
