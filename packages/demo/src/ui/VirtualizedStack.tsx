import { useVirtualizer } from "@tanstack/react-virtual";
import {
  type FC,
  type ReactNode,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type VirtualBlock = {
  key: string;
  node: ReactNode;
  estimateSize?: number;
};

export const VirtualizedStack: FC<{
  blocks: readonly VirtualBlock[];
  estimateSize?: number;
  getScrollElement?: () => HTMLElement | null;
  overscan?: number;
}> = ({ blocks, estimateSize = 420, getScrollElement, overscan = 4 }) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [scrollMargin, setScrollMargin] = useState(0);

  const scrollElement = getScrollElement?.() ?? null;

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    if (!scrollElement || !wrapper) return;

    const margin =
      wrapper.getBoundingClientRect().top -
      scrollElement.getBoundingClientRect().top +
      scrollElement.scrollTop;

    setScrollMargin(margin);
  }, [scrollElement]);

  const virtualizer = useVirtualizer({
    count: blocks.length,
    enabled: Boolean(scrollElement),
    estimateSize: (index) => blocks[index]?.estimateSize ?? estimateSize,
    getScrollElement: () => scrollElement,
    overscan,
    scrollMargin,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const [paddingTop, paddingBottom] = useMemo(() => {
    if (virtualItems.length === 0) return [0, 0];
    const first = virtualItems[0];
    const last = virtualItems[virtualItems.length - 1];
    const margin = virtualizer.options.scrollMargin;
    const start = first.start - margin;
    const end = last.end - margin;
    return [start, virtualizer.getTotalSize() - end];
  }, [virtualItems, virtualizer]);

  if (!scrollElement) {
    return (
      <div ref={wrapperRef}>
        {blocks.map((block) => (
          <div key={block.key}>{block.node}</div>
        ))}
      </div>
    );
  }

  return (
    <div ref={wrapperRef} style={{ paddingBottom, paddingTop }}>
      {virtualItems.map((item) => {
        const block = blocks[item.index];
        if (!block) return null;

        return (
          <div
            data-index={item.index}
            key={block.key}
            ref={virtualizer.measureElement}
          >
            {block.node}
          </div>
        );
      })}
    </div>
  );
};
