import { useEffect, useRef, useState } from 'react';

// Whether the page is scrolled past `offset` (a number, or a function measured on every scroll so it can follow a
// header's current height). The landing nav folds into its pill shape once it is; the planner shows its pill bar.
export function useScrolled(offset: number | (() => number) = 24) {
  const [scrolled, setScrolled] = useState(false);
  const latest = useRef(offset);
  latest.current = offset;
  useEffect(() => {
    const onScroll = () => {
      const o = latest.current;
      setScrolled(window.scrollY > (typeof o === 'function' ? o() : o));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return scrolled;
}
