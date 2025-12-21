// Demo UI color scheme preference.
// - Drives Tailwind `dark:` variants by toggling `<html class="dark">`.
// - Sets `color-scheme` so native form controls (selects, scrollbars, etc.) match.
// This is intentionally separate from Microviz chart theming (`data-mv-theme`).
export type ColorSchemePreference = "dark" | "light" | "system";
export type ResolvedColorScheme = "dark" | "light";

const STORAGE_KEY = "microviz:demo:color-scheme";

function isColorSchemePreference(
  value: unknown,
): value is ColorSchemePreference {
  return value === "system" || value === "light" || value === "dark";
}

export function readColorSchemePreference(): ColorSchemePreference {
  if (typeof localStorage === "undefined") return "system";
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return isColorSchemePreference(raw) ? raw : "system";
  } catch {
    return "system";
  }
}

export function writeColorSchemePreference(value: ColorSchemePreference): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // ignore
  }
}

export function getSystemColorScheme(): ResolvedColorScheme {
  if (typeof window === "undefined") return "light";
  if (typeof window.matchMedia !== "function") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function resolveColorScheme(
  preference: ColorSchemePreference,
): ResolvedColorScheme {
  return preference === "system" ? getSystemColorScheme() : preference;
}

export function applyResolvedColorScheme(resolved: ResolvedColorScheme): void {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
}
