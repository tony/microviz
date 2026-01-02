import { createContext, useContext } from "react";
import type { MicrovizBackgroundPreference } from "./microvizBg";
import type { MicrovizThemePreference } from "./microvizTheme";

export type MicrovizSettingsContextValue = {
  microvizThemePreference: MicrovizThemePreference;
  setMicrovizThemePreference: (value: MicrovizThemePreference) => void;
  microvizBackgroundPreference: MicrovizBackgroundPreference;
  setMicrovizBackgroundPreference: (
    value: MicrovizBackgroundPreference,
  ) => void;
};

export const MicrovizSettingsContext =
  createContext<MicrovizSettingsContextValue | null>(null);

export function useMicrovizSettings(): MicrovizSettingsContextValue {
  const context = useContext(MicrovizSettingsContext);
  if (!context) {
    throw new Error(
      "useMicrovizSettings must be used within a MicrovizSettingsContext.Provider",
    );
  }
  return context;
}
