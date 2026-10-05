import { useLayoutEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { ZOOM_MAX, ZOOM_MIN, ZOOM_STEP, loadZoom, saveZoom } from '../lib/prefs';
import { clamp } from '../lib/util';

export type Zoom = {
  zoom: number;
  zoomRef: RefObject<number>; // current zoom for event handlers that outlive a render
  scrollRef: RefObject<HTMLDivElement | null>; // the timeline's horizontal scroller
  zoomTo: (next: number, anchorX?: number) => void;
  stepTo: (next: number) => void;
};

// Timeline zoom. Zooming keeps one spot of the timeline fixed on screen: the pointer when given, otherwise
// the centre of the viewport.
export function useZoom(): Zoom {
  const [zoom, setZoom] = useState(loadZoom);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Captured before a zoom: `frac` is the anchored spot as a fraction of the timeline, `offset` its distance
  // from the scroller's left edge.
  const anchor = useRef<{ frac: number; offset: number } | null>(null);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  // anchorX is a clientX to zoom around; without it the viewport centre stays put.
  function zoomTo(next: number, anchorX?: number) {
    const el = scrollRef.current;
    if (el) {
      const offset = anchorX === undefined ? el.clientWidth / 2 : anchorX - el.getBoundingClientRect().left;
      anchor.current = { frac: (el.scrollLeft + offset) / el.scrollWidth, offset };
    }
    setZoom(clamp(next, ZOOM_MIN, ZOOM_MAX));
  }
  // Buttons and the slider move in whole steps; pinching is continuous.
  const stepTo = (next: number) => zoomTo(Math.round(next / ZOOM_STEP) * ZOOM_STEP);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el && anchor.current) el.scrollLeft = anchor.current.frac * el.scrollWidth - anchor.current.offset;
    anchor.current = null;
    saveZoom(zoom);
  }, [zoom]);

  return { zoom, zoomRef, scrollRef, zoomTo, stepTo };
}
