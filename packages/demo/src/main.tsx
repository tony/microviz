import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";
import {
  applyResolvedColorScheme,
  readColorSchemePreference,
  resolveColorScheme,
} from "./ui/colorScheme";
import {
  applyMicrovizBackgroundPreference,
  readMicrovizBackgroundPreference,
} from "./ui/microvizBg";
import {
  applyMicrovizTheme,
  readMicrovizThemePreference,
  resolveMicrovizTheme,
} from "./ui/microvizTheme";

const initialColorScheme = resolveColorScheme(readColorSchemePreference());
applyResolvedColorScheme(initialColorScheme);
applyMicrovizTheme(
  resolveMicrovizTheme(readMicrovizThemePreference(), initialColorScheme),
);
applyMicrovizBackgroundPreference(readMicrovizBackgroundPreference());

const container = document.getElementById("root");
if (!container) {
  throw new Error("Missing #root element");
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
