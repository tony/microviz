import type { FC } from "react";
import { useState } from "react";
import { MicrovizPlayground } from "./playground/MicrovizPlayground";
import { aggregate, MicroVizDemo } from "./react";
import { tabButton } from "./ui/styles";

export const App: FC = () => {
  const [view, setView] = useState<"gallery" | "playground">("playground");

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="flex h-12 flex-none items-center justify-between gap-4 border-b border-slate-200 bg-white/70 px-4 dark:border-slate-800 dark:bg-slate-950/40">
        <div className="flex items-baseline gap-2">
          <h1 className="text-sm font-semibold tracking-tight">microviz</h1>
          <div className="text-xs text-slate-500 dark:text-slate-400">demo</div>
        </div>

        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800/50">
          <button
            className={tabButton({
              active: view === "playground",
              className: "active:scale-[0.98]",
              size: "md",
            })}
            onClick={() => setView("playground")}
            type="button"
          >
            Playground
          </button>
          <button
            className={tabButton({
              active: view === "gallery",
              className: "active:scale-[0.98]",
              size: "md",
            })}
            onClick={() => setView("gallery")}
            type="button"
          >
            Gallery
          </button>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-hidden">
        {view === "playground" ? (
          <MicrovizPlayground />
        ) : (
          <div className="h-full overflow-auto">
            <div className="mx-auto max-w-6xl space-y-16 px-4 py-8">
              <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h2 className="mb-4 text-lg font-semibold">Patterns gallery</h2>
                <MicroVizDemo />
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h2 className="mb-4 text-lg font-semibold">
                  Aggregate gallery
                </h2>
                <aggregate.MicroVizAggregateDemo />
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
