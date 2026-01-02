import { useState } from "react";

export type RerollButtonProps = {
  /** 'compact' = icon only, 'full' = icon + label (chunky), 'ribbon' = icon + label (slim, fits h-8) */
  variant?: "compact" | "full" | "ribbon";
  /** Whether to play the animation on initial mount (default: false) */
  animateOnMount?: boolean;
  onClick?: () => void;
  className?: string;
};

const compactClasses =
  "flex select-none items-center gap-1 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 px-2 py-1 text-xs font-bold text-white shadow-sm transition-all hover:from-indigo-600 hover:to-purple-600 active:scale-95 dark:from-indigo-400 dark:to-purple-400";

const fullClasses =
  "flex select-none items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 px-3 py-1.5 text-sm font-bold text-white shadow-md transition-all hover:from-indigo-600 hover:to-purple-600 hover:shadow-lg active:scale-95 dark:from-indigo-400 dark:to-purple-400 dark:shadow-indigo-500/20";

// Ribbon: slim, fits within h-8 toolbar. Emphasis via color/contrast, not size.
// Uses leading-5 to match filter label baseline.
const ribbonClasses =
  "flex select-none items-center gap-1 rounded-sm bg-gradient-to-r from-indigo-500 to-purple-500 px-2 py-px text-[11px] font-semibold leading-5 text-white shadow-sm transition-all hover:from-indigo-600 hover:to-purple-600 active:scale-[0.98] dark:from-indigo-400 dark:to-purple-400";

export function RerollButton({
  variant = "compact",
  animateOnMount = false,
  onClick,
  className = "",
}: RerollButtonProps) {
  // null = not yet clicked (no animation unless animateOnMount)
  // 0+ = clicked, animate on each increment
  const [rerollKey, setRerollKey] = useState<number | null>(
    animateOnMount ? 0 : null,
  );

  const handleClick = () => {
    onClick?.();
    setRerollKey((k) => (k ?? 0) + 1);
  };

  const baseClasses =
    variant === "full"
      ? fullClasses
      : variant === "ribbon"
        ? ribbonClasses
        : compactClasses;

  const shouldAnimate = rerollKey !== null;
  const bounceClass = shouldAnimate ? "animate-[bounce-pop_0.3s_ease-out]" : "";
  const spinClass = shouldAnimate ? "animate-[spin-dice_0.3s_ease-out]" : "";

  return (
    <button
      className={`${baseClasses} ${bounceClass} ${className}`}
      key={rerollKey ?? "initial"}
      onClick={handleClick}
      title="Randomize seed"
      type="button"
    >
      <span className={`inline-block ${spinClass}`}>🎲</span>
      {(variant === "full" || variant === "ribbon") && "Reroll"}
    </button>
  );
}
