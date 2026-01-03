import { createFileRoute } from "@tanstack/react-router";
import { DemoSection } from "../../../ui/DemoSection";
import { RerollButton } from "../../../ui/RerollButton";

export const Route = createFileRoute("/demo/ux/button")({
  component: ButtonDemoRoute,
});

function ButtonDemoRoute() {
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

      {/* Reroll Button Variants */}
      <DemoSection
        description="All RerollButton size variants. Each supports icon-only or icon+label via showLabel prop."
        title="Reroll Button Variants"
      >
        <div className="space-y-6">
          {/* Icon only row */}
          <div>
            <div className="mb-2 text-xs font-medium text-slate-500">
              Icon only
            </div>
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-1 text-center">
                <span className="text-xs text-slate-500">xxs</span>
                <div className="text-[10px] text-slate-400">20px</div>
                <RerollButton showLabel={false} variant="xxs" />
              </div>
              <div className="space-y-1 text-center">
                <span className="text-xs text-slate-500">xs</span>
                <div className="text-[10px] text-slate-400">22px</div>
                <RerollButton showLabel={false} variant="xs" />
              </div>
              <div className="space-y-1 text-center">
                <span className="text-xs text-slate-500">sm</span>
                <div className="text-[10px] text-slate-400">24px</div>
                <RerollButton showLabel={false} variant="sm" />
              </div>
              <div className="space-y-1 text-center">
                <span className="text-xs text-slate-500">md</span>
                <div className="text-[10px] text-slate-400">32px</div>
                <RerollButton showLabel={false} variant="md" />
              </div>
              <div className="space-y-1 text-center">
                <span className="text-xs text-slate-500">lg</span>
                <div className="text-[10px] text-slate-400">36px</div>
                <RerollButton showLabel={false} variant="lg" />
              </div>
              <div className="space-y-1 text-center">
                <span className="text-xs text-slate-500">xl</span>
                <div className="text-[10px] text-slate-400">40px</div>
                <RerollButton showLabel={false} variant="xl" />
              </div>
              <div className="space-y-1 text-center">
                <span className="text-xs text-slate-500">xxl</span>
                <div className="text-[10px] text-slate-400">44px</div>
                <RerollButton showLabel={false} variant="xxl" />
              </div>
              <div className="space-y-1 text-center">
                <span className="text-xs text-slate-500">xxxl</span>
                <div className="text-[10px] text-slate-400">48px</div>
                <RerollButton showLabel={false} variant="xxxl" />
              </div>
            </div>
          </div>

          {/* Icon + label row */}
          <div>
            <div className="mb-2 text-xs font-medium text-slate-500">
              Icon + label
            </div>
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-1 text-center">
                <span className="text-xs text-slate-500">xxs</span>
                <div className="text-[10px] text-slate-400">20px</div>
                <RerollButton showLabel variant="xxs" />
              </div>
              <div className="space-y-1 text-center">
                <span className="text-xs text-slate-500">xs</span>
                <div className="text-[10px] text-slate-400">22px</div>
                <RerollButton showLabel variant="xs" />
              </div>
              <div className="space-y-1 text-center">
                <span className="text-xs text-slate-500">sm</span>
                <div className="text-[10px] text-slate-400">24px</div>
                <RerollButton showLabel variant="sm" />
              </div>
              <div className="space-y-1 text-center">
                <span className="text-xs text-slate-500">md</span>
                <div className="text-[10px] text-slate-400">32px</div>
                <RerollButton showLabel variant="md" />
              </div>
              <div className="space-y-1 text-center">
                <span className="text-xs text-slate-500">lg</span>
                <div className="text-[10px] text-slate-400">36px</div>
                <RerollButton showLabel variant="lg" />
              </div>
              <div className="space-y-1 text-center">
                <span className="text-xs text-slate-500">xl</span>
                <div className="text-[10px] text-slate-400">40px</div>
                <RerollButton showLabel variant="xl" />
              </div>
              <div className="space-y-1 text-center">
                <span className="text-xs text-slate-500">xxl</span>
                <div className="text-[10px] text-slate-400">44px</div>
                <RerollButton showLabel variant="xxl" />
              </div>
              <div className="space-y-1 text-center">
                <span className="text-xs text-slate-500">xxxl</span>
                <div className="text-[10px] text-slate-400">48px</div>
                <RerollButton showLabel variant="xxxl" />
              </div>
            </div>
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
