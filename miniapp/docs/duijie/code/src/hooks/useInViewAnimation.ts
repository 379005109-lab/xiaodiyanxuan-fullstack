import { useEffect, useRef, useState } from 'react';

interface UseInViewAnimationOptions {
  threshold?: number;
  delay?: number;
  staggerDelay?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export const useInViewAnimation = (options: UseInViewAnimationOptions = {}) => {
  const {
    threshold = 0.1,
    delay = 0,
    staggerDelay = 0,
    rootMargin = '0px',
    triggerOnce = true,
  } = options;

  const ref = useRef<HTMLElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (triggerOnce && hasAnimated) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            setIsInView(true);
            if (triggerOnce) {
              setHasAnimated(true);
            }
          }, delay + staggerDelay);
        } else if (!triggerOnce) {
          setIsInView(false);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, delay, staggerDelay, rootMargin, triggerOnce, hasAnimated]);

  return { ref, isInView };
};

export const useStaggeredInView = (count: number, options: UseInViewAnimationOptions = {}) => {
  const { staggerDelay = 60 } = options;
  const refs = useRef<(HTMLElement | null)[]>([]);
  const [inViewStates, setInViewStates] = useState<boolean[]>(new Array(count).fill(false));
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (hasAnimated && options.triggerOnce !== false) return;

    const observers = refs.current.map((element, index) => {
      if (!element) return null;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              setInViewStates((prev) => {
                const newStates = [...prev];
                newStates[index] = true;
                return newStates;
              });
              if (index === count - 1) {
                setHasAnimated(true);
              }
            }, (options.delay || 0) + index * staggerDelay);
          }
        },
        {
          threshold: options.threshold || 0.1,
          rootMargin: options.rootMargin || '0px',
        }
      );

      observer.observe(element);
      return observer;
    });

    return () => {
      observers.forEach((observer) => observer?.disconnect());
    };
  }, [count, staggerDelay, options.delay, options.threshold, options.rootMargin, hasAnimated, options.triggerOnce]);

  const setRef = (index: number) => (el: HTMLElement | null) => {
    refs.current[index] = el;
  };

  return { setRef, inViewStates };
};
