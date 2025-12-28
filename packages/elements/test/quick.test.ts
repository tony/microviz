import { describe, expect, it } from "vitest";
import { auto, sparkline } from "../src";

describe("@microviz/elements quick API", () => {
  it("creates a sparkline element with serialized data", () => {
    const el = sparkline([1, 2, 3], { animate: false, width: 120 });

    expect(el.tagName.toLowerCase()).toBe("microviz-sparkline");
    expect(el.getAttribute("data")).toBe("[1,2,3]");
    expect(el.getAttribute("width")).toBe("120");
    expect(el.getAttribute("animate")).toBe("false");
  });

  it("creates an auto element with options", () => {
    const el = auto("1,2,3", {
      autosize: true,
      telemetry: "verbose",
      type: "bar",
    });

    expect(el.tagName.toLowerCase()).toBe("microviz-auto");
    expect(el.getAttribute("data")).toBe("1,2,3");
    expect(el.getAttribute("type")).toBe("bar");
    expect(el.hasAttribute("autosize")).toBe(true);
    expect(el.getAttribute("telemetry")).toBe("verbose");
  });
});
