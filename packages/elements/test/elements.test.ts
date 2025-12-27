import { computeModel, type RenderModel } from "@microviz/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { registerMicrovizElements } from "../src";

describe("@microviz/elements", () => {
  beforeEach(() => {
    // Mock matchMedia to prefer reduced motion, skipping animations in tests
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });
    registerMicrovizElements();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("registerMicrovizElements is idempotent", () => {
    expect(() => registerMicrovizElements()).not.toThrow();
    expect(customElements.get("microviz-bar")).toBeTruthy();
    expect(customElements.get("microviz-segmented-pill")).toBeTruthy();
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

  it("renders and updates from attributes (microviz-segmented-pill)", () => {
    const el = document.createElement("microviz-segmented-pill");
    el.setAttribute("width", "32");
    el.setAttribute("height", "8");
    el.setAttribute(
      "data",
      JSON.stringify([
        { color: "#ef4444", name: "A", pct: 40 },
        { color: "#22c55e", name: "B", pct: 60 },
      ]),
    );
    document.body.append(el);

    expect(
      el.shadowRoot?.querySelector("line#segmented-pill-sep-0"),
    ).not.toBeNull();

    el.setAttribute("separator-stroke-width", "0");
    expect(
      el.shadowRoot?.querySelector("line#segmented-pill-sep-0"),
    ).toBeNull();
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

    const originalGetBoundingClientRect =
      Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = () => ({
      height: 100,
      left: 0,
      top: 0,
      width: 100,
    });

    try {
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
    } finally {
      Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;
    }
  });

  it("uses animated render state for hit testing (microviz-model)", () => {
    const originalMatchMedia = window.matchMedia;
    const originalRaf = window.requestAnimationFrame;
    const originalCaf = window.cancelAnimationFrame;
    const originalGetBoundingClientRect =
      Element.prototype.getBoundingClientRect;

    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
    const nowSpy = vi.spyOn(performance, "now").mockReturnValue(0);
    const rafCallbacks: FrameRequestCallback[] = [];
    window.requestAnimationFrame = (callback) => {
      rafCallbacks.push(callback);
      return rafCallbacks.length;
    };
    window.cancelAnimationFrame = () => {};
    Element.prototype.getBoundingClientRect = () => ({
      height: 100,
      left: 0,
      top: 0,
      width: 100,
    });

    try {
      const el = document.createElement("microviz-model") as HTMLElement & {
        model: RenderModel | null;
      };
      el.setAttribute("interactive", "");
      el.setAttribute("hit-slop", "0");
      document.body.append(el);

      const lineModel = (y: number): RenderModel => ({
        height: 100,
        marks: [{ id: "l", type: "line", x1: 0, x2: 100, y1: y, y2: y }],
        width: 100,
      });

      el.model = lineModel(0);

      let lastHit: string | null | undefined;
      el.addEventListener("microviz-hit", (event) => {
        lastHit = (event as CustomEvent).detail.hit?.markId ?? null;
      });

      el.model = lineModel(100);

      expect(rafCallbacks.length).toBeGreaterThan(0);
      rafCallbacks.shift()?.(62);

      el.dispatchEvent(
        new MouseEvent("pointermove", { clientX: 50, clientY: 50 }),
      );

      expect(lastHit).toBe("l");
    } finally {
      nowSpy.mockRestore();
      window.matchMedia = originalMatchMedia;
      window.requestAnimationFrame = originalRaf;
      window.cancelAnimationFrame = originalCaf;
      Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;
    }
  });

  it("emits telemetry events when telemetry is enabled", () => {
    const el = document.createElement("microviz-chart");
    const events: Array<{
      element?: string;
      modelHash?: string;
      phase?: string;
      renderer?: string;
      specType?: string;
    }> = [];
    el.addEventListener("microviz-telemetry", (event) => {
      events.push((event as CustomEvent).detail);
    });

    el.setAttribute("telemetry", "basic");
    el.setAttribute("width", "80");
    el.setAttribute("height", "12");
    el.setAttribute("spec", JSON.stringify({ type: "sparkline" }));
    el.setAttribute("data", JSON.stringify([2, 4, 6]));
    document.body.append(el);

    const phases = new Set(events.map((detail) => detail.phase));
    expect(phases.has("compute")).toBe(true);
    expect(phases.has("dom")).toBe(true);

    const renderEvents = events.filter((detail) => detail.phase === "render");
    const svgRender = renderEvents.find(
      (detail) => detail.renderer === "svg" && detail.specType === "sparkline",
    );
    expect(svgRender?.element).toBe("microviz-chart");
    expect(svgRender?.renderer).toBe("svg");
    expect(svgRender?.specType).toBe("sparkline");
    const computeEvent = events.find((detail) => detail.phase === "compute");
    expect(computeEvent?.modelHash).toMatch(/[0-9a-f]{8}/);
  });

  it("applies a11y summary descriptions", () => {
    const el = document.createElement("microviz-model") as HTMLElement & {
      model: RenderModel | null;
    };
    document.body.append(el);

    el.model = computeModel({
      data: [2, 4, 6],
      size: { height: 12, width: 80 },
      spec: { type: "sparkline" },
    });

    expect(el.getAttribute("aria-describedby")).toBe("mv-a11y-summary");
    const summary = el.shadowRoot?.querySelector("#mv-a11y-summary");
    expect(summary?.classList.contains("mv-sr-only")).toBe(true);
    expect(summary?.textContent).toContain("min");
    expect(summary?.textContent).toContain("max");
  });

  it("applies a11y summary descriptions (microviz-chart)", () => {
    const el = document.createElement("microviz-chart");
    el.setAttribute("width", "80");
    el.setAttribute("height", "12");
    el.setAttribute("spec", JSON.stringify({ type: "sparkline" }));
    el.setAttribute("data", JSON.stringify([2, 4, 6]));
    document.body.append(el);

    expect(el.getAttribute("aria-describedby")).toBe("mv-a11y-summary");
    const summary = el.shadowRoot?.querySelector("#mv-a11y-summary");
    expect(summary?.classList.contains("mv-sr-only")).toBe(true);
    expect(summary?.textContent).toContain("min");
    expect(summary?.textContent).toContain("max");
  });

  it("supports keyboard focus navigation (microviz-chart)", () => {
    const el = document.createElement("microviz-chart");
    el.setAttribute("interactive", "");
    el.setAttribute("width", "80");
    el.setAttribute("height", "24");
    el.setAttribute("spec", JSON.stringify({ type: "sparkline" }));
    el.setAttribute("data", JSON.stringify([10, 20, 30]));
    document.body.append(el);

    expect(el.getAttribute("tabindex")).toBe("0");

    el.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    const focus = el.shadowRoot?.querySelector("#mv-a11y-focus");
    expect(focus?.textContent).toContain("Point");
  });

  it("emits focus events with item detail (microviz-chart)", () => {
    const el = document.createElement("microviz-chart");
    el.setAttribute("interactive", "");
    el.setAttribute("width", "80");
    el.setAttribute("height", "12");
    el.setAttribute("spec", JSON.stringify({ type: "sparkline" }));
    el.setAttribute("data", JSON.stringify([10, 20, 30]));
    document.body.append(el);

    let detail: { index?: number; item?: { label?: string } } | null = null;
    el.addEventListener("microviz-focus", (event) => {
      detail = (event as CustomEvent).detail;
    });

    el.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    expect(detail?.index).toBe(0);
    expect(detail?.item?.label).toBe("Point 1");
  });

  it("supports keyboard focus navigation", () => {
    const el = document.createElement("microviz-model") as HTMLElement & {
      model: RenderModel | null;
    };
    el.setAttribute("interactive", "");
    document.body.append(el);

    el.model = {
      height: 10,
      marks: [
        { h: 2, id: "a", type: "rect", w: 2, x: 0, y: 0 },
        { h: 2, id: "b", type: "rect", w: 2, x: 3, y: 0 },
      ],
      width: 10,
    };

    expect(el.getAttribute("tabindex")).toBe("0");

    el.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    const focus1 = el.shadowRoot?.querySelector("#mv-a11y-focus");
    expect(focus1?.textContent).toContain("a");

    el.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    const focus2 = el.shadowRoot?.querySelector("#mv-a11y-focus");
    expect(focus2?.textContent).toContain("b");
  });

  it("announces html renderer warnings", () => {
    const el = document.createElement("microviz-model") as HTMLElement & {
      model: RenderModel | null;
    };
    el.setAttribute("renderer", "html");
    document.body.append(el);

    el.model = {
      height: 10,
      marks: [{ d: "M 0 0 L 5 5", id: "p", type: "path" }],
      width: 10,
    };

    const warnings = el.shadowRoot?.querySelector("#mv-a11y-warnings");
    expect(warnings?.textContent).toContain("HTML renderer ignores marks");
  });

  it("emits renderer warnings for html renderer (microviz-model)", () => {
    const el = document.createElement("microviz-model") as HTMLElement & {
      model: RenderModel | null;
    };
    el.setAttribute("renderer", "html");
    document.body.append(el);

    type WarningDetail = {
      rendererWarnings?: {
        unsupportedMarkTypes: string[];
        unsupportedDefs: string[];
        unsupportedMarkEffects: string[];
      };
    };
    let receivedDetail: WarningDetail | null = null;
    el.addEventListener("microviz-warning", (event) => {
      receivedDetail = (event as CustomEvent<WarningDetail>).detail;
    });

    el.model = {
      height: 10,
      marks: [{ d: "M 0 0 L 5 5", id: "p", type: "path" }],
      width: 10,
    };

    expect(receivedDetail?.rendererWarnings?.unsupportedMarkTypes).toEqual([
      "path",
    ]);
  });

  it("emits telemetry for html renderer unsupported marks", () => {
    const el = document.createElement("microviz-model") as HTMLElement & {
      model: RenderModel | null;
    };
    el.setAttribute("renderer", "html");
    el.setAttribute("telemetry", "basic");
    document.body.append(el);

    const events: Array<{
      phase?: string;
      reason?: string;
      unsupportedMarkTypes?: string[];
    }> = [];
    el.addEventListener("microviz-telemetry", (event) => {
      events.push((event as CustomEvent).detail);
    });

    el.model = {
      height: 10,
      marks: [{ d: "M 0 0 L 5 5", id: "p", type: "path" }],
      width: 10,
    };

    const rendererWarning = events.find(
      (detail) =>
        detail.phase === "warning" && detail.reason === "renderer-unsupported",
    );
    expect(rendererWarning?.unsupportedMarkTypes).toContain("path");
  });

  it("emits microviz-warning event for model with warnings (microviz-model)", () => {
    const el = document.createElement("microviz-model") as HTMLElement & {
      model: RenderModel | null;
    };
    document.body.append(el);

    type WarningDetail = { warnings: Array<{ code: string; message: string }> };
    let receivedDetail: WarningDetail | null = null;
    el.addEventListener("microviz-warning", (event) => {
      receivedDetail = (event as CustomEvent<WarningDetail>).detail;
    });

    el.model = {
      height: 10,
      marks: [],
      stats: {
        hasDefs: false,
        markCount: 0,
        textCount: 0,
        warnings: [{ code: "EMPTY_DATA", message: "No data provided" }],
      },
      width: 10,
    };

    expect(receivedDetail).not.toBeNull();
    expect(receivedDetail?.warnings).toHaveLength(1);
    expect(receivedDetail?.warnings[0]?.code).toBe("EMPTY_DATA");
  });

  it("emits microviz-warning event for invalid sparkline data", () => {
    const el = document.createElement("microviz-sparkline");

    type WarningDetail = {
      element: string;
      warnings: Array<{ code: string; message: string }>;
    };
    let receivedDetail: WarningDetail | null = null;
    el.addEventListener("microviz-warning", (event) => {
      receivedDetail = (event as CustomEvent<WarningDetail>).detail;
    });

    // Attach listener before setting attributes (first attribute triggers render)
    el.setAttribute("width", "80");
    el.setAttribute("height", "12");
    el.setAttribute("data", "invalid-not-an-array");
    document.body.append(el);

    expect(receivedDetail).not.toBeNull();
    expect(receivedDetail?.element).toBe("microviz-sparkline");
    expect(receivedDetail?.warnings.some((w) => w.code === "EMPTY_DATA")).toBe(
      true,
    );
  });

  it("emits microviz-warning event for chart with warnings", () => {
    const el = document.createElement("microviz-chart");
    el.setAttribute("width", "80");
    el.setAttribute("height", "12");
    el.setAttribute("type", "sparkline");

    type WarningDetail = {
      element: string;
      warnings: Array<{ code: string; message: string }>;
    };
    let receivedDetail: WarningDetail | null = null;
    el.addEventListener("microviz-warning", (event) => {
      receivedDetail = (event as CustomEvent<WarningDetail>).detail;
    });

    el.setAttribute("data", "[]");
    document.body.append(el);

    expect(receivedDetail).not.toBeNull();
    expect(receivedDetail?.element).toBe("microviz-chart");
    expect(receivedDetail?.warnings.some((w) => w.code === "EMPTY_DATA")).toBe(
      true,
    );
  });

  it("deduplicates microviz-warning events (same warnings emit once)", () => {
    const el = document.createElement("microviz-sparkline");

    let emitCount = 0;
    el.addEventListener("microviz-warning", () => {
      emitCount++;
    });

    // First render triggers warning
    el.setAttribute("data", "invalid");
    document.body.append(el);
    expect(emitCount).toBe(1);

    // Additional renders with same warnings should NOT emit
    el.setAttribute("width", "100");
    el.setAttribute("height", "20");
    el.setAttribute("width", "150");
    expect(emitCount).toBe(1);

    // Changing to valid data clears warnings, then back to invalid emits again
    el.setAttribute("data", "[1,2,3]");
    el.setAttribute("data", "still-invalid");
    expect(emitCount).toBe(2);
  });
});
