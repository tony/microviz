import type { FC, ReactNode, PointerEvent as ReactPointerEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { resizableEdgeZone } from "../ui/styles";

type Side = "left" | "right";

type Props = {
  children: ReactNode;
  className?: string;
  collapsed?: boolean;
  collapsible?: boolean;
  contentClassName?: string;
  defaultSize: number;
  forceExpanded?: boolean;
  minSize?: number;
  name: string;
  onCollapsedChange?: (collapsed: boolean) => void;
  persistCollapsed?: boolean;
  side: Side;
};

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

export const ResizablePane: FC<Props> = ({
  children,
  className,
  collapsed: collapsedProp,
  collapsible = false,
  contentClassName,
  defaultSize,
  forceExpanded = false,
  minSize = 180,
  name,
  onCollapsedChange: _onCollapsedChange,
  persistCollapsed = true,
  side,
}) => {
  const storageKey = useMemo(() => `mv-pane:${name}:size`, [name]);
  const collapsedKey = useMemo(() => `mv-pane:${name}:collapsed`, [name]);

  const [size, setSize] = useState<number>(() => {
    if (typeof window === "undefined") return defaultSize;
    return readStoredSize(storageKey) ?? defaultSize;
  });

  const [collapsedState, _setCollapsedState] = useState<boolean>(() => {
    if (!collapsible) return false;
    if (typeof window === "undefined") return false;
    if (!persistCollapsed) return false;
    return readStoredCollapsed(collapsedKey);
  });
  const collapsed = collapsedProp ?? collapsedState;

  const dragRef = useRef<{
    pointerId: number;
    startSize: number;
    startX: number;
  } | null>(null);

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

  // Zero-width collapse - floating expand button handled by parent
  if (collapsed && !forceExpanded) {
    return null;
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

        {/* Edge interaction zone - drag handle for resizing */}
        <div className={resizableEdgeZone({ side })} style={{ width: 12 }}>
          <div
            aria-hidden="true"
            className="absolute inset-0 cursor-col-resize bg-transparent transition-colors group-hover:bg-slate-200/60 active:bg-slate-300/70 dark:group-hover:bg-slate-800/60 dark:active:bg-slate-700/70"
            onDoubleClick={onReset}
            onPointerDown={onPointerDown}
            title="Resize (dbl-click reset)"
          />
        </div>
      </div>
    </div>
  );
};
