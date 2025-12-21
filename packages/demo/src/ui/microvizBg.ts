export type MicrovizBackgroundPreference = "solid" | "transparent";

const STORAGE_KEY = "microviz:demo:microviz-bg";

function isMicrovizBackgroundPreference(
  value: unknown,
): value is MicrovizBackgroundPreference {
  return value === "solid" || value === "transparent";
}

export function readMicrovizBackgroundPreference(): MicrovizBackgroundPreference {
  if (typeof localStorage === "undefined") return "transparent";
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return isMicrovizBackgroundPreference(raw) ? raw : "transparent";
  } catch {
    return "transparent";
  }
}

export function writeMicrovizBackgroundPreference(
  value: MicrovizBackgroundPreference,
): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // ignore
  }
}

export function applyMicrovizBackgroundPreference(
  value: MicrovizBackgroundPreference,
): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  if (value === "transparent") {
    root.dataset.mvBg = "transparent";
    return;
  }

  delete root.dataset.mvBg;
}
