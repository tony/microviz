/**
 * Smart copy button for the playground.
 * Shows compact code by default, expands with imports on copy.
 */

import { useCallback, useState } from "react";

export type SmartCopyButtonProps = {
  /** Compact display code (shown in editor) */
  displayCode: string;
  /** Full code with imports (copied to clipboard) */
  copyableCode: string;
  /** Show toggle button when display differs from copyable */
  showToggle?: boolean;
};

export function SmartCopyButton({
  displayCode,
  copyableCode,
  showToggle = true,
}: SmartCopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showFull, setShowFull] = useState(false);

  const hasDifference = displayCode !== copyableCode;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(copyableCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [copyableCode]);

  const handleToggle = useCallback(() => {
    setShowFull((prev) => !prev);
  }, []);

  return (
    <div className="flex items-center gap-2">
      {/* Toggle button - only show when codes differ */}
      {showToggle && hasDifference && (
        <button
          className="rounded px-2 py-1 text-xs text-slate-500 transition-colors hover:bg-slate-700 hover:text-slate-300"
          onClick={handleToggle}
          title={showFull ? "Show compact view" : "Show with imports"}
          type="button"
        >
          {showFull ? "Compact" : "+ Imports"}
        </button>
      )}

      {/* Copy button */}
      <button
        className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
          copied
            ? "bg-green-600 text-white"
            : "bg-indigo-600 text-white hover:bg-indigo-700"
        }`}
        onClick={handleCopy}
        title="Copy to clipboard (with imports)"
        type="button"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}

/**
 * Hook to get the code to display based on toggle state.
 */
export function useSmartCode(
  displayCode: string,
  copyableCode: string,
): {
  currentCode: string;
  showFull: boolean;
  setShowFull: (show: boolean) => void;
} {
  const [showFull, setShowFull] = useState(false);
  const currentCode = showFull ? copyableCode : displayCode;

  return { currentCode, setShowFull, showFull };
}
