import { afterEach, describe, expect, it } from "vitest";
import { registerMicrovizElements } from "../src";

describe("@microviz/elements", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("registerMicrovizElements is idempotent", () => {
    expect(() => registerMicrovizElements()).not.toThrow();
    expect(customElements.get("microviz-bar")).toBeTruthy();
    expect(() => registerMicrovizElements()).not.toThrow();
  });

  it("renders and updates from attributes (microviz-bar)", () => {
    const el = document.createElement("microviz-bar");
    el.setAttribute("width", "80");
    el.setAttribute("height", "12");
    el.setAttribute("pad", "0");
    el.setAttribute("value", "50");
    el.setAttribute("max", "100");
    document.body.append(el);

    const rect1 = el.shadowRoot?.querySelector("rect#bar-fill");
    expect(rect1?.getAttribute("width")).toBe("40");

    el.setAttribute("value", "75");
    const rect2 = el.shadowRoot?.querySelector("rect#bar-fill");
    expect(rect2?.getAttribute("width")).toBe("60");
  });

  it("parses boolean attributes (microviz-step-line show-dot)", () => {
    const el = document.createElement("microviz-step-line");
    el.setAttribute("width", "80");
    el.setAttribute("height", "24");
    el.setAttribute("data", "[0, 20, 40, 60]");
    el.setAttribute("show-dot", "false");
    document.body.append(el);

    expect(el.shadowRoot?.querySelector("circle#step-line-dot")).toBeNull();

    el.setAttribute("show-dot", "true");
    expect(el.shadowRoot?.querySelector("circle#step-line-dot")).not.toBeNull();
  });
});
