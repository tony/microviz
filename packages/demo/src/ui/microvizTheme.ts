import type { ResolvedColorScheme } from "./colorScheme";

export type MicrovizThemePreference = "auto" | "g10" | "g100" | "g90" | "white";
export type MicrovizThemePreset = Exclude<MicrovizThemePreference, "auto">;

const STORAGE_KEY = "microviz:demo:microviz-theme";

function isMicrovizThemePreference(
  value: unknown,
): value is MicrovizThemePreference {
  return (
    value === "auto" ||
    value === "white" ||
    value === "g10" ||
    value === "g90" ||
    value === "g100"
  );
}

export function readMicrovizThemePreference(): MicrovizThemePreference {
  if (typeof localStorage === "undefined") return "auto";
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return isMicrovizThemePreference(raw) ? raw : "auto";
  } catch {
    return "auto";
  }
}

export function writeMicrovizThemePreference(
  value: MicrovizThemePreference,
): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // ignore
  }
}

export function resolveMicrovizTheme(
  preference: MicrovizThemePreference,
  colorScheme: ResolvedColorScheme,
): MicrovizThemePreset {
  if (preference !== "auto") return preference;
  return colorScheme === "dark" ? "g100" : "white";
}

export function applyMicrovizTheme(theme: MicrovizThemePreset): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.mvTheme = theme;
}
