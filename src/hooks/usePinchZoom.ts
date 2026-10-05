import { useEffect } from 'react';
import { ZOOM_MIN } from '../lib/prefs';
import { clamp } from '../lib/util';
import type { Zoom } from './useZoom';

// Pinch to zoom the timeline: trackpads report it as ctrl+wheel (Chrome, Firefox) or gesture events (Safari);
// touch screens as two fingers. All three need non-passive listeners to stop the page itself zooming.
// `onStart` runs when a two-finger touch begins, since the first finger may already have started something.
export function usePinchZoom({ scrollRef, zoomRef, zoomTo }: Zoom, onStart: () => void) {
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      // ctrl is what a trackpad pinch sends; alt is the same zoom for a plain mouse wheel.
      if (!e.ctrlKey && !e.altKey) return;
      e.preventDefault();
      // A mouse wheel notch is far larger than a trackpad pinch step, so cap each event.
      zoomTo(zoomRef.current * Math.exp(-clamp(e.deltaY || e.deltaX, -30, 30) * 0.01), e.clientX);
    };
    let gestureStart = ZOOM_MIN;
    const onGestureStart = (e: Event) => {
      e.preventDefault();
      gestureStart = zoomRef.current;
    };
    const onGestureChange = (e: Event) => {
      e.preventDefault();
      const g = e as Event & { scale: number; clientX: number };
      zoomTo(gestureStart * g.scale, g.clientX);
    };
    let pinch: { dist: number; zoom: number } | null = null;
    const spread = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 2) return;
      pinch = { dist: spread(e.touches), zoom: zoomRef.current };
      onStart();
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!pinch || e.touches.length !== 2) return;
      e.preventDefault();
      zoomTo((pinch.zoom * spread(e.touches)) / pinch.dist, (e.touches[0].clientX + e.touches[1].clientX) / 2);
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) pinch = null;
    };
    const active = { passive: false } as const;
    el.addEventListener('wheel', onWheel, active);
    el.addEventListener('gesturestart', onGestureStart, active);
    el.addEventListener('gesturechange', onGestureChange, active);
    el.addEventListener('touchstart', onTouchStart, active);
    el.addEventListener('touchmove', onTouchMove, active);
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('touchcancel', onTouchEnd);
    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('gesturestart', onGestureStart);
      el.removeEventListener('gesturechange', onGestureChange);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
    // Mounted once per year view: the handlers only touch refs and state setters, which never change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
