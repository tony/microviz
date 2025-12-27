import type { RectMark, RenderModel } from "@microviz/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  animate,
  animateTransition,
  cleanupAnimation,
  createAnimationState,
  shouldReduceMotion,
} from "../src/transition";

/**
 * Create a minimal RenderModel for testing.
 */
function createModel(marks: RectMark[]): RenderModel {
  return {
    height: 100,
    marks,
    stats: { hasDefs: false, markCount: marks.length, textCount: 0 },
    width: 200,
  };
}

describe("animate", () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance"],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls onFrame multiple times during animation", () => {
    const frames: number[] = [];
    const from = createModel([
      { h: 50, id: "bar-1", type: "rect", w: 10, x: 0, y: 0 },
    ]);
    const to = createModel([
      { h: 100, id: "bar-1", type: "rect", w: 10, x: 0, y: 0 },
    ]);

    animate(
      from,
      to,
      (model) => {
        const mark = model.marks[0] as RectMark;
        frames.push(mark.h);
      },
      () => {},
      { duration: 100, easing: "linear" },
    );

    // Advance through multiple frames
    vi.advanceTimersToNextFrame();
    vi.advanceTimersByTime(50);
    vi.advanceTimersToNextFrame();
    vi.advanceTimersByTime(60);
    vi.advanceTimersToNextFrame();

    expect(frames.length).toBeGreaterThan(1);
    // Final frame should be at target value
    expect(frames[frames.length - 1]).toBe(100);
  });

  it("calls onComplete when animation finishes", () => {
    const onComplete = vi.fn();
    const from = createModel([
      { h: 50, id: "bar-1", type: "rect", w: 10, x: 0, y: 0 },
    ]);
    const to = createModel([
      { h: 100, id: "bar-1", type: "rect", w: 10, x: 0, y: 0 },
    ]);

    animate(from, to, () => {}, onComplete, { duration: 100 });

    // Advance past duration
    vi.advanceTimersByTime(150);
    vi.advanceTimersToNextFrame();

    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("cancel function stops animation", () => {
    const frames: number[] = [];
    const onComplete = vi.fn();
    const from = createModel([
      { h: 50, id: "bar-1", type: "rect", w: 10, x: 0, y: 0 },
    ]);
    const to = createModel([
      { h: 100, id: "bar-1", type: "rect", w: 10, x: 0, y: 0 },
    ]);

    const cancel = animate(
      from,
      to,
      (model) => {
        const mark = model.marks[0] as RectMark;
        frames.push(mark.h);
      },
      onComplete,
      { duration: 100 },
    );

    // Run a few frames
    vi.advanceTimersToNextFrame();
    vi.advanceTimersByTime(30);
    vi.advanceTimersToNextFrame();

    const frameCountAtCancel = frames.length;
    cancel();

    // Advance more time - no new frames should be added
    vi.advanceTimersByTime(100);
    vi.advanceTimersToNextFrame();

    expect(frames.length).toBe(frameCountAtCancel);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("applies easing function correctly", () => {
    const frames: number[] = [];
    const from = createModel([
      { h: 0, id: "bar-1", type: "rect", w: 10, x: 0, y: 0 },
    ]);
    const to = createModel([
      { h: 100, id: "bar-1", type: "rect", w: 10, x: 0, y: 0 },
    ]);

    animate(
      from,
      to,
      (model) => {
        const mark = model.marks[0] as RectMark;
        frames.push(mark.h);
      },
      () => {},
      { duration: 100, easing: "easeOut" },
    );

    // Advance to ~50% time
    vi.advanceTimersToNextFrame();
    vi.advanceTimersByTime(50);
    vi.advanceTimersToNextFrame();

    // With easeOut, at 50% time we should be > 50% progress
    // because easeOut starts fast and slows down
    const midFrame = frames[frames.length - 1];
    expect(midFrame).toBeGreaterThan(50);
  });

  it("interpolates viewport dimensions", () => {
    const frames: { width: number; height: number }[] = [];
    const from: RenderModel = {
      height: 100,
      marks: [],
      stats: { hasDefs: false, markCount: 0, textCount: 0 },
      width: 200,
    };
    const to: RenderModel = {
      height: 200,
      marks: [],
      stats: { hasDefs: false, markCount: 0, textCount: 0 },
      width: 400,
    };

    animate(
      from,
      to,
      (model) => {
        frames.push({ height: model.height, width: model.width });
      },
      () => {},
      { duration: 100, easing: "linear" },
    );

    // Complete animation
    vi.advanceTimersByTime(150);
    vi.advanceTimersToNextFrame();

    const final = frames[frames.length - 1];
    expect(final.width).toBe(400);
    expect(final.height).toBe(200);
  });
});

describe("shouldReduceMotion", () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it("returns true when prefers-reduced-motion matches", () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });
    expect(shouldReduceMotion()).toBe(true);
    expect(window.matchMedia).toHaveBeenCalledWith(
      "(prefers-reduced-motion: reduce)",
    );
  });

  it("returns false when prefers-reduced-motion does not match", () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
    expect(shouldReduceMotion()).toBe(false);
  });
});

