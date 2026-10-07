import { useEffect, useRef, useState } from 'react';

export const prefersStill = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

// Whether the element is on screen. With `once`, it stays true after the first time.
export function useInView<T extends Element>(threshold = 0.3, once = false) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) io.disconnect();
        } else if (!once) setInView(false);
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, once]);
  return [ref, inView] as const;
}

// A looping demo script: holds each step for its duration, then moves on, while `active`. Paused off screen, and
// parked on the last step (the finished state) with reduced motion.
export function useSteps(durations: number[], active: boolean) {
  const still = prefersStill();
  const [step, setStep] = useState(still ? durations.length - 1 : 0);
  useEffect(() => {
    if (still || !active) return;
    const id = window.setTimeout(() => setStep((s) => (s + 1) % durations.length), durations[step]);
    return () => window.clearTimeout(id);
    // The durations are fixed per demo.
  }, [step, active, still]);
  return step;
}

// Counts from 0 up to `target` once `active` turns on.
export function useCountUp(target: number, active: boolean, ms = 1400) {
  const still = prefersStill();
  const [value, setValue] = useState(still ? target : 0);
  useEffect(() => {
    if (still || !active) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / ms);
      setValue(Math.round(target * (1 - (1 - p) ** 3)));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, active, ms, still]);
  return value;
}
