import { beforeEach, describe, expect, it, vi } from "vitest";

const computeModelMock = vi.fn(
  (input: { size: { width: number; height: number } }) => ({
    a11y: {
      items: [{ id: "mark-1", label: "Item 1" }],
      label: "Focus test chart",
      role: "img",
    },
    height: input.size.height,
    marks: [],
    width: input.size.width,
  }),
);

vi.mock("@microviz/core", async () => {
  const actual =
    await vi.importActual<typeof import("@microviz/core")>("@microviz/core");
  return {
    ...actual,
    computeModel: computeModelMock,
  };
});

describe("focus state", () => {
  beforeEach(async () => {
    computeModelMock.mockClear();
    document.body.innerHTML = "";
    const { registerMicrovizElements } = await import("../src");
    registerMicrovizElements();
  });

  it("passes focusedMarkId into computeModel state", () => {
    const el = document.createElement("microviz-chart");
    el.setAttribute("interactive", "");
    el.setAttribute("width", "80");
    el.setAttribute("height", "12");
    el.setAttribute("spec", JSON.stringify({ type: "sparkline" }));
    el.setAttribute("data", JSON.stringify([1, 2, 3]));
    document.body.append(el);

    expect(computeModelMock).toHaveBeenCalled();
    computeModelMock.mockClear();

    el.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));

    const call = computeModelMock.mock.calls.at(-1)?.[0] as
      | { state?: { focusedMarkId?: string } }
      | undefined;
    expect(call?.state).toEqual({ focusedMarkId: "mark-1" });
  });
});
