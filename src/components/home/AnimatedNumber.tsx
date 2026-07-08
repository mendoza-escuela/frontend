import { useEffect, useState } from 'react';

type AnimatedNumberProps = {
  durationMs?: number;
  value: number;
};

export function AnimatedNumber({ durationMs = 900, value }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    if (prefersReducedMotion) {
      setDisplayValue(value);
      return;
    }

    let animationFrameId = 0;
    const startedAt = performance.now();

    const updateValue = (currentTime: number) => {
      const progress = Math.min((currentTime - startedAt) / durationMs, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      setDisplayValue(Math.round(easedProgress * value));

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(updateValue);
      }
    };

    animationFrameId = window.requestAnimationFrame(updateValue);

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [durationMs, value]);

  return <>{displayValue}</>;
}
