import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ResizablePane } from "../browse/ResizablePane";
import { RerollButton } from "../ui/RerollButton";
import { CdnSourcePicker } from "./CdnSourcePicker";
import { CodeEditor } from "./CodeEditor";
import { ConsoleOutput } from "./ConsoleOutput";
import type { CdnPlaygroundState, CspMode } from "./cdnPlaygroundState";
import { type CdnSource, getCdnUrl } from "./cdnSources";
import { generateCode, type OutputFormat } from "./generators";
import {
  type ConsoleEntry,
  PreviewPane,
  type PreviewPaneHandle,
} from "./PreviewPane";
import { applySeededData, generateDataForPreset } from "./presetData";
import { PRESETS } from "./presets";
import { ReactPreviewPane } from "./ReactPreviewPane";
import {
  applyRandomData,
  canRandomize,
  generateReactiveUpdates,
} from "./randomization";
import { SmartCopyButton, useSmartCode } from "./SmartCopyButton";
import { findUnifiedPreset } from "./unified-presets";

/** Copy icon - clipboard with checkmark state */
function CopyIcon({ copied }: { copied: boolean }) {
  if (copied) {
    // Checkmark icon
    return (
      <svg
        aria-hidden="true"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  // Clipboard icon
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <rect height="13" rx="2" width="13" x="9" y="9" />
      <path
        d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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

  // CDN URL copy state
  const [cdnCopied, setCdnCopied] = useState(false);

  const handleCopyCdnUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(cdnUrl);
      setCdnCopied(true);
      setTimeout(() => setCdnCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy CDN URL:", err);
    }
  }, [cdnUrl]);

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
      // CDN source change - need full reload with new CDN URL
      const newCdnUrl = getCdnUrl(cdnSource);
      const newUnifiedPreset = findUnifiedPreset(urlState.presetId);
      if (newUnifiedPreset && urlState.format === "html") {
        // Regenerate HTML with new CDN URL
        const newCode = generateCode(newUnifiedPreset, "html", {
          cdnSource,
          cdnUrl: newCdnUrl,
          seed: urlState.seed,
          theme,
        });
        setStableCode(newCode.display);
      }
      onUrlStateChange({ ...urlState, cdnSource });
    },
    [urlState, onUrlStateChange, theme],
  );

  const handleCspModeChange = useCallback(
    (cspMode: CspMode) => {
      // CSP mode change - need full reload (stableCode stays same, but cspMode changes)
      onUrlStateChange({ ...urlState, cspMode });
    },
    [urlState, onUrlStateChange],
  );

  const handleFormatChange = useCallback(
    (format: OutputFormat) => {
      // Check if preset supports the format
      const unifiedPreset = findUnifiedPreset(urlState.presetId);
      if (unifiedPreset && !unifiedPreset.formats.includes(format)) {
        return; // Preset doesn't support this format
      }
      onUrlStateChange({ ...urlState, format });
    },
    [urlState, onUrlStateChange],
  );

  // Get unified preset for current selection
  const unifiedPreset = useMemo(
    () => findUnifiedPreset(urlState.presetId),
    [urlState.presetId],
  );

  // Generate code using the unified generators (supports both HTML and JSX)
  const generatedCode = useMemo(() => {
    if (!unifiedPreset) {
      return null;
    }
    return generateCode(unifiedPreset, urlState.format, {
      cdnSource: urlState.cdnSource,
      cdnUrl,
      seed: urlState.seed,
      theme,
    });
  }, [
    unifiedPreset,
    urlState.format,
    urlState.seed,
    cdnUrl,
    urlState.cdnSource,
    theme,
  ]);

  // Use smart code for display/copy when in JSX mode
  const { showFull } = useSmartCode(
    generatedCode?.display ?? "",
    generatedCode?.copyable ?? "",
  );

  // Determine display code based on format
  const displayCode = useMemo(() => {
    // Use generated code for unified presets (both HTML and JSX)
    if (generatedCode) {
      if (urlState.format === "jsx") {
        return showFull ? generatedCode.copyable : generatedCode.display;
      }
      // HTML format - always show full code
      return generatedCode.display;
    }
    // Fallback to user-edited code (custom or non-unified presets)
    return urlState.code;
  }, [urlState.format, urlState.code, generatedCode, showFull]);

  const handlePresetChange = useCallback(
    (presetId: string) => {
      const preset = PRESETS.find((p) => p.id === presetId);
      if (preset) {
        const code = applySeededData(presetId, preset.code, urlState.seed);
        // Check if new preset supports current format
        const newUnifiedPreset = findUnifiedPreset(presetId);
        const newFormat = newUnifiedPreset?.formats.includes(urlState.format)
          ? urlState.format
          : "html";
        // Preset change - need full reload
        setStableCode(code);
        onUrlStateChange({
          ...urlState,
          code,
          format: newFormat,
          presetId,
        });
        setConsoleLogs([]);
      }
    },
    [urlState, onUrlStateChange],
  );

  const handleReroll = useCallback(() => {
    const newSeed = `mv-${Math.floor(Math.random() * 10_000)}`;

    // Custom code path - use universal randomization
    if (!urlState.presetId) {
      const updates = generateReactiveUpdates(urlState.code, newSeed);
      if (updates.length > 0 && previewRef.current) {
        // Send reactive updates to iframe via postMessage
        for (const update of updates) {
          previewRef.current.updateAttribute(
            update.selector,
            update.attribute,
            update.value,
          );
        }
        // Update code in editor (but NOT stableCode - iframe updates via postMessage)
        const result = applyRandomData(urlState.code, newSeed);
        onUrlStateChange({
          ...urlState,
          code: result.html,
          seed: newSeed,
        });
      }
      return;
    }

    // Preset path - use preset-specific randomization
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
    }
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

        {/* CDN source selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            CDN
          </span>
          <CdnSourcePicker
            onChange={handleCdnSourceChange}
            value={urlState.cdnSource}
          />
        </div>

        {/* Reroll button - show when preset selected OR custom code has randomizable charts */}
        {(urlState.presetId || canRandomize(urlState.code)) && (
          <RerollButton onClick={handleReroll} />
        )}

        {/* Format toggle - show when preset supports multiple formats */}
        {unifiedPreset && unifiedPreset.formats.length > 1 && (
          <label className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Format
            </span>
            <select
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
              onChange={(e) =>
                handleFormatChange(e.target.value as OutputFormat)
              }
              value={urlState.format}
            >
              <option value="html">HTML</option>
              <option value="jsx">JSX</option>
            </select>
          </label>
        )}

        {/* Smart copy button for JSX mode */}
        {urlState.format === "jsx" && generatedCode && (
          <SmartCopyButton
            copyableCode={generatedCode.copyable}
            displayCode={generatedCode.display}
            showToggle
          />
        )}

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

        {/* CDN URL copy - mobile: button only, desktop: full URL + copy icon */}
        {/* Mobile: Copy button with text */}
        <button
          className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors md:hidden ${
            cdnCopied
              ? "bg-green-600 text-white"
              : "bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
          }`}
          onClick={handleCopyCdnUrl}
          title={cdnUrl}
          type="button"
        >
          <CopyIcon copied={cdnCopied} />
          {cdnCopied ? "Copied!" : "Copy CDN"}
        </button>

        {/* Desktop: Full URL + copy icon */}
        <div className="hidden min-w-0 flex-1 items-center justify-end gap-2 text-xs text-slate-500 dark:text-slate-400 md:flex">
          <code className="truncate rounded bg-slate-100 px-1.5 py-0.5 font-mono dark:bg-slate-700">
            {cdnUrl}
          </code>
          <button
            className={`shrink-0 rounded p-1 transition-colors ${
              cdnCopied
                ? "text-green-600 dark:text-green-400"
                : "text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-300"
            }`}
            onClick={handleCopyCdnUrl}
            title="Copy CDN URL"
            type="button"
          >
            <CopyIcon copied={cdnCopied} />
          </button>
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
            {/* Code editor */}
            <div className="flex-1 overflow-hidden">
              <CodeEditor
                language={urlState.format === "jsx" ? "tsx" : "html"}
                onChange={
                  urlState.format === "html" ? handleCodeChange : undefined
                }
                theme={theme}
                value={displayCode}
              />
            </div>
          </div>
        </ResizablePane>

        {/* Right pane - Preview + Console */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Preview - HTML uses iframe, JSX uses inline React */}
          <div className="flex-1 overflow-hidden">
            {urlState.format === "jsx" && unifiedPreset ? (
              <ReactPreviewPane
                className="h-full overflow-auto"
                preset={unifiedPreset}
                seed={urlState.seed}
              />
            ) : (
              <PreviewPane
                cdnUrl={cdnUrl}
                className="h-full"
                code={stableCode}
                cspMode={urlState.cspMode}
                onConsoleMessage={handleConsoleMessage}
                ref={previewRef}
              />
            )}
          </div>

          {/* Console - only show for HTML mode (JSX has no console capture) */}
          {urlState.format === "html" && (
            <ConsoleOutput
              className="h-32 flex-shrink-0"
              logs={consoleLogs}
              onClear={handleClearConsole}
            />
          )}
        </div>
      </div>
    </div>
  );
}
