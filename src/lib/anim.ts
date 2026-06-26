import { useEffect, useRef, useState } from 'react';

/** Fires when the element scrolls into view. `once` (default) stops observing after. */
export function useInView<T extends HTMLElement>(opts?: {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
}) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  const once = opts?.once ?? true;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const ob = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) ob.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold: opts?.threshold ?? 0.15, rootMargin: opts?.rootMargin ?? '0px 0px -8% 0px' },
    );
    ob.observe(el);
    return () => ob.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ref, inView };
}

/** Eased count-up. Starts when `play` becomes true; respects reduced-motion. */
export function useCountUp(target: number, play: boolean, duration = 900): number {
  const [value, setValue] = useState(0);
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (!play) return;
    if (prefersReduced || typeof requestAnimationFrame === 'undefined') {
      setValue(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const from = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, play, duration, prefersReduced]);

  return value;
}
