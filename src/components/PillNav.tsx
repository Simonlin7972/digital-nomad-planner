import { useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocale } from '../lib/i18n';
import { useScrolled } from '../hooks/useScrolled';
import './PillNav.css';

type Props = {
  className: string; // the page's own class for the bar; the slot around it gets `<className>-slot`
  off?: boolean; // plain static header, no sticking and no pill (the planner on a phone)
  children: ReactNode;
};

// A page header that sticks to the top and folds into a frosted pill once the page scrolls. The bar sits absolutely
// inside a sticky slot that keeps the bar's full height (measured here, again on resize, language and font load),
// so the page under it never moves as the bar shrinks. The page's stylesheet sets the bar's resting padding and
// contents; PillNav.css has the sticking, the pill and the transitions.
export function PillNav({ className, off = false, children }: Props) {
  const locale = useLocale();
  const pill = useScrolled(24) && !off;
  const ref = useRef<HTMLElement>(null);
  const [height, setHeight] = useState<number>();
  useLayoutEffect(() => {
    if (off) return;
    let timer = 0;
    const measure = () => {
      // Only at full size: mid-transition sizes would make the page jump
      if (ref.current && !ref.current.classList.contains('pill')) setHeight(ref.current.offsetHeight);
    };
    measure();
    void document.fonts?.ready.then(measure);
    const onResize = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(measure, 100);
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', onResize);
    };
    // The title's width changes with the language, and so may the bar's wrapping.
  }, [off, locale]);
  return (
    <div className={`pillnav-slot ${className}-slot${off ? ' off' : ''}`} style={off ? undefined : { height }}>
      <header ref={ref} className={`pillnav ${className}${pill ? ' pill' : ''}`}>
        {children}
      </header>
    </div>
  );
}
