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
  gap = 8,
  overscan = 12,
  scrollContainerRef,
  emptyMessage,
  className = '',
}: VirtualScrollListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerOffsetTop, setContainerOffsetTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(600);
  const [containerWidth, setContainerWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 360
  );

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

  // Monitor container size and calculate offset relative to scroll container
  useEffect(() => {
    const scrollTarget = scrollContainerRef?.current || containerRef.current?.parentElement || containerRef.current;
    if (!scrollTarget) return;

    const updateDimensions = () => {
      setViewportHeight(scrollTarget.clientHeight || window.innerHeight);
      setContainerWidth(scrollTarget.clientWidth || window.innerWidth);

      if (containerRef.current && scrollTarget) {
        let offset = 0;
        let el: HTMLElement | null = containerRef.current;
        while (el && el !== scrollTarget) {
          offset += el.offsetTop || 0;
          el = el.offsetParent as HTMLElement | null;
        }
        setContainerOffsetTop(offset);
      }
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });

    resizeObserver.observe(scrollTarget);
    if (containerRef.current?.parentElement) {
      resizeObserver.observe(containerRef.current.parentElement);
    }

    return () => resizeObserver.disconnect();
  }, [scrollContainerRef, items.length]);

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
  const { visibleItems, startIndex, topPadding, totalHeight } = useMemo(() => {
    if (totalCount === 0) {
      return { visibleItems: [], startIndex: 0, topPadding: 0, totalHeight: 0 };
    }

    const rowHeight = Math.max(20, estimatedItemHeight + (gap || 0));
    const totalRows = Math.ceil(totalCount / currentColumns);

    // Calculate effective scroll position relative to where this virtual list begins
    const effectiveScrollTop = Math.max(0, scrollTop - containerOffsetTop);

    // Calculate start and end rows with overscan buffers
    const startRow = Math.max(0, Math.floor(effectiveScrollTop / rowHeight) - overscan);
    const endRow = Math.min(
      totalRows,
      Math.ceil((effectiveScrollTop + viewportHeight) / rowHeight) + overscan
    );

    const startIdx = startRow * currentColumns;
    const endIdx = Math.min(totalCount, endRow * currentColumns);

    const topPad = startRow * rowHeight;
    const totHeight = totalRows * rowHeight;

    return {
      visibleItems: items.slice(startIdx, endIdx),
      startIndex: startIdx,
      topPadding: topPad,
      totalHeight: totHeight,
    };
  }, [items, totalCount, currentColumns, scrollTop, containerOffsetTop, viewportHeight, estimatedItemHeight, gap, overscan]);

  if (totalCount === 0 && emptyMessage) {
    return <>{emptyMessage}</>;
  }

  return (
    <div ref={containerRef} className={`w-full relative ${className}`} style={{ minHeight: `${totalHeight}px` }}>
      <div style={{ transform: `translateY(${topPadding}px)`, width: '100%', willChange: 'transform' }} className="w-full min-w-0">
        <div className={`w-full min-w-0 ${gridClassName}`}>
          {visibleItems.map((item, relIndex) => {
            const absoluteIndex = startIndex + relIndex;
            return (
              <React.Fragment key={absoluteIndex}>
                {renderItem(item, absoluteIndex)}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