describe("animateTransition", () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance"],
    });
    // Mock matchMedia to allow animations
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("skips animation on first render (no previous model)", () => {
    const state = createAnimationState();
    const frames: RenderModel[] = [];
    const model = createModel([
      { h: 100, id: "bar-1", type: "rect", w: 10, x: 0, y: 0 },
    ]);

    animateTransition(state, model, (m) => frames.push(m));

    // Should render immediately without animation
    expect(frames.length).toBe(1);
    expect(state.previousModel).toBe(model);
    expect(state.cancelAnimation).toBeNull();
  });

  it("animates on subsequent renders", () => {
    const state = createAnimationState();
    const frames: RenderModel[] = [];

    const model1 = createModel([
      { h: 50, id: "bar-1", type: "rect", w: 10, x: 0, y: 0 },
    ]);
    const model2 = createModel([
      { h: 100, id: "bar-1", type: "rect", w: 10, x: 0, y: 0 },
    ]);

    // First render
    animateTransition(state, model1, (m) => frames.push(m));
    expect(frames.length).toBe(1);

    // Second render should animate
    animateTransition(state, model2, (m) => frames.push(m));

    // Animation is in progress
    expect(state.cancelAnimation).not.toBeNull();

    // Advance to complete (default duration is 300ms)
    vi.advanceTimersByTime(350);
    vi.advanceTimersToNextFrame();

    expect(frames.length).toBeGreaterThan(2);
    expect(state.previousModel).toBe(model2);
  });

  it("cancels previous animation when new transition starts", () => {
    const state = createAnimationState();
    const frames: number[] = [];

    const model1 = createModel([
      { h: 0, id: "bar-1", type: "rect", w: 10, x: 0, y: 0 },
    ]);
    const model2 = createModel([
      { h: 100, id: "bar-1", type: "rect", w: 10, x: 0, y: 0 },
    ]);
    const model3 = createModel([
      { h: 50, id: "bar-1", type: "rect", w: 10, x: 0, y: 0 },
    ]);

    // First render
    animateTransition(state, model1, (m) =>
      frames.push((m.marks[0] as RectMark).h),
    );

    // Start animation to model2
    animateTransition(state, model2, (m) =>
      frames.push((m.marks[0] as RectMark).h),
    );

    // Partial progress
    vi.advanceTimersByTime(50);
    vi.advanceTimersToNextFrame();

    // Start new animation to model3 (should cancel previous)
    animateTransition(state, model3, (m) =>
      frames.push((m.marks[0] as RectMark).h),
    );

    // Complete (default duration is 300ms)
    vi.advanceTimersByTime(350);
    vi.advanceTimersToNextFrame();

    // Final value should be 50 (model3), not 100 (model2)
    expect(frames[frames.length - 1]).toBe(50);
  });

  it("skips animation when skipAnimation option is true", () => {
    const state = createAnimationState();
    const frames: RenderModel[] = [];

    const model1 = createModel([
      { h: 50, id: "bar-1", type: "rect", w: 10, x: 0, y: 0 },
    ]);
    const model2 = createModel([
      { h: 100, id: "bar-1", type: "rect", w: 10, x: 0, y: 0 },
    ]);

    animateTransition(state, model1, (m) => frames.push(m));
    animateTransition(state, model2, (m) => frames.push(m), {
      skipAnimation: true,
    });

    // Should render immediately without animation
    expect(frames.length).toBe(2);
    expect(state.cancelAnimation).toBeNull();
  });
});

describe("cleanupAnimation", () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance"],
    });
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("cancels in-flight animation", () => {
    const state = createAnimationState();
    const frames: RenderModel[] = [];

    const model1 = createModel([
      { h: 50, id: "bar-1", type: "rect", w: 10, x: 0, y: 0 },
    ]);
    const model2 = createModel([
      { h: 100, id: "bar-1", type: "rect", w: 10, x: 0, y: 0 },
    ]);

    animateTransition(state, model1, (m) => frames.push(m));
    animateTransition(state, model2, (m) => frames.push(m));

    // Animation in progress
    expect(state.cancelAnimation).not.toBeNull();

    cleanupAnimation(state);

    expect(state.cancelAnimation).toBeNull();

    // Advancing time should not add frames
    const frameCount = frames.length;
    vi.advanceTimersByTime(200);
    vi.advanceTimersToNextFrame();

    expect(frames.length).toBe(frameCount);
  });

  it("is safe to call when no animation is running", () => {
    const state = createAnimationState();
    expect(() => cleanupAnimation(state)).not.toThrow();
  });
});
