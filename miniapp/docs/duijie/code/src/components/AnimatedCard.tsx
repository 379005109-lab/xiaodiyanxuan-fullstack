import { ReactNode, ElementType, ComponentPropsWithoutRef } from 'react';
import { usePressAnimation } from '../hooks/usePressAnimation';

interface AnimatedCardProps<T extends ElementType = 'div'> {
  children: ReactNode;
  as?: T;
  className?: string;
  scale?: number;
  translateY?: number;
  disabled?: boolean;
  withShadow?: boolean;
  withHighlight?: boolean;
  onClick?: () => void;
}

export const AnimatedCard = <T extends ElementType = 'div'>({
  children,
  as,
  className = '',
  scale = 0.97,
  translateY = 1,
  disabled = false,
  withShadow = true,
  withHighlight = false,
  onClick,
  ...props
}: AnimatedCardProps<T> & Omit<ComponentPropsWithoutRef<T>, keyof AnimatedCardProps<T>>) => {
  const Component = as || 'div';
  const { pressProps, pressStyle } = usePressAnimation({ scale, translateY, disabled });

  const baseClasses = 'transition-apple cursor-pointer select-none';
  const shadowClasses = withShadow ? 'shadow-sm hover:shadow-md' : '';
  const highlightClasses = withHighlight ? 'relative overflow-hidden' : '';

  return (
    <Component
      className={`${baseClasses} ${shadowClasses} ${highlightClasses} ${className}`}
      style={pressStyle}
      onClick={disabled ? undefined : onClick}
      {...pressProps}
      {...props}
    >
      {withHighlight && (
        <div
          className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 transition-opacity duration-180 pointer-events-none"
          style={{
            opacity: pressStyle.transform.includes('scale(0.97)') ? 1 : 0,
          }}
        />
      )}
      {children}
    </Component>
  );
};
