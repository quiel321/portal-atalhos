'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

export default function CategoryContent({ id, expanded, children }: { id: string; expanded: boolean; children: ReactNode }) {
  const listRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>();

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const measure = () => setHeight(list.getBoundingClientRect().height);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, []);

  return (
    <div id={id} className="category-content" data-expanded={expanded} style={{ height: expanded ? height ?? 'auto' : 36 }} inert={!expanded} aria-hidden={!expanded}>
      <div ref={listRef} className="shortcut-list">{children}</div>
    </div>
  );
}
