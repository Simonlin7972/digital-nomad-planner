import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowUp } from '@phosphor-icons/react/dist/csr/ArrowUp';
import { t, useLocale } from '../lib/i18n';
import './AllMonths.css';

export const MONTH_INDEXES = Array.from({ length: 12 }, (_, m) => m);

// Every month of the year stacked for scrolling. Opening it brings the month that was being looked at into view.
// Once scrolled down past the first screen, a round button in the bottom-right corner goes back to the top.
export function AllMonths({ focus, children }: { focus: number; children: ReactNode }) {
  useLocale();
  const ref = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (focus > 0) ref.current?.querySelector(`[data-month="${focus}"]`)?.scrollIntoView({ block: 'start' });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when the stack first appears
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="month-stack" ref={ref}>
      {children}
      {scrolled && (
        <button
          type="button"
          className="to-top"
          aria-label={t('view.toTop')}
          title={t('view.toTop')}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <ArrowUp size={20} weight="bold" />
        </button>
      )}
    </div>
  );
}
