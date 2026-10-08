import { useEffect, useState } from 'react';

// True once the element has come within `margin` of the viewport, and stays true. For loading heavy things
// (the map) only when someone scrolls towards them. Pass the returned callback as the element's ref; the
// element may mount later than the component.
export function useNearView(margin = '600px'): [(el: Element | null) => void, boolean] {
  const [el, setEl] = useState<Element | null>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    if (near || !el) return;
    if (typeof IntersectionObserver !== 'function') return setNear(true);
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) setNear(true);
    }, { rootMargin: margin });
    observer.observe(el);
    return () => observer.disconnect();
  }, [el, margin, near]);
  return [setEl, near];
}
