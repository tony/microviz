import {
  type EasingName,
  easings,
  interpolateModel,
  type RenderModel,
} from "@microviz/core";
import { parseBoolean } from "../parse";

/**
 * Configuration for model animation.
 */
export type AnimationConfig = {
  /** Duration in milliseconds (default: 300, overridden by --mv-motion-duration) */
  duration: number;
  /** Easing function name */
  easing: EasingName;
};

const DEFAULT_CONFIG: AnimationConfig = {
  duration: 300,
  easing: "easeOut",
};

const TIME_RE = /^(-?\d*\.?\d+)(ms|s)?$/i;

function parseCssTime(value: string): number | null {
  const raw = value.trim();
  if (!raw) return null;
  const match = raw.match(TIME_RE);
  if (!match) return null;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount)) return null;
  const unit = (match[2] ?? "ms").toLowerCase();
  return unit === "s" ? amount * 1000 : amount;
}

export function isAnimationEnabled(
  host?: { getAttribute?: (name: string) => string | null } | null,
): boolean {
  if (!host || typeof host.getAttribute !== "function") return true;
  return parseBoolean(host.getAttribute("animate"), true);
}

export function getMotionConfig(
  host?: HTMLElement | null,
): Partial<AnimationConfig> {
  if (!host || typeof getComputedStyle !== "function") return {};
  const inlineDuration = host.style
    .getPropertyValue("--mv-motion-duration")
    .trim();
  const computedDuration = getComputedStyle(host)
    .getPropertyValue("--mv-motion-duration")
    .trim();
  const duration =
    parseCssTime(inlineDuration) ?? parseCssTime(computedDuration);
  return duration === null ? {} : { duration };
}

/**
 * Animate between two RenderModels using requestAnimationFrame.
 *
 * This function is browser-only (uses DOM APIs).
 * For Worker environments, use the pure interpolation functions from @microviz/core.
 *
 * @param from - Starting model state
 * @param to - Target model state
 * @param onFrame - Called each frame with interpolated model
 * @param onComplete - Called when animation completes
 * @param config - Optional animation configuration
 * @returns Cancel function to stop animation
 *
 * @example
 * const cancel = animate(
 *   previousModel,
 *   nextModel,
 *   (model) => renderSvgString(model),
 *   () => console.log('done'),
 *   { duration: 200, easing: 'easeInOut' }
 * );
 *
 * // Cancel if needed
 * cancel();
 */
export function animate(
  from: RenderModel,
  to: RenderModel,
  onFrame: (model: RenderModel) => void,
  onComplete: () => void,
  config: Partial<AnimationConfig> = {},
): () => void {
  const { duration, easing } = { ...DEFAULT_CONFIG, ...config };
  const easingFn = easings[easing];
  const startTime = performance.now();
  let rafId: number;
  let cancelled = false;

  const tick = (now: number): void => {
    if (cancelled) return;

    const elapsed = now - startTime;
    const rawT = Math.min(elapsed / duration, 1);
    const t = easingFn(rawT);

    onFrame(interpolateModel(from, to, t));

    if (rawT < 1) {
      rafId = requestAnimationFrame(tick);
    } else {
      onComplete();
    }
  };

  rafId = requestAnimationFrame(tick);

  return () => {
    cancelled = true;
    cancelAnimationFrame(rafId);
  };
}

/**
 * Check if animations should be disabled based on user preferences.
 *
 * @returns true if user prefers reduced motion
 */
export function shouldReduceMotion(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
