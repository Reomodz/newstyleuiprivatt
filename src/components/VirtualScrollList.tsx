import React, { useState, useEffect, useRef, useMemo, ReactNode } from 'react';

interface VirtualScrollListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  estimatedItemHeight?: number;
  columns?: number | { sm?: number; md?: number; lg?: number; xl?: number };
  gridClassName?: string;
  gap?: number;
  overscan?: number;
  scrollContainerRef?: React.RefObject<HTMLElement | null>;
  emptyMessage?: ReactNode;
  className?: string;
}

export function VirtualScrollList<T>({
  items,
  renderItem,
  estimatedItemHeight = 72,
  columns = 1,
  gridClassName = '',
  overscan = 4,
  scrollContainerRef,
  emptyMessage,
  className = '',
}: VirtualScrollListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(600);
  const [containerWidth, setContainerWidth] = useState(1024);

  // Determine effective column count based on container width if responsive object passed
  const currentColumns = useMemo(() => {
    if (typeof columns === 'number') {
      return Math.max(1, columns);
    }
    const width = containerWidth;
    if (width >= 1280 && columns.xl) return columns.xl;
    if (width >= 1024 && columns.lg) return columns.lg;
    if (width >= 768 && columns.md) return columns.md;
    if (width >= 640 && columns.sm) return columns.sm;
    return 1;
  }, [columns, containerWidth]);

  // Monitor container size
  useEffect(() => {
    const target = scrollContainerRef?.current || containerRef.current?.parentElement || containerRef.current;
    if (!target) return;

    const updateDimensions = () => {
      if (target) {
        setViewportHeight(target.clientHeight || window.innerHeight);
        setContainerWidth(target.clientWidth || window.innerWidth);
      }
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });

    resizeObserver.observe(target);
    return () => resizeObserver.disconnect();
  }, [scrollContainerRef]);

  // Monitor scroll position of target container
  useEffect(() => {
    const scrollTarget = scrollContainerRef?.current || containerRef.current?.parentElement;
    if (!scrollTarget) return;

    let rafId: number | null = null;
    const handleScroll = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setScrollTop(scrollTarget.scrollTop);
      });
    };

    scrollTarget.addEventListener('scroll', handleScroll, { passive: true });
    // Initial read
    setScrollTop(scrollTarget.scrollTop);

    return () => {
      scrollTarget.removeEventListener('scroll', handleScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [scrollContainerRef]);

  const totalCount = items.length;

  // Calculate row virtualization
  const { visibleItems, startIndex, topPadding, bottomPadding } = useMemo(() => {
    if (totalCount === 0) {
      return { visibleItems: [], startIndex: 0, topPadding: 0, bottomPadding: 0 };
    }

    const rowHeight = estimatedItemHeight;
    const totalRows = Math.ceil(totalCount / currentColumns);

    // Calculate start and end rows with overscan buffers
    const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    const endRow = Math.min(
      totalRows,
      Math.ceil((scrollTop + viewportHeight) / rowHeight) + overscan
    );

    const startIdx = startRow * currentColumns;
    const endIdx = Math.min(totalCount, endRow * currentColumns);

    const topPad = startRow * rowHeight;
    const bottomPad = Math.max(0, (totalRows - endRow) * rowHeight);

    return {
      visibleItems: items.slice(startIdx, endIdx),
      startIndex: startIdx,
      topPadding: topPad,
      bottomPadding: bottomPad,
    };
  }, [items, totalCount, currentColumns, scrollTop, viewportHeight, estimatedItemHeight, overscan]);

  if (totalCount === 0 && emptyMessage) {
    return <>{emptyMessage}</>;
  }

  return (
    <div ref={containerRef} className={`w-full ${className}`}>
      <div style={{ height: `${topPadding}px` }} aria-hidden="true" />
      <div className={gridClassName}>
        {visibleItems.map((item, relIndex) => {
          const absoluteIndex = startIndex + relIndex;
          return (
            <React.Fragment key={absoluteIndex}>
              {renderItem(item, absoluteIndex)}
            </React.Fragment>
          );
        })}
      </div>
      <div style={{ height: `${bottomPadding}px` }} aria-hidden="true" />
    </div>
  );
}
