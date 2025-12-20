import type { ReactNode } from "react";
import { toggleButton, toggleGrid } from "./styles";

export type ToggleOption<T extends string> = {
  id: T;
  label: string;
  title?: string;
};

export function ToggleGroup<T extends string>({
  columns,
  disabled,
  label,
  onChange,
  options,
  value,
}: {
  columns: 2 | 3 | 4;
  disabled?: boolean;
  label: string;
  onChange: (next: T) => void;
  options: readonly ToggleOption<T>[];
  value: T;
}): ReactNode {
  return (
    <fieldset className="space-y-1" disabled={disabled}>
      <legend className="text-xs text-slate-500 dark:text-slate-400">
        {label}
      </legend>
      <div className={toggleGrid({ columns, disabled })}>
        {options.map((option) => {
          const selected = value === option.id;
          return (
            <button
              aria-pressed={selected}
              className={toggleButton({ selected })}
              key={option.id}
              onClick={() => onChange(option.id)}
              title={option.title ?? option.label}
              type="button"
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
