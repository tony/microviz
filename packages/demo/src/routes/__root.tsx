import {
  createRootRoute,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  applyResolvedColorScheme,
  type ColorSchemePreference,
  type ResolvedColorScheme,
  readColorSchemePreference,
  resolveColorScheme,
  writeColorSchemePreference,
} from "../ui/colorScheme";
import {
  applyMicrovizBackgroundPreference,
  type MicrovizBackgroundPreference,
  readMicrovizBackgroundPreference,
  writeMicrovizBackgroundPreference,
} from "../ui/microvizBg";
import {
  applyMicrovizTheme,
  type MicrovizThemePreference,
  readMicrovizThemePreference,
  resolveMicrovizTheme,
  writeMicrovizThemePreference,
} from "../ui/microvizTheme";
import { tabButton } from "../ui/styles";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const showGallery = pathname.startsWith("/gallery");

  const [colorSchemePreference, setColorSchemePreference] =
    useState<ColorSchemePreference>(() => readColorSchemePreference());
  const [resolvedColorScheme, setResolvedColorScheme] =
    useState<ResolvedColorScheme>(() =>
      resolveColorScheme(readColorSchemePreference()),
    );
  const [microvizThemePreference, setMicrovizThemePreference] =
    useState<MicrovizThemePreference>(() => readMicrovizThemePreference());
  const [microvizBackgroundPreference, setMicrovizBackgroundPreference] =
    useState<MicrovizBackgroundPreference>(() =>
      readMicrovizBackgroundPreference(),
    );

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

  useEffect(() => {
    writeMicrovizBackgroundPreference(microvizBackgroundPreference);
    applyMicrovizBackgroundPreference(microvizBackgroundPreference);
  }, [microvizBackgroundPreference]);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="flex h-12 flex-none items-center justify-between gap-4 border-b border-slate-200 bg-white/70 px-4 dark:border-slate-800 dark:bg-slate-950/40">
        <div className="flex items-baseline gap-2">
          <h1 className="text-sm font-semibold tracking-tight">microviz</h1>
          <div className="text-xs text-slate-500 dark:text-slate-400">demo</div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="hidden flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800/50 md:flex">
            <button
              className={tabButton({
                active: !showGallery,
                className: "active:scale-[0.98]",
                size: "md",
              })}
              onClick={() => navigate({ to: "/" })}
              title="Playground"
              type="button"
            >
              Playground
            </button>
            <button
              className={tabButton({
                active: showGallery,
                className: "active:scale-[0.98]",
                size: "md",
              })}
              onClick={() => navigate({ to: "/gallery" })}
              title="Gallery"
              type="button"
            >
              Gallery
            </button>
          </div>
          <label className="flex items-center gap-2 rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-700 dark:bg-slate-800/50 dark:text-slate-200 md:hidden">
            <span className="sr-only">Page</span>
            <select
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 shadow-sm outline-none transition focus:ring-2 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-slate-600"
              onChange={(event) =>
                navigate({
                  to: event.target.value === "gallery" ? "/gallery" : "/",
                })
              }
              title="Page"
              value={showGallery ? "gallery" : "playground"}
            >
              <option value="playground">Playground</option>
              <option value="gallery">Gallery</option>
            </select>
          </label>

          <div className="hidden items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800/50 md:flex">
            <button
              className={tabButton({
                active: colorSchemePreference === "system",
                className: "active:scale-[0.98]",
                size: "xs",
              })}
              onClick={() => setColorSchemePreference("system")}
              title="UI scheme: system"
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
              title="UI scheme: light"
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
              title="UI scheme: dark"
              type="button"
            >
              Dark
            </button>
          </div>
          <label className="flex items-center gap-2 rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-700 dark:bg-slate-800/50 dark:text-slate-200 md:hidden">
            <span className="sr-only">UI scheme</span>
            <select
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 shadow-sm outline-none transition focus:ring-2 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-slate-600"
              onChange={(event) =>
                setColorSchemePreference(
                  event.target.value as ColorSchemePreference,
                )
              }
              title="UI scheme"
              value={colorSchemePreference}
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>

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
              title="Microviz preset (Auto follows UI)"
              value={microvizThemePreference}
            >
              <option value="auto">Auto</option>
              <option value="white">White</option>
              <option value="g10">G10</option>
              <option value="g90">G90</option>
              <option value="g100">G100</option>
            </select>
          </label>

          <div className="hidden items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800/50 md:flex">
            <button
              className={tabButton({
                active: microvizBackgroundPreference === "transparent",
                className: "active:scale-[0.98]",
                size: "xs",
              })}
              onClick={() => setMicrovizBackgroundPreference("transparent")}
              title="Microviz bg: transparent"
              type="button"
            >
              Transparent
            </button>
            <button
              className={tabButton({
                active: microvizBackgroundPreference === "solid",
                className: "active:scale-[0.98]",
                size: "xs",
              })}
              onClick={() => setMicrovizBackgroundPreference("solid")}
              title="Microviz bg: preset"
              type="button"
            >
              Solid
            </button>
          </div>
          <label className="flex items-center gap-2 rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-700 dark:bg-slate-800/50 dark:text-slate-200 md:hidden">
            <span className="sr-only">Microviz background</span>
            <select
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 shadow-sm outline-none transition focus:ring-2 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-slate-600"
              onChange={(event) =>
                setMicrovizBackgroundPreference(
                  event.target.value as MicrovizBackgroundPreference,
                )
              }
              title="Microviz background"
              value={microvizBackgroundPreference}
            >
              <option value="transparent">Transparent</option>
              <option value="solid">Solid</option>
            </select>
          </label>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
