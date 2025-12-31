import { useEffect, useState } from "react";
import {
  CDN_SOURCE_DESCRIPTIONS,
  CDN_SOURCE_LABELS,
  type CdnSource,
  type CdnSourceType,
  getCdnUrl,
} from "./cdnSources";

export type CdnSourcePickerProps = {
  value: CdnSource;
  onChange: (source: CdnSource) => void;
  className?: string;
};

const SOURCE_TYPES: CdnSourceType[] = [
  "cdn-dev",
  "local",
  "jsdelivr",
  "unpkg",
  "esm-sh",
  "esm-sh-gh",
  "custom",
];

/**
 * CDN source selector with support for preset sources and custom URLs.
 */
export function CdnSourcePicker({
  value,
  onChange,
  className = "",
}: CdnSourcePickerProps) {
  const [customUrl, setCustomUrl] = useState(
    value.type === "custom" ? value.url : "",
  );

  // Sync custom URL from external value changes
  useEffect(() => {
    if (value.type === "custom") {
      setCustomUrl(value.url);
    }
  }, [value]);

  const handleTypeChange = (type: CdnSourceType) => {
    if (type === "custom") {
      onChange({ type: "custom", url: customUrl || "" });
    } else {
      onChange({ type });
    }
  };

  const handleCustomUrlChange = (url: string) => {
    setCustomUrl(url);
    if (value.type === "custom") {
      onChange({ type: "custom", url });
    }
  };

  const resolvedUrl = getCdnUrl(value);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Source type selector */}
      <div className="flex flex-wrap gap-1">
        {SOURCE_TYPES.map((type) => (
          <button
            className={`
              rounded-md px-2.5 py-1 text-xs font-medium transition-colors
              ${
                value.type === type
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              }
            `}
            key={type}
            onClick={() => handleTypeChange(type)}
            title={CDN_SOURCE_DESCRIPTIONS[type]}
            type="button"
          >
            {CDN_SOURCE_LABELS[type]}
          </button>
        ))}
      </div>

      {/* Custom URL input */}
      {value.type === "custom" && (
        <input
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          onChange={(e) => handleCustomUrlChange(e.target.value)}
          placeholder="https://example.com/microviz.js"
          type="url"
          value={customUrl}
        />
      )}

      {/* Resolved URL display */}
      <div className="rounded-md bg-slate-100 px-3 py-2 dark:bg-slate-800">
        <div className="text-[10px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
          Resolved URL
        </div>
        <div className="mt-0.5 break-all font-mono text-xs text-slate-600 dark:text-slate-300">
          {resolvedUrl || <span className="italic text-slate-400">No URL</span>}
        </div>
      </div>
    </div>
  );
}
