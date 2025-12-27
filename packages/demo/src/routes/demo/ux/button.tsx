import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DemoSection } from "../../../ui/DemoSection";

export const Route = createFileRoute("/demo/ux/button")({
  component: ButtonDemoRoute,
});

function ButtonDemoRoute() {
  const [rerollKey, setRerollKey] = useState(0);

  const handleReroll = () => {
    setRerollKey((k) => k + 1);
  };

  return (
    <div className="space-y-8 p-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Button
        </h2>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Button styles for actions, including animated action buttons.
        </p>
      </div>

      {/* Basic Buttons */}
      <DemoSection
        description="Standard button styles for common actions."
        title="Basic Buttons"
      >
        <div className="flex flex-wrap items-center gap-4">
          <button
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:shadow active:scale-[0.98] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            type="button"
          >
            Secondary
          </button>
          <button
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.98] dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            type="button"
          >
            Primary
          </button>
          <button
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98]"
            type="button"
          >
            Action
          </button>
        </div>
      </DemoSection>

      {/* Reroll Button - Icon Only */}
      <DemoSection
        description="Compact icon-only button with spin animation on click. Used in mobile views."
        title="Reroll Button (Icon Only)"
      >
        <div className="flex flex-wrap items-center gap-4">
          <button
            className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 px-2 py-1 text-xs font-bold text-white shadow-sm transition-all hover:from-indigo-600 hover:to-purple-600 active:scale-95 dark:from-indigo-400 dark:to-purple-400 animate-[bounce-pop_0.3s_ease-out]"
            key={`icon-${rerollKey}`}
            onClick={handleReroll}
            title="Randomize seed"
            type="button"
          >
            <span className="inline-block animate-[spin-dice_0.3s_ease-out]">
              🎲
            </span>
          </button>
          <span className="text-xs text-slate-500">
            Click to see animation (rerollKey: {rerollKey})
          </span>
        </div>
      </DemoSection>

      {/* Reroll Button - Icon + Text */}
      <DemoSection
        description="Full button with icon and label. Used in desktop submenu."
        title="Reroll Button (Icon + Text)"
      >
        <div className="flex flex-wrap items-center gap-4">
          <button
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 px-3 py-1.5 text-sm font-bold text-white shadow-md transition-all hover:from-indigo-600 hover:to-purple-600 hover:shadow-lg active:scale-95 dark:from-indigo-400 dark:to-purple-400 dark:shadow-indigo-500/20 animate-[bounce-pop_0.3s_ease-out]"
            key={`text-${rerollKey}`}
            onClick={handleReroll}
            title="Randomize seed"
            type="button"
          >
            <span className="inline-block animate-[spin-dice_0.3s_ease-out]">
              🎲
            </span>
            Reroll
          </button>
          <span className="text-xs text-slate-500">Click to see animation</span>
        </div>
      </DemoSection>

      {/* Size Variants */}
      <DemoSection
        description="Reroll buttons in different sizes for various contexts."
        title="Sizes"
      >
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <span className="text-xs text-slate-500">xs (sidebar)</span>
            <button
              className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 px-2 py-1 text-xs font-bold text-white shadow-sm transition-all hover:from-indigo-600 hover:to-purple-600 active:scale-95 dark:from-indigo-400 dark:to-purple-400"
              type="button"
            >
              <span>🎲</span>
            </button>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-slate-500">sm (submenu)</span>
            <button
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 px-3 py-1.5 text-sm font-bold text-white shadow-md transition-all hover:from-indigo-600 hover:to-purple-600 active:scale-95 dark:from-indigo-400 dark:to-purple-400"
              type="button"
            >
              <span>🎲</span>
              Reroll
            </button>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-slate-500">md</span>
            <button
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-2 text-base font-bold text-white shadow-md transition-all hover:from-indigo-600 hover:to-purple-600 active:scale-95 dark:from-indigo-400 dark:to-purple-400"
              type="button"
            >
              <span>🎲</span>
              Reroll
            </button>
          </div>
        </div>
      </DemoSection>

      {/* Animation Details */}
      <DemoSection title="Animation CSS">
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
          <pre className="bg-slate-50 p-4 text-xs dark:bg-slate-900">
            <code className="text-slate-800 dark:text-slate-200">{`/* In styles.css */
@keyframes spin-dice {
  from { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(180deg) scale(1.2); }
  to { transform: rotate(360deg) scale(1); }
}

@keyframes bounce-pop {
  0% { transform: scale(1); }
  50% { transform: scale(1.08); }
  100% { transform: scale(1); }
}

/* Usage: animate-[spin-dice_0.3s_ease-out] */
/* Usage: animate-[bounce-pop_0.3s_ease-out] */`}</code>
          </pre>
        </div>
      </DemoSection>
    </div>
  );
}
