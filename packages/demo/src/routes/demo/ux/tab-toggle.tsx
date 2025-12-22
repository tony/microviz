import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DemoSection } from "../../../ui/DemoSection";
import { TabToggle } from "../../../ui/TabToggle";

export const Route = createFileRoute("/demo/ux/tab-toggle")({
  component: TabToggleDemoRoute,
});

function TabToggleDemoRoute() {
  // Single-select examples state
  const [filledValue, setFilledValue] = useState<"a" | "b" | "c">("a");
  const [borderedValue, setBorderedValue] = useState<"x" | "y" | "z">("y");

  // Multi-select example state
  const [multiValue, setMultiValue] = useState<
    ("line" | "bar" | "area" | "dot")[]
  >(["line", "bar"]);

  // Interactive playground state
  const [playgroundValue, setPlaygroundValue] = useState<"one" | "two">("one");
  const [container, setContainer] = useState<"filled" | "bordered">("filled");
  const [variant, setVariant] = useState<"default" | "muted">("default");
  const [size, setSize] = useState<"xs" | "sm" | "md">("xs");

  return (
    <div className="space-y-8 p-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          TabToggle
        </h2>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          A unified tab toggle component for single and multi-select modes with
          configurable container and button styling.
        </p>
      </div>

      {/* Single-Select: Filled Container */}
      <DemoSection
        description="White active background, transparent inactive. Used in header navigation and sidebar tabs."
        title="Filled Container + Default Variant"
      >
        <div className="flex flex-wrap items-center gap-4">
          <TabToggle
            container="filled"
            label="Example filled toggle"
            onChange={setFilledValue}
            options={[
              { id: "a", label: "Option A" },
              { id: "b", label: "Option B" },
              { id: "c", label: "Option C" },
            ]}
            value={filledValue}
            variant="default"
          />
          <span className="text-xs text-slate-500">
            Selected: <code>{filledValue}</code>
          </span>
        </div>
      </DemoSection>

      {/* Single-Select: Bordered Container */}
      <DemoSection
        description="Slate active background with border container. Used in inspector tabs and chart filters."
        title="Bordered Container + Muted Variant"
      >
        <div className="flex flex-wrap items-center gap-4">
          <TabToggle
            container="bordered"
            label="Example bordered toggle"
            onChange={setBorderedValue}
            options={[
              { id: "x", label: "First" },
              { id: "y", label: "Second" },
              { id: "z", label: "Third" },
            ]}
            value={borderedValue}
            variant="muted"
          />
          <span className="text-xs text-slate-500">
            Selected: <code>{borderedValue}</code>
          </span>
        </div>
      </DemoSection>

      {/* Sizes */}
      <DemoSection
        description="Three size variants: xs (default), sm, and md."
        title="Sizes"
      >
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <span className="text-xs text-slate-500">xs</span>
            <TabToggle
              label="Size xs"
              onChange={() => {}}
              options={[
                { id: "a", label: "One" },
                { id: "b", label: "Two" },
              ]}
              size="xs"
              value="a"
            />
          </div>
          <div className="space-y-1">
            <span className="text-xs text-slate-500">sm</span>
            <TabToggle
              label="Size sm"
              onChange={() => {}}
              options={[
                { id: "a", label: "One" },
                { id: "b", label: "Two" },
              ]}
              size="sm"
              value="a"
            />
          </div>
          <div className="space-y-1">
            <span className="text-xs text-slate-500">md</span>
            <TabToggle
              label="Size md"
              onChange={() => {}}
              options={[
                { id: "a", label: "One" },
                { id: "b", label: "Two" },
              ]}
              size="md"
              value="a"
            />
          </div>
        </div>
      </DemoSection>

      {/* Multi-Select */}
      <DemoSection
        description="Multiple options can be selected simultaneously. Uses aria-pressed instead of aria-selected."
        title="Multi-Select Mode"
      >
        <div className="flex flex-wrap items-center gap-4">
          <TabToggle
            container="bordered"
            label="Chart type filter"
            mode="multi"
            onChange={setMultiValue}
            options={[
              { id: "line", label: "Line" },
              { id: "bar", label: "Bar" },
              { id: "area", label: "Area" },
              { id: "dot", label: "Dot" },
            ]}
            value={multiValue}
            variant="muted"
          />
          <span className="text-xs text-slate-500">
            Selected: <code>[{multiValue.join(", ")}]</code>
          </span>
        </div>
      </DemoSection>

      {/* Interactive Playground */}
      <DemoSection
        description="Adjust props to see how the component changes."
        title="Interactive Playground"
      >
        <div className="space-y-6 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
          {/* Preview */}
          <div className="flex items-center justify-center rounded-lg bg-white p-6 dark:bg-slate-950">
            <TabToggle
              container={container}
              label="Playground toggle"
              onChange={setPlaygroundValue}
              options={[
                { id: "one", label: "Option One" },
                { id: "two", label: "Option Two" },
              ]}
              size={size}
              value={playgroundValue}
              variant={variant}
            />
          </div>

          {/* Controls */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Container
              </span>
              <TabToggle
                container="bordered"
                label="Container style"
                onChange={setContainer}
                options={[
                  { id: "filled", label: "Filled" },
                  { id: "bordered", label: "Bordered" },
                ]}
                size="xs"
                value={container}
                variant="muted"
              />
            </div>
            <div className="space-y-2">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Variant
              </span>
              <TabToggle
                container="bordered"
                label="Button variant"
                onChange={setVariant}
                options={[
                  { id: "default", label: "Default" },
                  { id: "muted", label: "Muted" },
                ]}
                size="xs"
                value={variant}
                variant="muted"
              />
            </div>
            <div className="space-y-2">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Size
              </span>
              <TabToggle
                container="bordered"
                label="Button size"
                onChange={setSize}
                options={[
                  { id: "xs", label: "xs" },
                  { id: "sm", label: "sm" },
                  { id: "md", label: "md" },
                ]}
                size="xs"
                value={size}
                variant="muted"
              />
            </div>
          </div>
        </div>
      </DemoSection>

      {/* API Reference */}
      <DemoSection title="Props">
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-2 font-medium">Prop</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Default</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              <tr>
                <td className="px-4 py-2 font-mono text-xs">label</td>
                <td className="px-4 py-2 font-mono text-xs">string</td>
                <td className="px-4 py-2 text-slate-500">required</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs">options</td>
                <td className="px-4 py-2 font-mono text-xs">
                  TabOption&lt;T&gt;[]
                </td>
                <td className="px-4 py-2 text-slate-500">required</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs">value</td>
                <td className="px-4 py-2 font-mono text-xs">T | T[]</td>
                <td className="px-4 py-2 text-slate-500">required</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs">onChange</td>
                <td className="px-4 py-2 font-mono text-xs">
                  (v: T | T[]) =&gt; void
                </td>
                <td className="px-4 py-2 text-slate-500">required</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs">mode</td>
                <td className="px-4 py-2 font-mono text-xs">
                  "single" | "multi"
                </td>
                <td className="px-4 py-2 font-mono text-xs">"single"</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs">container</td>
                <td className="px-4 py-2 font-mono text-xs">
                  "filled" | "bordered"
                </td>
                <td className="px-4 py-2 font-mono text-xs">"filled"</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs">variant</td>
                <td className="px-4 py-2 font-mono text-xs">
                  "default" | "muted"
                </td>
                <td className="px-4 py-2 font-mono text-xs">"default"</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs">size</td>
                <td className="px-4 py-2 font-mono text-xs">
                  "xs" | "sm" | "md"
                </td>
                <td className="px-4 py-2 font-mono text-xs">"xs"</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs">disabled</td>
                <td className="px-4 py-2 font-mono text-xs">boolean</td>
                <td className="px-4 py-2 font-mono text-xs">false</td>
              </tr>
            </tbody>
          </table>
        </div>
      </DemoSection>
    </div>
  );
}
