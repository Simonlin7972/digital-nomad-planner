import { useEffect } from 'react';

// While a dialog is mounted, the page behind it must not scroll. Padding stands in for the scrollbar so
// nothing shifts sideways.
export function useScrollLock() {
  useEffect(() => {
    const { style } = document.body;
    const prev = { overflow: style.overflow, paddingRight: style.paddingRight };
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    style.overflow = 'hidden';
    if (scrollbar > 0) style.paddingRight = `${scrollbar}px`;
    return () => {
      style.overflow = prev.overflow;
      style.paddingRight = prev.paddingRight;
    };
  }, []);
}
