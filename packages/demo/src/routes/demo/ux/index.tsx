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
