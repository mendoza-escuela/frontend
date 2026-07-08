import type { HTMLAttributes, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

type RevealProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  delay?: 'none' | 'short' | 'medium' | 'long';
};

const delayClasses = {
  none: 'delay-0',
  short: 'delay-100',
  medium: 'delay-200',
  long: 'delay-300',
};

export function Reveal({
  children,
  className = '',
  delay = 'none',
  ...props
}: RevealProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = containerRef.current;

    if (!element) {
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        rootMargin: '0px 0px -12% 0px',
        threshold: 0.15,
      },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={`transition duration-700 ease-out ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      } ${delayClasses[delay]} ${className}`}
      ref={containerRef}
      {...props}
    >
      {children}
    </div>
  );
}
