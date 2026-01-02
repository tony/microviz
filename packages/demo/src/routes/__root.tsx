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
import { TabToggle } from "../ui/TabToggle";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const currentTab = pathname.startsWith("/gallery")
    ? "gallery"
    : pathname.startsWith("/playground")
      ? "playground"
      : "browse";

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
    <div className="flex h-screen h-[100dvh] flex-col overflow-hidden">
      <header className="flex min-h-11 flex-none flex-wrap items-center gap-2 border-b border-slate-200 bg-white/70 px-3 py-2 dark:border-slate-800 dark:bg-slate-950/40 sm:h-11 sm:flex-nowrap sm:gap-3 sm:py-0">
        <div className="flex min-w-0 w-full items-center gap-3 sm:w-auto">
          <h1 className="text-sm font-semibold tracking-tight">microviz</h1>

          <TabToggle
            label="Navigation"
            onChange={(v) =>
              navigate({
                to:
                  v === "gallery"
                    ? "/gallery"
                    : v === "playground"
                      ? "/playground"
                      : "/",
              })
            }
            options={[
              { id: "browse", label: "Browse" },
              { id: "playground", label: "Playground" },
              { id: "gallery", label: "Gallery" },
            ]}
            size="sm"
            value={currentTab}
          />
        </div>

        <div className="flex min-w-0 w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-1 sm:flex-nowrap sm:justify-end sm:overflow-x-auto [scrollbar-gutter:stable]">
          <TabToggle
            label="UI color scheme"
            onChange={setColorSchemePreference}
            options={[
              { id: "system", label: "System", title: "UI scheme: system" },
              { id: "light", label: "Light", title: "UI scheme: light" },
              { id: "dark", label: "Dark", title: "UI scheme: dark" },
            ]}
            size="xs"
            value={colorSchemePreference}
          />

          <select
            aria-label="Microviz preset"
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

          <TabToggle
            label="Microviz background"
            onChange={setMicrovizBackgroundPreference}
            options={[
              {
                id: "transparent",
                label: "Transparent",
                title: "Microviz bg: transparent",
              },
              { id: "solid", label: "Solid", title: "Microviz bg: preset" },
            ]}
            size="xs"
            value={microvizBackgroundPreference}
          />
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
