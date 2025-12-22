import type { FC, ReactNode, PointerEvent as ReactPointerEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { resizableEdgeZone, resizablePaneBorder } from "../ui/styles";

type Side = "left" | "right";

type Props = {
  children: ReactNode;
  className?: string;
  collapsible?: boolean;
  contentClassName?: string;
  defaultSize: number;
  forceExpanded?: boolean;
  minSize?: number;
  name: string;
  onCollapsedChange?: (collapsed: boolean) => void;
  side: Side;
};

const COLLAPSED_WIDTH = 40;

function clamp(value: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, value));
}

function readStoredSize(key: string): number | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function storeSize(key: string, value: number): void {
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    // ignore
  }
}

function clearStoredSize(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function readStoredCollapsed(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === "true";
  } catch {
    return false;
  }
}

function storeCollapsed(key: string, value: boolean): void {
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    // ignore
  }
}

// Chevron icons as inline SVGs
const ChevronLeft: FC<{ className?: string }> = ({ className }) => (
  <svg
    aria-hidden="true"
    className={className}
    fill="none"
    height="16"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width="16"
  >
    <path d="m15 18-6-6 6-6" />
  </svg>
);

const ChevronRight: FC<{ className?: string }> = ({ className }) => (
  <svg
    aria-hidden="true"
    className={className}
    fill="none"
    height="16"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width="16"
  >
    <path d="m9 18 6-6-6-6" />
  </svg>
);

export const ResizablePane: FC<Props> = ({
  children,
  className,
  collapsible = false,
  contentClassName,
  defaultSize,
  forceExpanded = false,
  minSize = 180,
  name,
  onCollapsedChange,
  side,
}) => {
  const storageKey = useMemo(() => `mv-pane:${name}:size`, [name]);
  const collapsedKey = useMemo(() => `mv-pane:${name}:collapsed`, [name]);

  const [size, setSize] = useState<number>(() => {
    if (typeof window === "undefined") return defaultSize;
    return readStoredSize(storageKey) ?? defaultSize;
  });

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (!collapsible) return false;
    if (typeof window === "undefined") return false;
    return readStoredCollapsed(collapsedKey);
  });

  const dragRef = useRef<{
    pointerId: number;
    startSize: number;
    startX: number;
  } | null>(null);

  const toggleCollapse = useCallback(() => {
    if (forceExpanded) return;
    const next = !collapsed;
    setCollapsed(next);
    storeCollapsed(collapsedKey, next);
    onCollapsedChange?.(next);
  }, [collapsed, collapsedKey, forceExpanded, onCollapsedChange]);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      const el = event.currentTarget;
      el.setPointerCapture(event.pointerId);
      dragRef.current = {
        pointerId: event.pointerId,
        startSize: size,
        startX: event.clientX,
      };
    },
    [size],
  );

  const onPointerMove = useCallback(
    (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      if (event.pointerId !== drag.pointerId) return;

      const deltaX = event.clientX - drag.startX;
      const next =
        side === "left" ? drag.startSize + deltaX : drag.startSize - deltaX;
      const clamped = clamp(next, minSize, 800);
      setSize(clamped);
      storeSize(storageKey, clamped);
    },
    [minSize, side, storageKey],
  );

  const onPointerUp = useCallback((event: PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    if (event.pointerId !== drag.pointerId) return;
    dragRef.current = null;
  }, []);

  useEffect(() => {
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [onPointerMove, onPointerUp]);

  const onReset = useCallback(() => {
    clearStoredSize(storageKey);
    setSize(defaultSize);
  }, [defaultSize, storageKey]);

  // Collapsed state - show thin bar with expand button
  if (collapsed && !forceExpanded) {
    return (
      <div
        className={`flex h-full flex-shrink-0 flex-col items-center bg-white/90 py-4 dark:bg-slate-950/70 ${resizablePaneBorder({ side })}`}
        style={{ width: COLLAPSED_WIDTH }}
      >
        <button
          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          onClick={toggleCollapse}
          title="Expand"
          type="button"
        >
          {side === "left" ? <ChevronRight /> : <ChevronLeft />}
        </button>
        <div className="mt-3 flex flex-1 items-center">
          <span
            className="text-xs font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500"
            style={{
              textOrientation: "mixed",
              transform: side === "left" ? "rotate(180deg)" : undefined,
              writingMode: "vertical-rl",
            }}
          >
            {name}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${className} transition-[width] duration-150 ease-out`}
      style={{
        flexShrink: 0,
        width: size,
      }}
    >
      <div className="relative h-full w-full">
        <div
          className={
            contentClassName ??
            "h-full w-full overflow-auto [scrollbar-gutter:stable]"
          }
        >
          {children}
        </div>

        {/* Edge interaction zone - contains drag handle and collapse button */}
        <div className={resizableEdgeZone({ side })} style={{ width: 12 }}>
          {/* Drag handle */}
          <div
            aria-hidden="true"
            className="absolute inset-0 cursor-col-resize bg-transparent transition-colors group-hover:bg-slate-200/60 active:bg-slate-300/70 dark:group-hover:bg-slate-800/60 dark:active:bg-slate-700/70"
            onDoubleClick={onReset}
            onPointerDown={onPointerDown}
            title="Resize (dbl-click reset)"
          />

          {/* Collapse button - appears on hover */}
          {collapsible && !forceExpanded && (
            <button
              className="absolute left-1/2 top-4 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 opacity-0 shadow-sm transition-all duration-150 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-700 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1 group-hover:opacity-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
              onClick={toggleCollapse}
              title="Collapse"
              type="button"
            >
              {side === "left" ? <ChevronLeft /> : <ChevronRight />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
