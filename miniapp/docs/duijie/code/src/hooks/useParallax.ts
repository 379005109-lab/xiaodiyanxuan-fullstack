import { useEffect, useRef, useState } from 'react';

interface UseParallaxOptions {
  speed?: number;
  maxOffset?: number;
  disabled?: boolean;
}

export const useParallax = (options: UseParallaxOptions = {}) => {
  const { speed = 0.3, maxOffset = 6, disabled = false } = options;
  const ref = useRef<HTMLElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (disabled) return;

    const element = ref.current;
    if (!element) return;

    const handleScroll = () => {
      const rect = element.getBoundingClientRect();
      const elementCenter = rect.top + rect.height / 2;
      const viewportCenter = window.innerHeight / 2;
      const distance = elementCenter - viewportCenter;
      
      const calculatedOffset = Math.max(
        -maxOffset,
        Math.min(maxOffset, distance * speed)
      );
      
      setOffset(calculatedOffset);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [speed, maxOffset, disabled]);

  const parallaxStyle = {
    transform: `translateY(${offset}px)`,
    transition: 'transform 0.1s ease-out',
  };

  return { ref, parallaxStyle, offset };
};
