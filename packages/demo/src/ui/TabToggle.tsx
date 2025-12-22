import type { ReactNode } from "react";
import { tabButton, tabContainer } from "./styles";

export type TabOption<T extends string> = {
  id: T;
  label: ReactNode;
  title?: string;
  disabled?: boolean;
};

type TabToggleBaseProps<T extends string> = {
  /** Accessible label for the tab group */
  label: string;
  /** Tab options to display */
  options: readonly TabOption<T>[];
  /** Container style variant */
  container?: "filled" | "bordered";
  /** Button active style variant */
  variant?: "default" | "muted";
  /** Button size */
  size?: "xs" | "sm" | "md";
  /** Additional className for container */
  className?: string;
  /** Disable all buttons */
  disabled?: boolean;
};

type TabToggleSingleProps<T extends string> = TabToggleBaseProps<T> & {
  mode?: "single";
  /** Currently selected value */
  value: T;
  /** Callback when selection changes */
  onChange: (value: T) => void;
};

type TabToggleMultiProps<T extends string> = TabToggleBaseProps<T> & {
  mode: "multi";
  /** Currently selected values */
  value: T[];
  /** Callback when selection changes */
  onChange: (value: T[]) => void;
};

export type TabToggleProps<T extends string> =
  | TabToggleSingleProps<T>
  | TabToggleMultiProps<T>;

export function TabToggle<T extends string>(
  props: TabToggleProps<T>,
): ReactNode {
  const {
    className,
    container = "filled",
    disabled,
    label,
    options,
    size = "xs",
    variant = "default",
  } = props;

  const isSingle = props.mode !== "multi";

  const handleClick = (optionId: T) => {
    if (isSingle) {
      (props.onChange as (v: T) => void)(optionId);
    } else {
      const currentValues = props.value as T[];
      const isSelected = currentValues.includes(optionId);
      const newValues = isSelected
        ? currentValues.filter((v) => v !== optionId)
        : [...currentValues, optionId];
      (props.onChange as (v: T[]) => void)(newValues);
    }
  };

  const isSelected = (optionId: T): boolean => {
    if (isSingle) {
      return props.value === optionId;
    }
    return (props.value as T[]).includes(optionId);
  };

  return (
    // biome-ignore lint/a11y/useAriaPropsSupportedByRole: aria-label is valid for both tablist and group roles
    <div
      aria-label={label}
      className={tabContainer({ className, container })}
      role={isSingle ? "tablist" : "group"}
    >
      {options.map((option) => {
        const selected = isSelected(option.id);
        return (
          // biome-ignore lint/a11y/useAriaPropsSupportedByRole: aria-selected is only set when role="tab"
          <button
            aria-pressed={isSingle ? undefined : selected}
            aria-selected={isSingle ? selected : undefined}
            className={tabButton({
              active: selected,
              className: "active:scale-[0.98]",
              size,
              variant,
            })}
            disabled={disabled || option.disabled}
            key={option.id}
            onClick={() => handleClick(option.id)}
            role={isSingle ? "tab" : undefined}
            title={
              option.title ??
              (typeof option.label === "string" ? option.label : undefined)
            }
            type="button"
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
