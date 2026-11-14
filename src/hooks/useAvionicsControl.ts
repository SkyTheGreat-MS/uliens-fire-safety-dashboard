import { useCallback, useEffect, useRef, type KeyboardEvent, type PointerEvent } from 'react';

type Options = {
  armed: boolean;
  step: number;
  onArm: () => void;
  onAdjust: (amount: number) => void;
  onDisarm: () => void;
};

export function useAvionicsControl({ armed, step, onArm, onAdjust, onDisarm }: Options) {
  const ref = useRef<HTMLDivElement>(null);
  const lastY = useRef<number | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || !armed) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      onAdjust(event.deltaY < 0 ? step : -step);
    };
    element.addEventListener('wheel', onWheel, { passive: false });
    return () => element.removeEventListener('wheel', onWheel);
  }, [armed, onAdjust, step]);

  const onKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onDisarm();
      return;
    }
    const direction = event.key === 'ArrowUp' || event.key === 'ArrowRight' ? 1 : event.key === 'ArrowDown' || event.key === 'ArrowLeft' ? -1 : 0;
    if (!direction) return;
    event.preventDefault();
    if (!armed) onArm();
    onAdjust(direction * step * (event.shiftKey ? 10 : 1));
  }, [armed, onAdjust, onArm, onDisarm, step]);

  const onPointerDown = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (!armed || (event.target as HTMLElement).closest('button')) return;
    lastY.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  }, [armed]);

  const onPointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (!armed || lastY.current === null || event.buttons === 0) return;
    const delta = lastY.current - event.clientY;
    if (Math.abs(delta) < 5) return;
    const increments = Math.trunc(delta / 5);
    if (increments) {
      onAdjust(increments * step);
      lastY.current -= increments * 5;
    }
  }, [armed, onAdjust, step]);

  const onPointerUp = useCallback(() => { lastY.current = null; }, []);

  return { ref, onKeyDown, onPointerDown, onPointerMove, onPointerUp };
}
