import { useCallback, useRef, useState } from 'react';

interface UsePressAnimationOptions {
  scale?: number;
  translateY?: number;
  disabled?: boolean;
}

export const usePressAnimation = (options: UsePressAnimationOptions = {}) => {
  const { scale = 0.97, translateY = 1, disabled = false } = options;
  const [isPressed, setIsPressed] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const handlePressStart = useCallback(() => {
    if (disabled) return;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsPressed(true);
  }, [disabled]);

  const handlePressEnd = useCallback(() => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => {
      setIsPressed(false);
    }, 50);
  }, [disabled]);

  const pressProps = {
    onMouseDown: handlePressStart,
    onMouseUp: handlePressEnd,
    onMouseLeave: handlePressEnd,
    onTouchStart: handlePressStart,
    onTouchEnd: handlePressEnd,
    onTouchCancel: handlePressEnd,
  };

  const pressStyle = isPressed
    ? {
        transform: `scale(${scale}) translateY(${translateY}px)`,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      }
    : {
        transform: 'scale(1) translateY(0)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
      };

  return {
    isPressed,
    pressProps,
    pressStyle,
  };
};
