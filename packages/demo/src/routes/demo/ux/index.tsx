import { createFileRoute } from "@tanstack/react-router";
import { DemoCard } from "../../../ui/DemoCard";
import { TabToggle } from "../../../ui/TabToggle";

export const Route = createFileRoute("/demo/ux/")({
  component: UxIndexRoute,
});

function UxIndexRoute() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          UX Components
        </h2>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Interactive UI components for navigation, selection, and controls.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DemoCard
          description="Button styles including animated action buttons"
          href="/demo/ux/button"
          preview={
            <div className="flex items-center gap-3">
              <button
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                disabled
                type="button"
              >
                Basic
              </button>
              <button
                className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 px-2 py-1 text-xs font-bold text-white shadow-sm dark:from-indigo-400 dark:to-purple-400"
                disabled
                type="button"
              >
                <span>🎲</span>
              </button>
              <button
                className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 px-2 py-1 text-xs font-bold text-white shadow-sm dark:from-indigo-400 dark:to-purple-400"
                disabled
                type="button"
              >
                <span>🎲</span>
                Reroll
              </button>
            </div>
          }
          title="Button"
        />
        <DemoCard
          description="Single and multi-select tab toggles with configurable styling"
          href="/demo/ux/tab-toggle"
          preview={
            <div className="flex flex-col gap-2">
              <TabToggle
                container="filled"
                disabled
                label="Preview filled"
                onChange={() => {}}
                options={[
                  { id: "a", label: "A" },
                  { id: "b", label: "B" },
                ]}
                size="xs"
                value="a"
              />
              <TabToggle
                container="bordered"
                disabled
                label="Preview bordered"
                onChange={() => {}}
                options={[
                  { id: "a", label: "A" },
                  { id: "b", label: "B" },
                ]}
                size="xs"
                value="b"
                variant="muted"
              />
            </div>
          }
          title="TabToggle"
        />
      </div>
    </div>
  );
}
