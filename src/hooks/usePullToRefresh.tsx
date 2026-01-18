import { useState, useRef, useCallback, TouchEvent } from "react";
import { useHaptics } from "@/hooks/useHaptics";

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
}

export const usePullToRefresh = ({ onRefresh, threshold = 80 }: UsePullToRefreshOptions) => {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const scrollTop = useRef(0);
  const hasTriggeredHaptic = useRef(false);
  const { mediumImpact, successNotification } = useHaptics();

  const handleTouchStart = useCallback((e: TouchEvent<HTMLDivElement>, currentScrollTop: number) => {
    startY.current = e.touches[0].clientY;
    scrollTop.current = currentScrollTop;
    hasTriggeredHaptic.current = false;
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent<HTMLDivElement>) => {
    if (scrollTop.current > 0 || isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    
    if (diff > 0) {
      setIsPulling(true);
      const newDistance = Math.min(diff * 0.5, threshold * 1.5);
      setPullDistance(newDistance);
      
      // Trigger haptic when crossing the threshold
      if (newDistance >= threshold && !hasTriggeredHaptic.current) {
        hasTriggeredHaptic.current = true;
        mediumImpact();
      } else if (newDistance < threshold && hasTriggeredHaptic.current) {
        hasTriggeredHaptic.current = false;
      }
    }
  }, [isRefreshing, threshold, mediumImpact]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
        successNotification();
      } finally {
        setIsRefreshing(false);
      }
    }
    setIsPulling(false);
    setPullDistance(0);
    hasTriggeredHaptic.current = false;
  }, [pullDistance, threshold, isRefreshing, onRefresh, successNotification]);

  return {
    isPulling,
    isRefreshing,
    pullDistance,
    pullProgress: Math.min(pullDistance / threshold, 1),
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
};
