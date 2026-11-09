import React, { useEffect, useRef, useState } from 'react';

// useCountUp ----------------------------------------------------------------
// Animates a numeric value from 0 to `target` when the element enters the
// viewport. Returns the current value, rounded based on `decimals`. Stops
// automatically when reduced motion is preferred.

export function useCountUp(target, { duration = 1500, decimals = 0 } = {}) {
  const ref = useRef(null);
  const [value, setValue] = useState(0);
  const ranRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function start() {
      if (ranRef.current) return;
      ranRef.current = true;

      if (prefersReduced) {
        setValue(target);
        return;
      }

      const startTime = performance.now();
      function tick(now) {
        const t = Math.min(1, (now - startTime) / duration);
        // ease-out cubic for that "settles into place" feel.
        const eased = 1 - Math.pow(1 - t, 3);
        setValue(target * eased);
        if (t < 1) requestAnimationFrame(tick);
        else setValue(target);
      }
      requestAnimationFrame(tick);
    }

    if (typeof IntersectionObserver === 'undefined') {
      start();
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            start();
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  const formatted = value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return { ref, value: formatted };
}
