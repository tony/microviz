import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ResizablePane } from "../browse/ResizablePane";
import { RerollButton } from "../ui/RerollButton";
import { CdnSourcePicker } from "./CdnSourcePicker";
import { CodeEditor } from "./CodeEditor";
import { ConsoleOutput } from "./ConsoleOutput";
import type { CdnPlaygroundState, CspMode } from "./cdnPlaygroundState";
import { type CdnSource, getCdnUrl } from "./cdnSources";
import {
  type ConsoleEntry,
  PreviewPane,
  type PreviewPaneHandle,
} from "./PreviewPane";
import { applySeededData, generateDataForPreset } from "./presetData";
import { PRESETS } from "./presets";

export type CdnPlaygroundProps = {
  urlState: CdnPlaygroundState;
  onUrlStateChange: (state: CdnPlaygroundState) => void;
};

/**
 * Main CDN playground component.
 * Provides a JSFiddle-like experience for testing microviz CDN embeds.
 */
export function CdnPlayground({
  urlState,
  onUrlStateChange,
}: CdnPlaygroundProps) {
  const [consoleLogs, setConsoleLogs] = useState<ConsoleEntry[]>([]);
  const previewRef = useRef<PreviewPaneHandle>(null);

  // Stable code for iframe - only updated when full reload is needed.
  // This prevents iframe reloads during reactive attribute updates (Reroll).
  // The iframe gets data updates via postMessage, so stableCode can lag behind
  // urlState.code without causing visual issues.
  const [stableCode, setStableCode] = useState(urlState.code);

  // Derive theme from system preference
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "dark";
    return document.documentElement.classList.contains("dark")
      ? "dark"
      : "light";
  });

  // Watch for theme changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(
        document.documentElement.classList.contains("dark") ? "dark" : "light",
      );
    });
    observer.observe(document.documentElement, {
      attributeFilter: ["class"],
      attributes: true,
    });
    return () => observer.disconnect();
  }, []);

  const cdnUrl = useMemo(
    () => getCdnUrl(urlState.cdnSource),
    [urlState.cdnSource],
  );

  const handleCodeChange = useCallback(
    (code: string) => {
      // User edited code - need full reload
      setStableCode(code);
      onUrlStateChange({ ...urlState, code, presetId: null });
    },
    [urlState, onUrlStateChange],
  );

  const handleCdnSourceChange = useCallback(
    (cdnSource: CdnSource) => {
      // CDN source change - need full reload (stableCode stays same, but cdnUrl changes)
      onUrlStateChange({ ...urlState, cdnSource });
    },
    [urlState, onUrlStateChange],
  );

  const handleCspModeChange = useCallback(
    (cspMode: CspMode) => {
      // CSP mode change - need full reload (stableCode stays same, but cspMode changes)
      onUrlStateChange({ ...urlState, cspMode });
    },
    [urlState, onUrlStateChange],
  );

  const handlePresetChange = useCallback(
    (presetId: string) => {
      const preset = PRESETS.find((p) => p.id === presetId);
      if (preset) {
        const code = applySeededData(presetId, preset.code, urlState.seed);
        // Preset change - need full reload
        setStableCode(code);
        onUrlStateChange({
          ...urlState,
          code,
          presetId,
        });
        setConsoleLogs([]);
      }
    },
    [urlState, onUrlStateChange],
  );

  const handleReroll = useCallback(() => {
    const newSeed = `mv-${Math.floor(Math.random() * 10_000)}`;
    if (urlState.presetId) {
      // Try reactive update first (no iframe reload)
      const updates = generateDataForPreset(urlState.presetId, newSeed);
      if (updates && previewRef.current) {
        // Send reactive updates to iframe via postMessage
        for (const update of updates) {
          previewRef.current.updateAttribute(
            update.selector,
            update.attribute,
            update.value,
          );
        }
        // Update URL state for editor display and URL sharing
        // Do NOT update stableCode - animation plays via postMessage update
        const preset = PRESETS.find((p) => p.id === urlState.presetId);
        if (preset) {
          const code = applySeededData(urlState.presetId, preset.code, newSeed);
          onUrlStateChange({
            ...urlState,
            code,
            seed: newSeed,
          });
        }
        return;
      }

      // Fallback: full reload for presets that don't support reactive updates
      const preset = PRESETS.find((p) => p.id === urlState.presetId);
      if (preset) {
        const code = applySeededData(urlState.presetId, preset.code, newSeed);
        setStableCode(code);
        onUrlStateChange({
          ...urlState,
          code,
          seed: newSeed,
        });
        setConsoleLogs([]);
        return;
      }
    }
    // If no preset, just update the seed (won't affect custom code)
    onUrlStateChange({ ...urlState, seed: newSeed });
  }, [urlState, onUrlStateChange]);

  const handleConsoleMessage = useCallback((entry: ConsoleEntry) => {
    setConsoleLogs((prev) => [...prev.slice(-99), entry]); // Keep last 100
  }, []);

  const handleClearConsole = useCallback(() => {
    setConsoleLogs([]);
  }, []);

  const handleRun = useCallback(() => {
    // Force full iframe reload with current code
    setConsoleLogs([]);
    setStableCode(urlState.code);
  }, [urlState.code]);

  return (
    <div className="flex h-full flex-col bg-slate-100 dark:bg-slate-900">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-4 border-b border-slate-200 bg-white px-4 py-2 dark:border-slate-700 dark:bg-slate-800">
        {/* Preset selector */}
        <label className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Preset
          </span>
          <select
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
            onChange={(e) => handlePresetChange(e.target.value)}
            value={urlState.presetId ?? ""}
          >
            {urlState.presetId === null && <option value="">Custom</option>}
            {PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
        </label>

        {/* Reroll button - only show when a preset is selected */}
        {urlState.presetId && <RerollButton onClick={handleReroll} />}

        {/* CSP toggle */}
        <label className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            CSP
          </span>
          <select
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
            onChange={(e) => handleCspModeChange(e.target.value as CspMode)}
            value={urlState.cspMode}
          >
            <option value="off">Off</option>
            <option value="claude-artifacts">Claude Artifacts</option>
          </select>
        </label>

        {/* Run button */}
        <button
          className="rounded-md bg-indigo-600 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          onClick={handleRun}
          type="button"
        >
          Run
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* CDN URL display */}
        <div className="hidden items-center gap-2 text-xs text-slate-500 dark:text-slate-400 lg:flex">
          <span className="font-medium">CDN:</span>
          <code className="max-w-xs truncate rounded bg-slate-100 px-1.5 py-0.5 font-mono dark:bg-slate-700">
            {cdnUrl}
          </code>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left pane - Code editor + CDN picker */}
        <ResizablePane
          collapsible
          contentClassName="flex flex-col h-full overflow-hidden"
          defaultSize={500}
          minSize={300}
          name="code"
          side="left"
        >
          <div className="flex flex-1 flex-col overflow-hidden bg-slate-900">
            {/* CDN Source Picker - collapsible */}
            <details className="border-b border-slate-700" open>
              <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800">
                CDN Source
              </summary>
              <div className="px-3 pb-3">
                <CdnSourcePicker
                  onChange={handleCdnSourceChange}
                  value={urlState.cdnSource}
                />
              </div>
            </details>

            {/* Code editor */}
            <div className="flex-1 overflow-hidden">
              <CodeEditor
                language="html"
                onChange={handleCodeChange}
                theme={theme}
                value={urlState.code}
              />
            </div>
          </div>
        </ResizablePane>

        {/* Right pane - Preview + Console */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Preview */}
          <div className="flex-1 overflow-hidden">
            <PreviewPane
              cdnUrl={cdnUrl}
              className="h-full"
              code={stableCode}
              cspMode={urlState.cspMode}
              onConsoleMessage={handleConsoleMessage}
              ref={previewRef}
            />
          </div>

          {/* Console */}
          <ConsoleOutput
            className="h-32 flex-shrink-0"
            logs={consoleLogs}
            onClear={handleClearConsole}
          />
        </div>
      </div>
    </div>
  );
}
