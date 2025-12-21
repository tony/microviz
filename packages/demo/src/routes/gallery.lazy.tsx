import { useCallback, useState } from "react";
import { MicroVizAggregateDemo } from "../react/aggregate";
import { MicroVizDemo } from "../react/patterns";

export function GalleryComponent() {
  const [scrollEl, setScrollEl] = useState<HTMLDivElement | null>(null);
  const getScrollElement = useCallback(() => scrollEl, [scrollEl]);

  return (
    <div className="h-full overflow-auto" ref={setScrollEl}>
      <div className="mx-auto max-w-6xl space-y-16 px-4 py-8">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-lg font-semibold">Patterns gallery</h2>
          <MicroVizDemo getScrollElement={getScrollElement} />
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-lg font-semibold">Aggregate gallery</h2>
          <MicroVizAggregateDemo getScrollElement={getScrollElement} />
        </section>
      </div>
    </div>
  );
}
