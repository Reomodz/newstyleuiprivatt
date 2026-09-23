import React, { useState, useEffect, useRef, useMemo, ReactNode } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

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
  overscan = 25, // Generous overscan buffer for instant high-speed scrolling
  scrollContainerRef,
  emptyMessage,
  className = '',
}: VirtualScrollListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollEl, setScrollEl] = useState<HTMLElement | null>(null);
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

  // Keep scroll container element synced for TanStack Virtualizer
  useEffect(() => {
    const el = scrollContainerRef?.current || containerRef.current?.parentElement || null;
    if (el !== scrollEl) {
      setScrollEl(el);
    }
  }, [scrollContainerRef, scrollEl]);

  // Monitor container size for responsive columns
  useEffect(() => {
    const target = scrollEl || scrollContainerRef?.current || containerRef.current?.parentElement || containerRef.current;
    if (!target) return;

    const updateDimensions = () => {
      if (target) {
        setContainerWidth(target.clientWidth || window.innerWidth);
      }
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });

    resizeObserver.observe(target);
    return () => resizeObserver.disconnect();
  }, [scrollEl, scrollContainerRef]);

  const totalCount = items.length;
  const totalRows = Math.ceil(totalCount / currentColumns);

  // 📜 High-Performance Virtualizer (O(1) deterministic math, zero DOM layout reflows)
  const rowVirtualizer = useVirtualizer({
    count: totalRows,
    getScrollElement: () => scrollEl || scrollContainerRef?.current || containerRef.current?.parentElement || null,
    estimateSize: () => estimatedItemHeight,
    overscan: overscan ?? 25,
  });

  if (totalCount === 0 && emptyMessage) {
    return <>{emptyMessage}</>;
  }

  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <div
      ref={containerRef}
      className={`w-full relative ${className}`}
      style={{
        height: `${rowVirtualizer.getTotalSize()}px`,
        width: '100%',
        position: 'relative',
      }}
    >
      {virtualItems.map((virtualRow) => {
        const startIdx = virtualRow.index * currentColumns;
        const endIdx = Math.min(totalCount, startIdx + currentColumns);
        const rowItems = items.slice(startIdx, endIdx);

        return (
          <div
            key={virtualRow.key}
            data-index={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualRow.start}px)`,
              willChange: 'transform',
            }}
            className="w-full min-w-0"
          >
            <div className={`w-full min-w-0 ${gridClassName}`}>
              {rowItems.map((item, relIndex) => {
                const absoluteIndex = startIdx + relIndex;
                return (
                  <React.Fragment key={absoluteIndex}>
                    {renderItem(item, absoluteIndex)}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
