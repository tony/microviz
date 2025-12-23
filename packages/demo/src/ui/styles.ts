import { cva } from "class-variance-authority";

/**
 * Container for tab toggle groups.
 * Used in: Header navigation, Sidebar tabs, Inspector tabs, Chart filter
 *
 * Variants:
 * - filled: Slate background, no border (header, sidebar)
 * - bordered: White background with border (inspector, filter)
 */
export const tabContainer = cva(
  "inline-flex items-center gap-1 rounded-lg p-1",
  {
    defaultVariants: {
      container: "filled",
    },
    variants: {
      container: {
        bordered:
          "border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900",
        filled: "bg-slate-100 dark:bg-slate-800/50",
      },
    },
  },
);

/**
 * Tab/toggle button used in navigation and filters.
 * Used in: App.tsx, MicrovizPlayground.tsx (sidebar tabs, chart filter, inspector tabs)
 *
 * Variants:
 * - default: white bg when active, transparent when inactive
 * - muted: slate-200 bg when active, transparent when inactive (chart subtype filter)
 * - filled: slate-200 bg when active, slate-100 bg when inactive
 */
export const tabButton = cva("rounded-md font-medium transition", {
  compoundVariants: [
    // Default variant
    {
      active: true,
      className:
        "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white",
      variant: "default",
    },
    {
      active: false,
      className:
        "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200",
      variant: "default",
    },
    // Muted variant (chart subtype filter)
    {
      active: true,
      className:
        "bg-slate-200 text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white",
      variant: "muted",
    },
    {
      active: false,
      className:
        "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
      variant: "muted",
    },
    // Filled variant (inspector tabs)
    {
      active: true,
      className:
        "bg-slate-200 text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white",
      variant: "filled",
    },
    {
      active: false,
      className:
        "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700",
      variant: "filled",
    },
  ],
  defaultVariants: {
    active: false,
    size: "sm",
    variant: "default",
  },
  variants: {
    active: {
      false: "",
      true: "",
    },
    size: {
      md: "px-3 py-1.5 text-sm",
      sm: "px-2.5 py-1 text-xs",
      xs: "px-2 py-1 text-xs",
    },
    variant: {
      default: "",
      filled: "",
      muted: "",
    },
  },
});

/**
 * Grid wrapper for toggle groups.
 */
export const toggleGrid = cva(
  "grid w-full gap-1 rounded-xl border border-slate-200 bg-slate-100/50 p-1 dark:border-slate-700 dark:bg-slate-800/50",
  {
    defaultVariants: {
      columns: 2,
      disabled: false,
    },
    variants: {
      columns: {
        2: "grid-cols-2",
        3: "grid-cols-3",
        4: "grid-cols-4",
      },
      disabled: {
        false: "",
        true: "opacity-60",
      },
    },
  },
);

/**
 * Individual button within a toggle group.
 */
export const toggleButton = cva(
  "min-w-0 cursor-pointer truncate rounded-lg px-2 py-1 text-[11px] font-medium leading-tight transition disabled:cursor-not-allowed disabled:hover:bg-transparent",
  {
    defaultVariants: {
      selected: false,
    },
    variants: {
      selected: {
        false:
          "text-slate-600 hover:bg-white hover:shadow-sm dark:text-slate-300 dark:hover:bg-slate-700",
        true: "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white",
      },
    },
  },
);

/**
 * Sidebar navigation item.
 */
export const sidebarItem = cva(
  "w-full truncate rounded-md px-2 py-1 text-left text-xs leading-4 transition",
  {
    defaultVariants: {
      active: false,
    },
    variants: {
      active: {
        false:
          "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
        true: "bg-slate-200 text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white",
      },
    },
  },
);

/**
 * Chart preview card.
 */
export const chartCard = cva(
  "group relative flex flex-col overflow-hidden rounded-xl border px-3 pt-3 pb-5 text-left transition",
  {
    defaultVariants: {
      active: false,
      compact: false,
    },
    variants: {
      active: {
        false:
          "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700",
        true: "border-sky-200/90 bg-gradient-to-b from-white via-white to-slate-50/70 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.16),inset_0_1px_0_rgba(255,255,255,0.75),0_12px_26px_rgba(15,23,42,0.14)] dark:border-sky-500/40 dark:bg-gradient-to-b dark:from-slate-900/80 dark:via-slate-900/65 dark:to-slate-950/90 dark:shadow-[inset_0_0_0_1px_rgba(56,189,248,0.28),inset_0_1px_0_rgba(255,255,255,0.06),0_14px_30px_rgba(2,6,23,0.7)]",
      },
      compact: {
        false: "w-full",
        true: "",
      },
    },
  },
);

/**
 * Status indicator "LED" strip (warnings/success).
 */
export const statusLed = cva(
  "absolute left-0 top-0 h-[3px] w-full rounded-t-xl opacity-90",
  {
    defaultVariants: {
      status: "success",
    },
    variants: {
      status: {
        success: "bg-emerald-500",
        warning: "bg-amber-500",
      },
    },
  },
);

/**
 * ResizablePane border based on side.
 */
export const resizablePaneBorder = cva(
  "border-slate-200 dark:border-slate-800",
  {
    variants: {
      side: {
        left: "border-r",
        right: "border-l",
      },
    },
  },
);

/**
 * ResizablePane edge interaction zone positioning.
 */
export const resizableEdgeZone = cva("group absolute top-0 h-full", {
  variants: {
    side: {
      left: "right-0",
      right: "left-0",
    },
  },
});

/**
 * Form input field.
 */
export const inputField = cva(
  "w-full rounded border border-slate-300 bg-white text-sm dark:border-slate-700 dark:bg-slate-950",
  {
    defaultVariants: {
      font: "default",
      size: "sm",
    },
    variants: {
      font: {
        default: "",
        mono: "font-mono",
      },
      size: {
        md: "px-2 py-1.5",
        sm: "px-2 py-1",
      },
    },
  },
);

/**
 * Chart card content wrapper (for centering).
 */
export const chartCardContent = cva("mt-3", {
  defaultVariants: {
    centered: false,
  },
  variants: {
    centered: {
      false: "flex items-start",
      true: "flex items-start justify-center",
    },
  },
});
