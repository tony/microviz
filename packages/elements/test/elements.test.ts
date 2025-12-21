import { computeModel, type RenderModel } from "@microviz/core";
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

  it("rerenders on skeleton attribute changes (microviz-model)", () => {
    const el = document.createElement("microviz-model") as HTMLElement & {
      model: RenderModel | null;
    };
    document.body.append(el);

    el.model = computeModel({
      data: [],
      size: { height: 12, width: 80 },
      spec: { type: "sparkline" },
    });

    expect(el.shadowRoot?.querySelector(".mv-skeleton")).toBeNull();

    el.setAttribute("skeleton", "");
    expect(el.shadowRoot?.querySelector(".mv-skeleton")).not.toBeNull();

    el.removeAttribute("skeleton");
    expect(el.shadowRoot?.querySelector(".mv-skeleton")).toBeNull();
  });

  it("supports hit-slop overrides for hit events (microviz-model)", () => {
    const el = document.createElement("microviz-model") as HTMLElement & {
      model: RenderModel | null;
    };
    el.setAttribute("interactive", "");
    document.body.append(el);

    el.model = {
      height: 100,
      marks: [{ id: "l", type: "line", x1: 0, x2: 100, y1: 50, y2: 50 }],
      width: 100,
    };

    const svg = el.shadowRoot?.querySelector("svg") as unknown as {
      getBoundingClientRect: () => {
        left: number;
        top: number;
        width: number;
        height: number;
      };
    };
    svg.getBoundingClientRect = () => ({
      height: 100,
      left: 0,
      top: 0,
      width: 100,
    });

    let lastHit: string | null | undefined;
    el.addEventListener("microviz-hit", (event) => {
      lastHit = (event as CustomEvent).detail.hit?.markId ?? null;
    });

    el.dispatchEvent(
      new MouseEvent("pointermove", { clientX: 50, clientY: 52 }),
    );
    expect(lastHit).toBe("l");

    el.setAttribute("hit-slop", "0");
    expect(lastHit).toBeNull();
  });
});
