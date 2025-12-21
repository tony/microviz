import { useCallback, useMemo, useState } from "react";
import { MicroVizAggregateDemo } from "../react/aggregate";
import { MicroVizDemo } from "../react/patterns";
import { VirtualizedStack } from "../ui/VirtualizedStack";

export function GalleryComponent() {
  const [scrollEl, setScrollEl] = useState<HTMLDivElement | null>(null);
  const getScrollElement = useCallback(() => scrollEl, [scrollEl]);

  const sectionBlocks = useMemo(
    () => [
      {
        estimateSize: 1800,
        key: "patterns",
        node: (
          <section className="mb-16 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 text-lg font-semibold">Patterns gallery</h2>
            <MicroVizDemo getScrollElement={getScrollElement} />
          </section>
        ),
      },
      {
        estimateSize: 1500,
        key: "aggregate",
        node: (
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 text-lg font-semibold">Aggregate gallery</h2>
            <MicroVizAggregateDemo getScrollElement={getScrollElement} />
          </section>
        ),
      },
    ],
    [getScrollElement],
  );

  return (
    <div className="h-full overflow-auto" ref={setScrollEl}>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <VirtualizedStack
          blocks={sectionBlocks}
          estimateSize={1600}
          getScrollElement={getScrollElement}
          overscan={2}
        />
      </div>
    </div>
  );
}
