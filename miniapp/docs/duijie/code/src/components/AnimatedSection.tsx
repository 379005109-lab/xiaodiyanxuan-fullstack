import { ReactNode, ElementType, ComponentPropsWithoutRef } from 'react';
import { useInViewAnimation } from '../hooks/useInViewAnimation';

interface AnimatedSectionProps<T extends ElementType = 'div'> {
  children: ReactNode;
  as?: T;
  className?: string;
  threshold?: number;
  delay?: number;
  staggerDelay?: number;
  triggerOnce?: boolean;
}

export const AnimatedSection = <T extends ElementType = 'div'>({
  children,
  as,
  className = '',
  threshold = 0.1,
  delay = 0,
  staggerDelay = 0,
  triggerOnce = true,
  ...props
}: AnimatedSectionProps<T> & Omit<ComponentPropsWithoutRef<T>, keyof AnimatedSectionProps<T>>) => {
  const Component = as || 'div';
  const { ref, isInView } = useInViewAnimation({
    threshold,
    delay,
    staggerDelay,
    triggerOnce,
  });

  return (
    <Component
      ref={ref}
      className={`transition-opacity duration-400 ${
        isInView
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-5'
      } ${className}`}
      style={{
        transition: 'opacity 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      }}
      {...props}
    >
      {children}
    </Component>
  );
};
