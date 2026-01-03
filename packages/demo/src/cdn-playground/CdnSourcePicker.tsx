import { useEffect, useState } from "react";
import {
  CDN_SOURCE_LABELS,
  type CdnSource,
  type CdnSourceType,
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
 * Inline CDN source selector with select dropdown and optional custom URL input.
 * Designed for toolbar placement.
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

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Source type dropdown */}
      <select
        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
        onChange={(e) => handleTypeChange(e.target.value as CdnSourceType)}
        value={value.type}
      >
        {SOURCE_TYPES.map((type) => (
          <option key={type} value={type}>
            {CDN_SOURCE_LABELS[type]}
          </option>
        ))}
      </select>

      {/* Custom URL input - inline when custom selected */}
      {value.type === "custom" && (
        <input
          className="w-48 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
          onChange={(e) => handleCustomUrlChange(e.target.value)}
          placeholder="https://example.com/microviz.js"
          type="url"
          value={customUrl}
        />
      )}
    </div>
  );
}
