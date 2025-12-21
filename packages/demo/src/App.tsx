import type { FC } from "react";
import { useEffect, useState } from "react";
import { MicrovizPlayground } from "./playground/MicrovizPlayground";
import { aggregate, MicroVizDemo } from "./react";
import {
  applyResolvedColorScheme,
  type ColorSchemePreference,
  type ResolvedColorScheme,
  readColorSchemePreference,
  resolveColorScheme,
  writeColorSchemePreference,
} from "./ui/colorScheme";
import {
  applyMicrovizTheme,
  type MicrovizThemePreference,
  readMicrovizThemePreference,
  resolveMicrovizTheme,
  writeMicrovizThemePreference,
} from "./ui/microvizTheme";
import { tabButton } from "./ui/styles";

export const App: FC = () => {
  const [view, setView] = useState<"gallery" | "playground">("playground");
  const [colorSchemePreference, setColorSchemePreference] =
    useState<ColorSchemePreference>(() => readColorSchemePreference());
  const [resolvedColorScheme, setResolvedColorScheme] =
    useState<ResolvedColorScheme>(() =>
      resolveColorScheme(readColorSchemePreference()),
    );
  const [microvizThemePreference, setMicrovizThemePreference] =
    useState<MicrovizThemePreference>(() => readMicrovizThemePreference());

  useEffect(() => {
    writeColorSchemePreference(colorSchemePreference);

    if (colorSchemePreference === "system") {
      if (typeof window.matchMedia !== "function") {
        setResolvedColorScheme("light");
        applyResolvedColorScheme("light");
        return;
      }

      const media = window.matchMedia("(prefers-color-scheme: dark)");
      const apply = () => {
        const resolved: ResolvedColorScheme = media.matches ? "dark" : "light";
        setResolvedColorScheme(resolved);
        applyResolvedColorScheme(resolved);
      };
      apply();

      if (typeof media.addEventListener === "function") {
        media.addEventListener("change", apply);
        return () => media.removeEventListener("change", apply);
      }

      media.addListener(apply);
      return () => media.removeListener(apply);
    }

    setResolvedColorScheme(colorSchemePreference);
    applyResolvedColorScheme(colorSchemePreference);
    return undefined;
  }, [colorSchemePreference]);

  useEffect(() => {
    writeMicrovizThemePreference(microvizThemePreference);
    const resolvedTheme = resolveMicrovizTheme(
      microvizThemePreference,
      resolvedColorScheme,
    );
    applyMicrovizTheme(resolvedTheme);
  }, [microvizThemePreference, resolvedColorScheme]);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="flex h-12 flex-none items-center justify-between gap-4 border-b border-slate-200 bg-white/70 px-4 dark:border-slate-800 dark:bg-slate-950/40">
        <div className="flex items-baseline gap-2">
          <h1 className="text-sm font-semibold tracking-tight">microviz</h1>
          <div className="text-xs text-slate-500 dark:text-slate-400">demo</div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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

          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800/50">
            <button
              className={tabButton({
                active: colorSchemePreference === "system",
                className: "active:scale-[0.98]",
                size: "xs",
              })}
              onClick={() => setColorSchemePreference("system")}
              type="button"
            >
              System
            </button>
            <button
              className={tabButton({
                active: colorSchemePreference === "light",
                className: "active:scale-[0.98]",
                size: "xs",
              })}
              onClick={() => setColorSchemePreference("light")}
              type="button"
            >
              Light
            </button>
            <button
              className={tabButton({
                active: colorSchemePreference === "dark",
                className: "active:scale-[0.98]",
                size: "xs",
              })}
              onClick={() => setColorSchemePreference("dark")}
              type="button"
            >
              Dark
            </button>
          </div>

          <label className="flex items-center gap-2 rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-700 dark:bg-slate-800/50 dark:text-slate-200">
            <span className="hidden whitespace-nowrap text-slate-600 dark:text-slate-300 lg:inline">
              Microviz
            </span>
            <select
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 shadow-sm outline-none transition focus:ring-2 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-slate-600"
              onChange={(event) =>
                setMicrovizThemePreference(
                  event.target.value as MicrovizThemePreference,
                )
              }
              value={microvizThemePreference}
            >
              <option value="auto">Auto</option>
              <option value="white">White</option>
              <option value="g10">G10</option>
              <option value="g90">G90</option>
              <option value="g100">G100</option>
            </select>
          </label>
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
