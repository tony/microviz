import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { tabButton, tabContainer } from "./styles";

export type NavTabOption = {
  id: string;
  label: ReactNode;
  to: string;
  title?: string;
};

type NavTabToggleProps = {
  /** Accessible label for the navigation */
  label: string;
  /** Navigation options to display */
  options: readonly NavTabOption[];
  /** Container style variant */
  container?: "filled" | "bordered" | "ribbon";
  /** Link active style variant */
  variant?: "default" | "muted";
  /** Link size */
  size?: "xs" | "sm" | "md" | "ribbon";
  /** Additional className for container */
  className?: string;
};

/**
 * Navigation tabs using TanStack Router's Link component.
 *
 * Unlike TabToggle (which uses buttons), this component renders actual `<a>`
 * elements, enabling Ctrl/Cmd+click to open in new tabs and proper browser
 * navigation behavior.
 */
export function NavTabToggle({
  className,
  container = "filled",
  label,
  options,
  size = "xs",
  variant = "default",
}: NavTabToggleProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const isActive = (to: string): boolean => {
    if (to === "/") return pathname === "/";
    return pathname.startsWith(to);
  };

  return (
    <nav aria-label={label} className={tabContainer({ className, container })}>
      {options.map((option) => {
        const active = isActive(option.to);
        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={tabButton({
              active,
              className: "active:scale-[0.98]",
              size,
              variant,
            })}
            key={option.id}
            preload="intent"
            title={
              option.title ??
              (typeof option.label === "string" ? option.label : undefined)
            }
            to={option.to}
          >
            {option.label}
          </Link>
        );
      })}
    </nav>
  );
}
