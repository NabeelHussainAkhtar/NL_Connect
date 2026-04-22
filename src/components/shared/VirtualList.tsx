import { useState, useEffect, useRef, ReactNode, CSSProperties } from 'react';

type VirtualListProps = {
  items: ReactNode[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
};

export default function VirtualList({
  items,
  itemHeight,
  containerHeight,
  overscan = 5,
}: VirtualListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [visibleItems, setVisibleItems] = useState<{
    index: number;
    style: CSSProperties;
  }[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollTop(container.scrollTop);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const startIndex = Math.max(
      0,
      Math.floor(scrollTop / itemHeight) - overscan
    );

    const endIndex = Math.min(
      items.length - 1,
      Math.floor((scrollTop + containerHeight) / itemHeight) + overscan
    );

    const newVisibleItems = [];
    for (let i = startIndex; i <= endIndex; i++) {
      newVisibleItems.push({
        index: i,
        style: {
          position: 'absolute',
          top: i * itemHeight,
          width: '100%',
          height: itemHeight,
        },
      });
    }

    setVisibleItems(newVisibleItems as { index: number; style: CSSProperties; }[]);
  }, [scrollTop, items, itemHeight, containerHeight, overscan]);

  return (
    <div
      ref={containerRef}
      style={{
        height: containerHeight,
        overflowY: 'auto',
        position: 'relative',
      }}
    >
      <div style={{
        height: items.length * itemHeight,
        position: 'relative',
      }}>
        {visibleItems.map(({ index, style }) => (
          <div key={index} style={style}>
            {items[index]}
          </div>
        ))}
      </div>
    </div>
  );
}
