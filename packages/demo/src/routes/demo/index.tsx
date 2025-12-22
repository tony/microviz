import { createFileRoute } from "@tanstack/react-router";
import { DemoCard } from "../../ui/DemoCard";
import { TabToggle } from "../../ui/TabToggle";

export const Route = createFileRoute("/demo/")({
  component: DemoIndexRoute,
});

function DemoIndexRoute() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Demo Overview
        </h2>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Explore UI components and patterns used in the Microviz demo app.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DemoCard
          description="Tab toggles, buttons, and interactive controls"
          href="/demo/ux"
          preview={
            <TabToggle
              container="bordered"
              disabled
              label="Preview"
              onChange={() => {}}
              options={[
                { id: "a", label: "One" },
                { id: "b", label: "Two" },
                { id: "c", label: "Three" },
              ]}
              value="b"
              variant="muted"
            />
          }
          title="UX Components"
        />
      </div>
    </div>
  );
}
